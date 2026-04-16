import * as THREE from 'three';
import { vi } from 'vitest';
import type { CadObject } from '../../types';

vi.mock('../../lib/csg', () => ({
  buildRobustBooleanGroup: vi.fn(async () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.03), new THREE.MeshStandardMaterial()));
    return { group, warnings: [] };
  }),
}));

export type CadStoreModule = typeof import('../../store/cadStore');

export async function loadFreshStore() {
  vi.resetModules();
  const module = await import('../../store/cadStore');
  const initialObjects = structuredClone(module.useCadStore.getState().objects);
  const initialSelectedIds = [...module.useCadStore.getState().selectedIds];

  function resetStore(objects: CadObject[] = initialObjects, selectedIds = initialSelectedIds) {
    module.useCadStore.setState({
      objects: structuredClone(objects),
      selectedIds: [...selectedIds],
      past: [],
      future: [],
      printIssues: [],
      transformMode: 'translate',
      cameraMode: 'orbit',
      snapEnabled: true,
      snapStepMm: 1,
      booleanMode: 'subtract',
    });
  }

  resetStore();
  return { ...module, initialObjects, initialSelectedIds, resetStore };
}
