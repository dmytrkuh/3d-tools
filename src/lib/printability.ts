import * as THREE from 'three';
import type { CadObject } from '../types';
import { createGeometry } from './geometry';

export type GeometryHealth = {
  triangles: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
};

export function analyzeObjectGeometry(object: CadObject): GeometryHealth {
  const geometry = createGeometry(object).toNonIndexed();
  const position = geometry.getAttribute('position');
  const edgeCounts = new Map<string, number>();

  for (let i = 0; i < position.count; i += 3) {
    addEdge(edgeCounts, position, i, i + 1);
    addEdge(edgeCounts, position, i + 1, i + 2);
    addEdge(edgeCounts, position, i + 2, i);
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  edgeCounts.forEach((count) => {
    if (count === 1) boundaryEdges += 1;
    if (count > 2) nonManifoldEdges += 1;
  });

  const triangles = position.count / 3;
  geometry.dispose();
  return { triangles, boundaryEdges, nonManifoldEdges };
}

function addEdge(edgeCounts: Map<string, number>, position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, a: number, b: number) {
  const va = vertexKey(position, a);
  const vb = vertexKey(position, b);
  const key = va < vb ? `${va}|${vb}` : `${vb}|${va}`;
  edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
}

function vertexKey(position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number) {
  return [
    Math.round(position.getX(index) * 1_000_000),
    Math.round(position.getY(index) * 1_000_000),
    Math.round(position.getZ(index) * 1_000_000),
  ].join(',');
}
