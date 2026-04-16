import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import helvetikerFont from 'three/examples/fonts/helvetiker_regular.typeface.json';
import type { CadObject } from '../types';
import { mmToScene } from './units';

const font = new FontLoader().parse(helvetikerFont);

export function createGeometry(object: CadObject): THREE.BufferGeometry {
  const x = mmToScene(object.dimensions.x);
  const y = mmToScene(object.dimensions.y);
  const z = mmToScene(object.dimensions.z);
  const segments = object.segments ?? 48;

  switch (object.kind) {
    case 'box':
      return new THREE.BoxGeometry(x, y, z);
    case 'roundedBox':
      return new RoundedBoxGeometry(x, y, z, 5, mmToScene(object.bevel ?? 3));
    case 'cylinder':
    case 'screwHole':
    case 'magnetPocket':
      return new THREE.CylinderGeometry(x / 2, x / 2, z, segments);
    case 'tube': {
      const outer = x / 2;
      const inner = mmToScene(object.innerRadius ?? object.dimensions.x * 0.3);
      return createTubeGeometry(outer, inner, z, segments);
    }
    case 'sphere':
      return new THREE.SphereGeometry(x / 2, segments, Math.max(16, Math.floor(segments / 2)));
    case 'wedge':
      return createWedgeGeometry(x, y, z);
    case 'slot':
      return createSlotGeometry(x, y, z, segments);
    case 'text':
      return createTextGeometry(object);
    case 'svg':
      return createSvgGeometry(object);
    case 'mesh':
      return createSerializedGeometry(object);
    default:
      return new THREE.BoxGeometry(x, y, z);
  }
}

function createSerializedGeometry(object: CadObject) {
  const mesh = object.mesh;
  if (!mesh?.position.length) {
    return new THREE.BoxGeometry(mmToScene(10), mmToScene(10), mmToScene(10));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.position, 3));
  if (mesh.normal?.length === mesh.position.length) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normal, 3));
  }
  if (mesh.index?.length) {
    geometry.setIndex(mesh.index);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createWedgeGeometry(width: number, height: number, depth: number) {
  const hw = width / 2;
  const hd = depth / 2;
  const vertices = new Float32Array([
    -hw, 0, -hd,
    hw, 0, -hd,
    hw, 0, hd,
    -hw, 0, hd,
    -hw, height, -hd,
    hw, height, -hd,
  ]);

  const indices = [
    0, 1, 2, 0, 2, 3,
    0, 4, 5, 0, 5, 1,
    1, 5, 2,
    2, 5, 4, 2, 4, 3,
    3, 4, 0,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.center();
  return geometry;
}

function createTubeGeometry(outerRadius: number, innerRadius: number, height: number, segments: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: segments,
    steps: 1,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createSlotGeometry(width: number, height: number, depth: number, segments: number) {
  const radius = height / 2;
  const halfLine = Math.max(0.001, width / 2 - radius);
  const shape = new THREE.Shape();
  shape.moveTo(-halfLine, -radius);
  shape.lineTo(halfLine, -radius);
  shape.absarc(halfLine, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-halfLine, radius);
  shape.absarc(-halfLine, 0, radius, Math.PI / 2, -Math.PI / 2, false);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: Math.max(12, Math.floor(segments / 3)),
  });
  geometry.rotateX(Math.PI / 2);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createTextGeometry(object: CadObject) {
  const geometry = new TextGeometry(object.text?.trim() || 'Text', {
    font,
    size: mmToScene(Math.max(1, object.dimensions.z)),
    depth: mmToScene(Math.max(0.2, object.dimensions.y)),
    curveSegments: Math.max(4, Math.floor((object.segments ?? 24) / 4)),
    bevelEnabled: (object.bevel ?? 0) > 0,
    bevelSize: mmToScene(Math.min(object.bevel ?? 0, object.dimensions.y / 3)),
    bevelThickness: mmToScene(Math.min(object.bevel ?? 0, object.dimensions.y / 3)),
    bevelSegments: 2,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createSvgGeometry(object: CadObject) {
  const loader = new SVGLoader();
  const shapes = loader.parse(object.svgMarkup || '').paths.flatMap((path) => SVGLoader.createShapes(path));
  if (shapes.length === 0) {
    return new THREE.BoxGeometry(mmToScene(10), mmToScene(object.dimensions.y), mmToScene(10));
  }

  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: mmToScene(Math.max(0.2, object.dimensions.y)),
    bevelEnabled: (object.bevel ?? 0) > 0,
    bevelSize: mmToScene(Math.min(object.bevel ?? 0, object.dimensions.y / 3)),
    bevelThickness: mmToScene(Math.min(object.bevel ?? 0, object.dimensions.y / 3)),
    bevelSegments: 2,
  });

  geometry.scale(mmToScene(1), mmToScene(1), 1);
  geometry.rotateX(-Math.PI / 2);
  geometry.center();
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  if (box) {
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetX = mmToScene(Math.max(1, object.dimensions.x));
    const targetZ = mmToScene(Math.max(1, object.dimensions.z));
    const scale = Math.min(targetX / Math.max(size.x, 0.000001), targetZ / Math.max(size.z, 0.000001));
    geometry.scale(scale, 1, scale);
  }

  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export function applyObjectTransform(mesh: THREE.Object3D, object: CadObject) {
  mesh.position.set(mmToScene(object.position.x), mmToScene(object.position.y), mmToScene(object.position.z));
  mesh.rotation.set(
    THREE.MathUtils.degToRad(object.rotation.x),
    THREE.MathUtils.degToRad(object.rotation.y),
    THREE.MathUtils.degToRad(object.rotation.z),
  );
  mesh.scale.set(object.scale.x, object.scale.y, object.scale.z);
}
