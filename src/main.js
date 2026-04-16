import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'https://unpkg.com/three@0.180.0/examples/jsm/controls/FlyControls.js';
import { TransformControls } from 'https://unpkg.com/three@0.180.0/examples/jsm/controls/TransformControls.js';
import { RoundedBoxGeometry } from 'https://unpkg.com/three@0.180.0/examples/jsm/geometries/RoundedBoxGeometry.js';
import { STLExporter } from 'https://unpkg.com/three@0.180.0/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'https://unpkg.com/three@0.180.0/examples/jsm/exporters/OBJExporter.js';

const MM_TO_SCENE = 0.001;
const SNAP_MM = 1;
const SNAP = SNAP_MM * MM_TO_SCENE;

const canvas = document.querySelector('#viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setClearColor(0x0b1220);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);
camera.position.set(0.7, 0.5, 0.7);

scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(1, 2, 1);
scene.add(dir);

const grid = new THREE.GridHelper(2, 200, 0x334155, 0x1e293b);
scene.add(grid);

const axes = new THREE.AxesHelper(0.2);
scene.add(axes);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 0.05, 0);
orbit.update();

const fly = new FlyControls(camera, renderer.domElement);
fly.movementSpeed = 0.35;
fly.rollSpeed = 0.5;
fly.dragToLook = true;
fly.enabled = false;

const transform = new TransformControls(camera, renderer.domElement);
transform.setSize(0.9);
transform.setTranslationSnap(SNAP);
transform.setRotationSnap(THREE.MathUtils.degToRad(5));
transform.setScaleSnap(0.05);
transform.addEventListener('dragging-changed', (event) => {
  orbit.enabled = !event.value && !fly.enabled;
});
transform.addEventListener('objectChange', refreshInspector);
scene.add(transform);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const models = [];
let selected = null;

const material = new THREE.MeshStandardMaterial({
  color: 0x60a5fa,
  roughness: 0.65,
  metalness: 0.05,
});

const primitives = {
  box: () => new THREE.BoxGeometry(0.06, 0.04, 0.04),
  roundedBox: () => new RoundedBoxGeometry(0.06, 0.04, 0.04, 4, 0.004),
  cylinder: () => new THREE.CylinderGeometry(0.02, 0.02, 0.05, 32),
  tube: () => new THREE.CylinderGeometry(0.026, 0.026, 0.05, 48, 1, true),
  sphere: () => new THREE.SphereGeometry(0.025, 32, 16),
  wedge: () => {
    const g = new THREE.BoxGeometry(0.06, 0.04, 0.04);
    g.translate(0, 0.02, 0);
    const m = new THREE.Matrix4().set(
      1, 0, 0, 0,
      0, 1, 0, 0,
      -0.8, 0, 1, 0,
      0, 0, 0, 1,
    );
    g.applyMatrix4(m);
    return g;
  },
};

function createPrimitive(kind) {
  const geometry = primitives[kind]?.();
  if (!geometry) return;

  const mesh = new THREE.Mesh(geometry, material.clone());
  mesh.position.set(0, 0.02, 0);
  mesh.userData.dimensions = { w: 60, h: 40, d: 40 };
  mesh.userData.kind = kind;
  scene.add(mesh);
  models.push(mesh);
  setSelected(mesh);
}

function setSelected(mesh) {
  selected = mesh;
  transform.detach();

  models.forEach((m) => m.material.emissive?.setHex(0x000000));
  if (selected) {
    selected.material.emissive = new THREE.Color(0x1d4ed8);
    transform.attach(selected);
  }

  refreshInspector();
}

function mm(v) {
  return Number((v / MM_TO_SCENE).toFixed(2));
}

function sceneUnits(mmValue) {
  return mmValue * MM_TO_SCENE;
}

const inputs = {
  x: document.getElementById('x'),
  y: document.getElementById('y'),
  z: document.getElementById('z'),
  w: document.getElementById('w'),
  h: document.getElementById('h'),
  d: document.getElementById('d'),
};

function refreshInspector() {
  if (!selected) {
    Object.values(inputs).forEach((input) => (input.value = ''));
    return;
  }

  inputs.x.value = mm(selected.position.x);
  inputs.y.value = mm(selected.position.y);
  inputs.z.value = mm(selected.position.z);

  const dim = selected.userData.dimensions ?? { w: 60, h: 40, d: 40 };
  inputs.w.value = dim.w;
  inputs.h.value = dim.h;
  inputs.d.value = dim.d;
}

function updateSize() {
  if (!selected) return;

  const next = {
    w: Math.max(1, Number(inputs.w.value) || 1),
    h: Math.max(1, Number(inputs.h.value) || 1),
    d: Math.max(1, Number(inputs.d.value) || 1),
  };

  const current = selected.userData.dimensions ?? { w: 60, h: 40, d: 40 };
  selected.scale.set(next.w / current.w, next.h / current.h, next.d / current.d);
  selected.userData.dimensions = next;

  selected.position.set(
    sceneUnits(Number(inputs.x.value) || 0),
    sceneUnits(Number(inputs.y.value) || 0),
    sceneUnits(Number(inputs.z.value) || 0),
  );
}

function duplicateSelected() {
  if (!selected) return;
  const copy = selected.clone();
  copy.material = selected.material.clone();
  copy.position.x += 0.02;
  copy.userData = JSON.parse(JSON.stringify(selected.userData));
  scene.add(copy);
  models.push(copy);
  setSelected(copy);
}

function mirrorSelected() {
  if (!selected) return;
  selected.scale.x *= -1;
}

function deleteSelected() {
  if (!selected) return;
  const idx = models.indexOf(selected);
  if (idx >= 0) models.splice(idx, 1);
  scene.remove(selected);
  setSelected(null);
}

function setTransformMode(mode) {
  transform.setMode(mode);
}

function exportModel(type) {
  if (!models.length) return;
  const group = new THREE.Group();
  models.forEach((m) => group.add(m.clone()));

  if (type === 'stl') {
    const exporter = new STLExporter();
    const data = exporter.parse(group);
    downloadFile('model.stl', new Blob([data], { type: 'model/stl' }));
    return;
  }

  if (type === 'obj') {
    const exporter = new OBJExporter();
    const data = exporter.parse(group);
    downloadFile('model.obj', new Blob([data], { type: 'text/plain' }));
  }
}

function downloadFile(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll('[data-primitive]').forEach((btn) => {
  btn.addEventListener('click', () => createPrimitive(btn.dataset.primitive));
});

document.getElementById('mode-move').addEventListener('click', () => setTransformMode('translate'));
document.getElementById('mode-rotate').addEventListener('click', () => setTransformMode('rotate'));
document.getElementById('mode-scale').addEventListener('click', () => setTransformMode('scale'));
document.getElementById('duplicate').addEventListener('click', duplicateSelected);
document.getElementById('mirror').addEventListener('click', mirrorSelected);
document.getElementById('delete').addEventListener('click', deleteSelected);
document.getElementById('apply-size').addEventListener('click', updateSize);
document.getElementById('export-stl').addEventListener('click', () => exportModel('stl'));
document.getElementById('export-obj').addEventListener('click', () => exportModel('obj'));

renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(models, false);
  setSelected(hits[0]?.object ?? null);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Delete') deleteSelected();
  if (event.key.toLowerCase() === 'g') setTransformMode('translate');
  if (event.key.toLowerCase() === 'r') setTransformMode('rotate');
  if (event.key.toLowerCase() === 's') setTransformMode('scale');
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault();
    duplicateSelected();
  }
  if (event.key.toLowerCase() === 'm') mirrorSelected();
  if (event.key === '`' || event.key === '~') {
    fly.enabled = !fly.enabled;
    orbit.enabled = !fly.enabled;
  }
});

window.addEventListener('resize', resize);

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

resize();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (fly.enabled) {
    fly.update(dt);
  } else {
    orbit.update();
  }

  renderer.render(scene, camera);
}

animate();
createPrimitive('box');
