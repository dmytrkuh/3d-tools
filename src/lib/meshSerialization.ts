import * as THREE from 'three';
import type { CadObject, SerializedGeometry } from '../types';
import { createCadObject } from './cadObjects';
import { createId } from './id';
import { sceneToMm } from './units';

export function serializeGeometry(geometry: THREE.BufferGeometry): SerializedGeometry {
  const nonIndexed = geometry.toNonIndexed();
  nonIndexed.computeVertexNormals();
  const position = Array.from(nonIndexed.getAttribute('position').array as ArrayLike<number>);
  const normal = Array.from(nonIndexed.getAttribute('normal').array as ArrayLike<number>);
  nonIndexed.dispose();
  return { position, normal };
}

export function createBakedMeshObject(geometry: THREE.BufferGeometry, name = 'Baked boolean result'): CadObject {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox?.getSize(size);

  return createCadObject('mesh', {
    id: createId('mesh'),
    name,
    role: 'solid',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions: {
      x: Math.max(0.1, sceneToMm(size.x)),
      y: Math.max(0.1, sceneToMm(size.y)),
      z: Math.max(0.1, sceneToMm(size.z)),
    },
    mesh: serializeGeometry(geometry),
    color: '#9ee493',
  });
}
