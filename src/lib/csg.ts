import * as THREE from 'three';
import { ADDITION, Brush, Evaluator, INTERSECTION, SUBTRACTION } from 'three-bvh-csg';
import type { BooleanOperation, CadObject } from '../types';
import { applyObjectTransform, createGeometry } from './geometry';
import { buildManifoldBooleanGroup } from './manifoldKernel';

const operationMap = {
  union: ADDITION,
  subtract: SUBTRACTION,
  intersect: INTERSECTION,
} satisfies Record<BooleanOperation, number>;

export type BooleanResult = {
  group: THREE.Group;
  warnings: string[];
};

export function buildBooleanGroup(objects: CadObject[], operation: BooleanOperation = 'subtract'): BooleanResult {
  const group = new THREE.Group();
  const warnings: string[] = [];
  const solids = objects.filter((object) => object.visible && object.role !== 'hole');
  const holes = objects.filter((object) => object.visible && object.role === 'hole');

  if (solids.length === 0) {
    warnings.push('No solid objects to export.');
    return { group, warnings };
  }

  try {
    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    let result = toBrush(solids[0]);
    for (const solid of solids.slice(1)) {
      result = evaluator.evaluate(result, toBrush(solid), ADDITION) as Brush;
      result.updateMatrixWorld(true);
    }

    const op = operationMap[operation];
    for (const hole of holes) {
      result = evaluator.evaluate(result, toBrush(hole), op) as Brush;
      result.updateMatrixWorld(true);
    }

    const mesh = new THREE.Mesh(cleanExportGeometry(result.geometry), new THREE.MeshStandardMaterial({ color: '#d9f99d' }));
    mesh.name = 'Boolean result';
    mesh.updateMatrixWorld(true);
    group.add(mesh);
  } catch (error) {
    warnings.push(`Boolean evaluation failed, exported raw solids instead. ${error instanceof Error ? error.message : ''}`.trim());
    solids.forEach((object) => group.add(toRawMesh(object)));
  }

  return { group, warnings };
}

export async function buildRobustBooleanGroup(objects: CadObject[], operation: BooleanOperation = 'subtract'): Promise<BooleanResult> {
  try {
    return await buildManifoldBooleanGroup(objects, operation);
  } catch (error) {
    const fallback = buildBooleanGroup(objects, operation);
    fallback.warnings.unshift(
      `Manifold kernel failed; used mesh CSG fallback. ${error instanceof Error ? error.message : ''}`.trim(),
    );
    return fallback;
  }
}

export function buildRawGroup(objects: CadObject[]) {
  const group = new THREE.Group();
  objects
    .filter((object) => object.visible && object.role !== 'hole')
    .forEach((object) => group.add(toRawMesh(object)));
  return group;
}

function toBrush(object: CadObject) {
  const geometry = prepareCsgGeometry(createGeometry(object));
  const brush = new Brush(geometry, new THREE.MeshStandardMaterial({ color: object.color }));
  brush.name = object.name;
  applyObjectTransform(brush, object);
  brush.updateMatrixWorld(true);
  return brush;
}

function toRawMesh(object: CadObject) {
  const mesh = new THREE.Mesh(createGeometry(object), new THREE.MeshStandardMaterial({ color: object.color }));
  mesh.name = object.name;
  applyObjectTransform(mesh, object);
  mesh.updateMatrixWorld(true);
  return mesh;
}

function prepareCsgGeometry(geometry: THREE.BufferGeometry) {
  const prepared = geometry.toNonIndexed();
  for (const attribute of Object.keys(prepared.attributes)) {
    if (attribute !== 'position' && attribute !== 'normal') {
      prepared.deleteAttribute(attribute);
    }
  }
  prepared.clearGroups();
  prepared.computeVertexNormals();
  return prepared;
}

function cleanExportGeometry(geometry: THREE.BufferGeometry) {
  const clean = geometry.clone();
  clean.setDrawRange(0, Infinity);
  clean.clearGroups();
  clean.computeVertexNormals();
  return clean;
}
