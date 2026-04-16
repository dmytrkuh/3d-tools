import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { CadObject } from '../types';
import { useCadStore } from '../store/cadStore';
import { applyObjectTransform, createGeometry } from '../lib/geometry';
import { mmToScene, sceneToMm } from '../lib/units';

type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbit: OrbitControls;
  transform: TransformControls;
  meshes: Map<string, THREE.Mesh>;
  modelRoot: THREE.Group;
  animationFrame: number;
  keys: Set<string>;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
};

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const objects = useCadStore((state) => state.objects);
  const selectedIds = useCadStore((state) => state.selectedIds);
  const transformMode = useCadStore((state) => state.transformMode);
  const cameraMode = useCadStore((state) => state.cameraMode);
  const snapStepMm = useCadStore((state) => state.snapStepMm);
  const snapEnabled = useCadStore((state) => state.snapEnabled);
  const selectObject = useCadStore((state) => state.selectObject);
  const updateObject = useCadStore((state) => state.updateObject);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0c111d);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0c111d, 1.5, 5);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 100);
    camera.position.set(0.18, 0.16, 0.22);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.8));

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(1, 2, 1);
    scene.add(key);

    const grid = new THREE.GridHelper(1, 100, 0x496075, 0x1e293b);
    scene.add(grid);
    scene.add(new THREE.AxesHelper(0.08));

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.target.set(0, 0.04, 0);
    orbit.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(0.85);
    transform.addEventListener('dragging-changed', (event) => {
      orbit.enabled = !event.value;
    });
    scene.add(transform.getHelper());

    const runtime: Runtime = {
      renderer,
      scene,
      camera,
      orbit,
      transform,
      meshes: new Map(),
      modelRoot,
      animationFrame: 0,
      keys: new Set(),
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
    };
    runtimeRef.current = runtime;

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const onPointerDown = (event: PointerEvent) => {
      if ((transform as unknown as { dragging?: boolean }).dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      runtime.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      runtime.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      runtime.raycaster.setFromCamera(runtime.pointer, camera);
      const hits = runtime.raycaster.intersectObjects([...runtime.meshes.values()], false);
      selectObject(hits[0]?.object.userData.id ?? null, event.shiftKey);
    };

    const onKeyDown = (event: KeyboardEvent) => runtime.keys.add(event.key.toLowerCase());
    const onKeyUp = (event: KeyboardEvent) => runtime.keys.delete(event.key.toLowerCase());

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    resize();

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const state = useCadStore.getState();
      if (state.cameraMode === 'fly') {
        updateFlyCamera(runtime, delta);
      } else {
        orbit.update();
      }
      renderer.render(scene, camera);
      runtime.animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(runtime.animationFrame);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      transform.dispose();
      orbit.dispose();
      renderer.dispose();
      runtime.meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        disposeMaterial(mesh.material);
      });
      runtimeRef.current = null;
    };
  }, [selectObject]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    syncObjects(runtime, objects, selectedIds);
  }, [objects, selectedIds]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const selectedMesh = selectedIds.length === 1 ? runtime.meshes.get(selectedIds[0]) : undefined;
    if (selectedMesh) {
      runtime.transform.attach(selectedMesh);
    } else {
      runtime.transform.detach();
    }
  }, [selectedIds, objects]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.transform.setMode(transformMode);
  }, [transformMode]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const snap = snapEnabled ? mmToScene(snapStepMm) : null;
    runtime.transform.setTranslationSnap(snap);
    runtime.transform.setRotationSnap(snapEnabled ? THREE.MathUtils.degToRad(5) : null);
    runtime.transform.setScaleSnap(snapEnabled ? 0.05 : null);
  }, [snapEnabled, snapStepMm]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return undefined;
    const onMouseUp = () => {
      const selectedId = useCadStore.getState().selectedIds[0];
      const mesh = selectedId ? runtime.meshes.get(selectedId) : undefined;
      if (!selectedId || !mesh) return;
      updateObject(selectedId, {
        position: {
          x: sceneToMm(mesh.position.x),
          y: sceneToMm(mesh.position.y),
          z: sceneToMm(mesh.position.z),
        },
        rotation: {
          x: THREE.MathUtils.radToDeg(mesh.rotation.x),
          y: THREE.MathUtils.radToDeg(mesh.rotation.y),
          z: THREE.MathUtils.radToDeg(mesh.rotation.z),
        },
        scale: {
          x: mesh.scale.x,
          y: mesh.scale.y,
          z: mesh.scale.z,
        },
      });
    };
    runtime.transform.addEventListener('mouseUp', onMouseUp);
    return () => runtime.transform.removeEventListener('mouseUp', onMouseUp);
  }, [updateObject]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.orbit.enabled = cameraMode === 'orbit';
  }, [cameraMode]);

  return <canvas ref={canvasRef} className="viewport-canvas" />;
}

function syncObjects(runtime: Runtime, objects: CadObject[], selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  const liveIds = new Set(objects.map((object) => object.id));
  runtime.meshes.forEach((mesh, id) => {
    if (!liveIds.has(id)) {
      runtime.modelRoot.remove(mesh);
      mesh.geometry.dispose();
      disposeMaterial(mesh.material);
      runtime.meshes.delete(id);
    }
  });

  objects.forEach((object) => {
    let mesh = runtime.meshes.get(object.id);
    if (!mesh) {
      mesh = new THREE.Mesh();
      mesh.userData.id = object.id;
      runtime.meshes.set(object.id, mesh);
      runtime.modelRoot.add(mesh);
    }

    mesh.geometry.dispose();
    mesh.geometry = createGeometry(object);
    disposeMaterial(mesh.material);
    mesh.material = createMaterial(object, selectedSet.has(object.id));
    mesh.visible = object.visible;
    mesh.name = object.name;
    applyObjectTransform(mesh, object);
  });
}

function createMaterial(object: CadObject, selected: boolean) {
  const material = new THREE.MeshStandardMaterial({
    color: selected ? '#f7d774' : object.color,
    emissive: selected ? '#2f2300' : '#000000',
    roughness: 0.72,
    metalness: 0.05,
    transparent: object.role === 'hole',
    opacity: object.role === 'hole' ? 0.42 : 1,
    depthWrite: object.role !== 'hole',
  });

  if (object.role === 'hole') {
    material.wireframe = false;
  }

  return material;
}

function updateFlyCamera(runtime: Runtime, delta: number) {
  const speed = runtime.keys.has('shift') ? 0.55 : 0.18;
  const amount = speed * delta;
  const direction = new THREE.Vector3();
  const side = new THREE.Vector3();

  runtime.camera.getWorldDirection(direction);
  side.crossVectors(direction, runtime.camera.up).normalize();

  if (runtime.keys.has('w')) runtime.camera.position.addScaledVector(direction, amount);
  if (runtime.keys.has('s')) runtime.camera.position.addScaledVector(direction, -amount);
  if (runtime.keys.has('a')) runtime.camera.position.addScaledVector(side, -amount);
  if (runtime.keys.has('d')) runtime.camera.position.addScaledVector(side, amount);
  if (runtime.keys.has('q')) runtime.camera.position.y -= amount;
  if (runtime.keys.has('e')) runtime.camera.position.y += amount;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }
  material.dispose();
}
