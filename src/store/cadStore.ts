import { create } from 'zustand';
import * as THREE from 'three';
import type {
  Axis,
  BooleanOperation,
  CadObject,
  CameraMode,
  ExtrudeOperation,
  PressPullTarget,
  PrimitiveKind,
  PrintIssue,
  TransformMode,
} from '../types';
import { cloneCadObject, createCadObject } from '../lib/cadObjects';
import { clampMm, snapMm } from '../lib/units';
import { buildRobustBooleanGroup } from '../lib/csg';
import { createBakedMeshObject } from '../lib/meshSerialization';
import { analyzeObjectGeometry } from '../lib/printability';

type CadState = {
  objects: CadObject[];
  selectedIds: string[];
  past: CadSnapshot[];
  future: CadSnapshot[];
  transformMode: TransformMode;
  cameraMode: CameraMode;
  snapEnabled: boolean;
  snapStepMm: number;
  booleanMode: BooleanOperation;
  printIssues: PrintIssue[];
  addPrimitive: (kind: PrimitiveKind) => void;
  addImportedSvg: (svgMarkup: string, name?: string) => void;
  importProject: (objects: CadObject[]) => void;
  selectObject: (id: string | null, append?: boolean) => void;
  updateObject: (id: string, patch: Partial<CadObject>) => void;
  updateSelectedObject: (patch: Partial<CadObject>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  mirrorSelected: (axis: Axis) => void;
  repeatSelected: (axis: Axis, count: number, gapMm: number) => void;
  extrudeSelected: (distanceMm: number, operation?: ExtrudeOperation) => void;
  pressPullSelected: (distanceMm: number, target?: PressPullTarget, axis?: Axis) => void;
  filletSelected: (radiusMm: number) => void;
  alignSelected: (axis: Axis, side: 'min' | 'center' | 'max') => void;
  distributeSelected: (axis: Axis) => void;
  setTransformMode: (mode: TransformMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  setBooleanMode: (mode: BooleanOperation) => void;
  toggleSnap: () => void;
  setSnapStep: (value: number) => void;
  runPrintabilityCheck: () => void;
  bakeBooleanResult: () => Promise<void>;
  undo: () => void;
  redo: () => void;
};

type CadSnapshot = {
  objects: CadObject[];
  selectedIds: string[];
};

const starterObjects: CadObject[] = [];

export const useCadStore = create<CadState>((set, get) => ({
  objects: starterObjects,
  selectedIds: [],
  past: [],
  future: [],
  transformMode: 'translate',
  cameraMode: 'orbit',
  snapEnabled: true,
  snapStepMm: 1,
  booleanMode: 'subtract',
  printIssues: [],

  addPrimitive: (kind) => {
    const object = createCadObject(kind);
    set((state) => withHistory(state, {
      objects: [...state.objects, object],
      selectedIds: [object.id],
    }));
  },

  addImportedSvg: (svgMarkup, name = 'Imported SVG') => {
    const object = createCadObject('svg', {
      name,
      svgMarkup,
      dimensions: { x: 70, y: 3, z: 70 },
      position: { x: 0, y: 1.5, z: 0 },
    });
    set((state) => withHistory(state, {
      objects: [...state.objects, object],
      selectedIds: [object.id],
    }));
  },

  importProject: (objects) => {
    const normalized = objects.map((object) => normalizeObject(object));
    set((state) => withHistory(state, {
      objects: normalized,
      selectedIds: normalized[0] ? [normalized[0].id] : [],
      printIssues: [],
    }));
  },

  selectObject: (id, append = false) => {
    set((state) => {
      if (!id) return { selectedIds: [] };
      if (!append) return { selectedIds: [id] };
      const selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id];
      return { selectedIds };
    });
  },

  updateObject: (id, patch) => {
    set((state) => withHistory(state, {
      objects: state.objects.map((object) => (object.id === id ? normalizeObject({ ...object, ...patch }) : object)),
    }));
  },

  updateSelectedObject: (patch) => {
    const id = get().selectedIds[0];
    if (!id) return;
    get().updateObject(id, patch);
  },

  deleteSelected: () => {
    const ids = new Set(get().selectedIds);
    set((state) => withHistory(state, {
      objects: state.objects.filter((object) => !ids.has(object.id)),
      selectedIds: [],
    }));
  },

  duplicateSelected: () => {
    const ids = new Set(get().selectedIds);
    const copies = get().objects.filter((object) => ids.has(object.id)).map(cloneCadObject);
    set((state) => withHistory(state, {
      objects: [...state.objects, ...copies],
      selectedIds: copies.map((object) => object.id),
    }));
  },

  mirrorSelected: (axis) => {
    const ids = new Set(get().selectedIds);
    set((state) => withHistory(state, {
      objects: state.objects.map((object) => {
        if (!ids.has(object.id)) return object;
        return {
          ...object,
          scale: {
            ...object.scale,
            [axis]: object.scale[axis] * -1,
          },
        };
      }),
    }));
  },

  repeatSelected: (axis, count, gapMm) => {
    const source = get().objects.find((object) => object.id === get().selectedIds[0]);
    if (!source || count < 2) return;
    const copies = Array.from({ length: count - 1 }, (_, index) => {
      const copy = cloneCadObject(source);
      const offset = (source.dimensions[axis] + gapMm) * (index + 1);
      copy.position = { ...copy.position, [axis]: copy.position[axis] + offset };
      copy.name = `${source.name} repeat ${index + 2}`;
      return copy;
    });
    set((state) => withHistory(state, {
      objects: [...state.objects, ...copies],
      selectedIds: [source.id, ...copies.map((object) => object.id)],
    }));
  },

  extrudeSelected: (distanceMm, operation = 'newBody') => {
    const ids = new Set(get().selectedIds);
    if (!ids.size || !Number.isFinite(distanceMm) || distanceMm === 0) return;
    set((state) => withHistory(state, {
      objects: state.objects.map((object) => {
        if (!ids.has(object.id) || object.kind === 'sphere') return object;
        const base = object.position.y - object.dimensions.y / 2;
        const direction = Math.sign(distanceMm);
        const nextHeight = clampMm(Math.abs(distanceMm));
        const role = operation === 'cut' ? 'hole' : object.role === 'hole' ? 'hole' : 'solid';
        return {
          ...object,
          role,
          color: operation === 'cut' ? '#ff5a66' : object.color,
          dimensions: { ...object.dimensions, y: nextHeight },
          position: { ...object.position, y: base + (nextHeight / 2) * direction },
        };
      }),
    }));
  },

  pressPullSelected: (distanceMm, target = 'face', axis = 'y') => {
    const ids = new Set(get().selectedIds);
    if (!ids.size || !Number.isFinite(distanceMm) || distanceMm === 0) return;
    set((state) => withHistory(state, {
      objects: state.objects.map((object) => {
        if (!ids.has(object.id)) return object;
        if (target === 'profile') return extrudedObject(object, distanceMm, 'newBody');
        if (target === 'edge') return filletedObject(object, Math.max(0, (object.bevel ?? 0) + distanceMm));
        const nextSize = clampMm(object.dimensions[axis] + distanceMm);
        const delta = nextSize - object.dimensions[axis];
        return {
          ...object,
          dimensions: { ...object.dimensions, [axis]: nextSize },
          position: { ...object.position, [axis]: object.position[axis] + delta / 2 },
        };
      }),
    }));
  },

  filletSelected: (radiusMm) => {
    const ids = new Set(get().selectedIds);
    if (!ids.size || !Number.isFinite(radiusMm)) return;
    set((state) => withHistory(state, {
      objects: state.objects.map((object) => (ids.has(object.id) ? filletedObject(object, radiusMm) : object)),
    }));
  },

  alignSelected: (axis, side) => {
    const selected = selectedObjects(get());
    if (selected.length < 2) return;
    const anchor = selected[0];
    const target = edge(anchor, axis, side);
    set((state) => withHistory(state, {
      objects: state.objects.map((object) => {
        if (!selected.some((item) => item.id === object.id) || object.id === anchor.id) return object;
        return { ...object, position: { ...object.position, [axis]: positionForEdge(object, axis, side, target) } };
      }),
    }));
  },

  distributeSelected: (axis) => {
    const selected = selectedObjects(get()).sort((a, b) => a.position[axis] - b.position[axis]);
    if (selected.length < 3) return;
    const first = selected[0].position[axis];
    const last = selected[selected.length - 1].position[axis];
    const step = (last - first) / (selected.length - 1);
    set((state) => withHistory(state, {
      objects: state.objects.map((object) => {
        const index = selected.findIndex((item) => item.id === object.id);
        if (index < 0) return object;
        return { ...object, position: { ...object.position, [axis]: first + step * index } };
      }),
    }));
  },

  setTransformMode: (transformMode) => set({ transformMode }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setBooleanMode: (booleanMode) => set({ booleanMode }),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  setSnapStep: (value) => set({ snapStepMm: clampMm(value, 0.1) }),

  runPrintabilityCheck: () => {
    const issues = get().objects.flatMap(checkObject);
    const holeCount = get().objects.filter((object) => object.role === 'hole').length;
    if (holeCount > 0) {
      issues.push({
        id: 'holes-info',
        severity: 'info',
        message: `${holeCount} hole object(s) will be applied by the boolean export pipeline.`,
      });
    }
    set({ printIssues: issues });
  },

  bakeBooleanResult: async () => {
    const { group, warnings } = await buildRobustBooleanGroup(get().objects, get().booleanMode);
    const mesh = group.children.find((child): child is THREE.Mesh => child instanceof THREE.Mesh);
    if (!mesh) {
      set({
        printIssues: warnings.map((message, index) => ({
          id: `bake-warning-${index}`,
          severity: 'error',
          message,
        })),
      });
      return;
    }

    const baked = createBakedMeshObject(mesh.geometry, 'Baked boolean result');
    set((state) => withHistory(state, {
      objects: [baked],
      selectedIds: [baked.id],
      printIssues: warnings.map((message, index) => ({
        id: `bake-warning-${index}`,
        severity: 'warning',
        message,
      })),
    }));
  },

  undo: () => {
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return {};
      return {
        objects: structuredClone(previous.objects),
        selectedIds: [...previous.selectedIds],
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, 80),
        printIssues: [],
      };
    });
  },

  redo: () => {
    set((state) => {
      const next = state.future[0];
      if (!next) return {};
      return {
        objects: structuredClone(next.objects),
        selectedIds: [...next.selectedIds],
        past: [...state.past, snapshot(state)].slice(-80),
        future: state.future.slice(1),
        printIssues: [],
      };
    });
  },
}));

function snapshot(state: Pick<CadState, 'objects' | 'selectedIds'>): CadSnapshot {
  return {
    objects: structuredClone(state.objects),
    selectedIds: [...state.selectedIds],
  };
}

function withHistory(
  state: CadState,
  patch: Partial<Pick<CadState, 'objects' | 'selectedIds' | 'printIssues'>>,
): Partial<CadState> {
  return {
    ...patch,
    past: [...state.past, snapshot(state)].slice(-80),
    future: [],
  };
}

function selectedObjects(state: Pick<CadState, 'objects' | 'selectedIds'>) {
  const ids = new Set(state.selectedIds);
  return state.objects.filter((object) => ids.has(object.id));
}

function normalizeObject(object: CadObject): CadObject {
  const legacyRole = object.role as CadObject['role'] | 'template';
  const role = legacyRole === 'template' ? 'reference' : legacyRole;
  return {
    ...object,
    role,
    position: {
      x: snapMm(object.position.x),
      y: snapMm(object.position.y),
      z: snapMm(object.position.z),
    },
    dimensions: {
      x: clampMm(object.dimensions.x),
      y: clampMm(object.dimensions.y),
      z: clampMm(object.dimensions.z),
    },
  };
}

function extrudedObject(object: CadObject, distanceMm: number, operation: ExtrudeOperation): CadObject {
  if (object.kind === 'sphere') return object;
  const base = object.position.y - object.dimensions.y / 2;
  const direction = Math.sign(distanceMm);
  const nextHeight = clampMm(Math.abs(distanceMm));
  const role = operation === 'cut' ? 'hole' : object.role === 'hole' ? 'hole' : 'solid';
  return {
    ...object,
    role,
    color: operation === 'cut' ? '#ff5a66' : object.color,
    dimensions: { ...object.dimensions, y: nextHeight },
    position: { ...object.position, y: base + (nextHeight / 2) * direction },
  };
}

function filletedObject(object: CadObject, radiusMm: number): CadObject {
  const radius = Math.min(clampMm(radiusMm), Math.max(0.1, Math.min(object.dimensions.x, object.dimensions.y, object.dimensions.z) / 2));
  if (object.kind === 'box') {
    return { ...object, kind: 'roundedBox', bevel: radius };
  }
  if (object.kind === 'roundedBox' || object.kind === 'text' || object.kind === 'svg') {
    return { ...object, bevel: radius };
  }
  return object;
}

function edge(object: CadObject, axis: Axis, side: 'min' | 'center' | 'max') {
  if (side === 'center') return object.position[axis];
  const half = object.dimensions[axis] / 2;
  return side === 'min' ? object.position[axis] - half : object.position[axis] + half;
}

function positionForEdge(object: CadObject, axis: Axis, side: 'min' | 'center' | 'max', target: number) {
  if (side === 'center') return target;
  const half = object.dimensions[axis] / 2;
  return side === 'min' ? target + half : target - half;
}

function checkObject(object: CadObject): PrintIssue[] {
  const issues: PrintIssue[] = [];
  const minDimension = Math.min(object.dimensions.x, object.dimensions.y, object.dimensions.z);
  const health = analyzeObjectGeometry(object);

  if (minDimension < 0.8) {
    issues.push({
      id: `${object.id}-thin`,
      objectId: object.id,
      severity: 'warning',
      message: `${object.name}: wall/detail under 0.8 mm may be fragile on FDM printers.`,
    });
  }

  if (object.position.y - object.dimensions.y / 2 < -0.01) {
    issues.push({
      id: `${object.id}-below-bed`,
      objectId: object.id,
      severity: 'error',
      message: `${object.name}: part is below the print bed.`,
    });
  }

  if (object.kind === 'wedge' && object.rotation.x === 0) {
    issues.push({
      id: `${object.id}-overhang`,
      objectId: object.id,
      severity: 'info',
      message: `${object.name}: sloped face may need support depending on orientation.`,
    });
  }

  if (health.boundaryEdges > 0 && object.role !== 'hole') {
    issues.push({
      id: `${object.id}-boundary`,
      objectId: object.id,
      severity: 'warning',
      message: `${object.name}: ${health.boundaryEdges} open edge(s) found; STL may not be watertight.`,
    });
  }

  if (health.nonManifoldEdges > 0) {
    issues.push({
      id: `${object.id}-non-manifold`,
      objectId: object.id,
      severity: 'error',
      message: `${object.name}: ${health.nonManifoldEdges} non-manifold edge(s) found.`,
    });
  }

  if (health.triangles > 250_000) {
    issues.push({
      id: `${object.id}-heavy`,
      objectId: object.id,
      severity: 'info',
      message: `${object.name}: high triangle count may slow booleans and slicers.`,
    });
  }

  return issues;
}
