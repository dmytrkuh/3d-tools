import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { strToU8, zipSync } from 'fflate';
import { FileForRelThumbnail, fileForContentTypes, to3dmodelSimple } from '@jscadui/3mf-export';
import type { CadObject } from '../types';
import type { BooleanOperation } from '../types';
import { buildRobustBooleanGroup } from './csg';
import { SCENE_TO_MM } from './units';

const IDENTITY_3MF_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export async function buildExportGroup(objects: CadObject[], operation: BooleanOperation = 'subtract') {
  return buildRobustBooleanGroup(objects, operation);
}

export async function exportStl(objects: CadObject[], operation: BooleanOperation = 'subtract') {
  const exporter = new STLExporter();
  const { group, warnings } = await buildExportGroup(objects, operation);
  warnings.forEach((warning) => console.warn(warning));
  const result = exporter.parse(toMillimeterGroup(group), { binary: false });
  downloadFile('model.stl', new Blob([result], { type: 'model/stl' }));
}

export async function exportObj(objects: CadObject[], operation: BooleanOperation = 'subtract') {
  const exporter = new OBJExporter();
  const { group, warnings } = await buildExportGroup(objects, operation);
  warnings.forEach((warning) => console.warn(warning));
  const result = exporter.parse(toMillimeterGroup(group));
  downloadFile('model.obj', new Blob([result], { type: 'text/plain' }));
}

export async function export3mf(objects: CadObject[], operation: BooleanOperation = 'subtract') {
  const { group, warnings } = await buildExportGroup(objects, operation);
  warnings.forEach((warning) => console.warn(warning));
  group.updateMatrixWorld(true);

  const meshes: Array<{ id: string; vertices: Float32Array; indices: Uint32Array; name: string; transform: number[] }> = [];
  let id = 1;
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !(child.geometry instanceof THREE.BufferGeometry)) return;
    meshes.push({
      id: String(id++),
      name: child.name || '3D Tools mesh',
      ...meshTo3mf(child),
      transform: IDENTITY_3MF_MATRIX,
    });
  });

  const model = to3dmodelSimple(meshes, {
    unit: 'millimeter',
    title: '3D Tools CAD model',
    application: '3D Tools CAD',
    creationDate: new Date(),
  });

  const rels = new FileForRelThumbnail();
  rels.add3dModel('/3D/3dmodel.model');

  const zip = zipSync({
    [fileForContentTypes.name]: [strToU8(fileForContentTypes.content), { level: 0 }],
    [rels.name]: [strToU8(rels.content), { level: 0 }],
    '3D/3dmodel.model': [strToU8(model), { level: 0 }],
  });

  const bytes = new Uint8Array(zip);
  downloadFile('model.3mf', new Blob([bytes.buffer], { type: 'model/3mf' }));
}

export function exportProject(objects: CadObject[]) {
  downloadFile(
    'model.3dtools.json',
    new Blob([JSON.stringify({ version: 1, objects }, null, 2)], { type: 'application/json' }),
  );
}

function toMillimeterGroup(group: THREE.Group) {
  const clone = group.clone(true);
  clone.scale.multiplyScalar(SCENE_TO_MM);
  clone.updateMatrixWorld(true);
  return clone;
}

function meshTo3mf(mesh: THREE.Mesh<THREE.BufferGeometry>) {
  const geometry = mesh.geometry.index ? mesh.geometry.clone() : mesh.geometry.toNonIndexed();
  geometry.applyMatrix4(mesh.matrixWorld);
  geometry.scale(SCENE_TO_MM, SCENE_TO_MM, SCENE_TO_MM);

  const position = geometry.getAttribute('position');
  const vertices = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    vertices[i * 3] = position.getX(i);
    vertices[i * 3 + 1] = position.getY(i);
    vertices[i * 3 + 2] = position.getZ(i);
  }

  let indices: Uint32Array;
  if (geometry.index) {
    indices = new Uint32Array(geometry.index.array);
  } else {
    indices = new Uint32Array(position.count);
    for (let i = 0; i < indices.length; i += 1) indices[i] = i;
  }

  geometry.dispose();
  return { vertices, indices };
}

function downloadFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
