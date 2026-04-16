import * as THREE from 'three';
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import type { BooleanOperation, CadObject } from '../types';
import { applyObjectTransform, createGeometry } from './geometry';

type ManifoldModuleFactory = typeof import('manifold-3d')['default'];
type ManifoldApi = Awaited<ReturnType<ManifoldModuleFactory>>;
type ManifoldSolid = InstanceType<ManifoldApi['Manifold']>;

let apiPromise: Promise<ManifoldApi> | null = null;

export type ManifoldBooleanResult = {
  group: THREE.Group;
  warnings: string[];
};

export async function buildManifoldBooleanGroup(
  objects: CadObject[],
  operation: BooleanOperation = 'subtract',
): Promise<ManifoldBooleanResult> {
  const api = await getManifoldApi();
  const group = new THREE.Group();
  const warnings: string[] = [];
  const solids = objects.filter((object) => object.visible && object.role !== 'hole');
  const holes = objects.filter((object) => object.visible && object.role === 'hole');
  const allocated: Array<{ delete: () => void }> = [];

  if (solids.length === 0) {
    warnings.push('No solid objects to export.');
    return { group, warnings };
  }

  try {
    const solidManifolds = solids.map((object) => {
      const manifold = objectToManifold(api, object);
      allocated.push(manifold);
      return manifold;
    });

    let result = api.Manifold.union(solidManifolds);
    allocated.push(result);

    if (holes.length > 0) {
      const holeManifolds = holes.map((object) => {
        const manifold = objectToManifold(api, object);
        allocated.push(manifold);
        return manifold;
      });

      const cutter = holeManifolds.length === 1 ? holeManifolds[0] : api.Manifold.union(holeManifolds);
      if (cutter !== holeManifolds[0]) allocated.push(cutter);

      result =
        operation === 'subtract'
          ? result.subtract(cutter)
          : operation === 'union'
            ? result.add(cutter)
            : result.intersect(cutter);
      allocated.push(result);
    }

    if (result.isEmpty()) {
      warnings.push('Manifold boolean result is empty.');
    }

    const mesh = new THREE.Mesh(manifoldToGeometry(result), new THREE.MeshStandardMaterial({ color: '#d9f99d' }));
    mesh.name = 'Manifold boolean result';
    group.add(mesh);
  } finally {
    allocated.forEach((item) => item.delete());
  }

  return { group, warnings };
}

async function getManifoldApi() {
  apiPromise ??= import('manifold-3d').then(({ default: ManifoldModule }) =>
    ManifoldModule({
      locateFile: () => wasmUrl,
    }).then((api) => {
      api.setup();
      api.setCircularSegments(48);
      return api;
    }),
  );
  return apiPromise;
}

function objectToManifold(api: ManifoldApi, object: CadObject): ManifoldSolid {
  const geometry = createGeometry(object).toNonIndexed();
  const matrix = new THREE.Matrix4();
  const proxy = new THREE.Object3D();
  applyObjectTransform(proxy, object);
  proxy.updateMatrixWorld(true);
  matrix.copy(proxy.matrixWorld);
  geometry.applyMatrix4(matrix);
  geometry.computeVertexNormals();

  const position = geometry.getAttribute('position');
  const vertProperties = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    vertProperties[i * 3] = position.getX(i);
    vertProperties[i * 3 + 1] = position.getY(i);
    vertProperties[i * 3 + 2] = position.getZ(i);
  }

  const triVerts = new Uint32Array(position.count);
  for (let i = 0; i < triVerts.length; i += 1) {
    triVerts[i] = i;
  }

  const mesh = new api.Mesh({
    numProp: 3,
    vertProperties,
    triVerts,
    tolerance: 1e-8,
  });
  mesh.merge();
  geometry.dispose();

  const manifold = new api.Manifold(mesh);
  const status = manifold.status();
  if (status !== 'NoError') {
    manifold.delete();
    throw new Error(`${object.name} is not accepted by Manifold: ${status}`);
  }
  return manifold;
}

function manifoldToGeometry(manifold: ManifoldSolid) {
  const mesh = manifold.getMesh();
  const positions = new Float32Array(mesh.numVert * 3);
  for (let vertex = 0; vertex < mesh.numVert; vertex += 1) {
    const source = vertex * mesh.numProp;
    positions[vertex * 3] = mesh.vertProperties[source];
    positions[vertex * 3 + 1] = mesh.vertProperties[source + 1];
    positions[vertex * 3 + 2] = mesh.vertProperties[source + 2];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(Array.from(mesh.triVerts));
  geometry.computeVertexNormals();
  return geometry;
}
