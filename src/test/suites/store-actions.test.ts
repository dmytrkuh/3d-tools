import { beforeEach, describe, expect, it } from 'vitest';
import { createCadObject } from '../../lib/cadObjects';
import { loadFreshStore } from '../helpers/storeTestUtils';

const context = await loadFreshStore();
const { useCadStore, initialObjects, resetStore } = context;

describe('store actions suite', () => {
  beforeEach(() => resetStore());

  it('adds all templates and selects their created objects', () => {
    for (const template of ['boxWithLid', 'hook', 'lBracket', 'cableClip', 'organizerTray'] as const) {
      resetStore();
      useCadStore.getState().addTemplate(template);
      expect(useCadStore.getState().selectedIds.length).toBeGreaterThanOrEqual(2);
      expect(useCadStore.getState().objects.length).toBeGreaterThan(initialObjects.length);
    }
  });

  it('adds imported SVG as selected SVG object', () => {
    useCadStore.getState().addImportedSvg('<svg viewBox="0 0 1 1"><path d="M0 0h1v1h-1z"/></svg>', 'Logo');
    const state = useCadStore.getState();
    const selected = state.objects.find((object) => object.id === state.selectedIds[0]);

    expect(selected?.kind).toBe('svg');
    expect(selected?.name).toBe('Logo');
  });

  it('imports project objects and normalizes invalid dimensions and positions', () => {
    const source = createCadObject('box', {
      position: { x: 1.4, y: 2.6, z: 3.5 },
      dimensions: { x: -1, y: Number.NaN, z: 5 },
    });
    useCadStore.getState().importProject([source]);
    const imported = useCadStore.getState().objects[0];

    expect(imported.position).toEqual({ x: 1, y: 3, z: 4 });
    expect(imported.dimensions.x).toBe(0.1);
    expect(imported.dimensions.y).toBe(0.1);
    expect(imported.dimensions.z).toBe(5);
  });

  it('supports selection append, toggle, and clear', () => {
    const [first, second] = useCadStore.getState().objects;

    useCadStore.getState().selectObject(second.id);
    expect(useCadStore.getState().selectedIds).toEqual([second.id]);

    useCadStore.getState().selectObject(first.id, true);
    expect(useCadStore.getState().selectedIds).toEqual([second.id, first.id]);

    useCadStore.getState().selectObject(first.id, true);
    expect(useCadStore.getState().selectedIds).toEqual([second.id]);

    useCadStore.getState().selectObject(null);
    expect(useCadStore.getState().selectedIds).toEqual([]);
  });

  it('updates objects with snap and clamp normalization', () => {
    const selectedId = useCadStore.getState().selectedIds[0];
    useCadStore.getState().updateObject(selectedId, {
      position: { x: 10.4, y: 20.6, z: 30.5 },
      dimensions: { x: -10, y: 0, z: 4 },
    });
    const selected = useCadStore.getState().objects.find((object) => object.id === selectedId)!;

    expect(selected.position).toEqual({ x: 10, y: 21, z: 31 });
    expect(selected.dimensions).toEqual({ x: 0.1, y: 0.1, z: 4 });
  });

  it('updates selected object and no-ops without selection', () => {
    const selectedId = useCadStore.getState().selectedIds[0];
    useCadStore.getState().updateSelectedObject({ name: 'Renamed' });
    expect(useCadStore.getState().objects.find((object) => object.id === selectedId)?.name).toBe('Renamed');

    useCadStore.getState().selectObject(null);
    const before = structuredClone(useCadStore.getState().objects);
    useCadStore.getState().updateSelectedObject({ name: 'Ignored' });
    expect(useCadStore.getState().objects).toEqual(before);
  });

  it('deletes and duplicates selected objects', () => {
    useCadStore.getState().duplicateSelected();
    expect(useCadStore.getState().objects).toHaveLength(initialObjects.length + 1);
    expect(useCadStore.getState().selectedIds).toHaveLength(1);

    useCadStore.getState().deleteSelected();
    expect(useCadStore.getState().objects).toHaveLength(initialObjects.length);
    expect(useCadStore.getState().selectedIds).toEqual([]);
  });

  it('mirrors selected objects on each axis', () => {
    const selectedId = useCadStore.getState().selectedIds[0];
    useCadStore.getState().mirrorSelected('x');
    useCadStore.getState().mirrorSelected('y');
    useCadStore.getState().mirrorSelected('z');
    const selected = useCadStore.getState().objects.find((object) => object.id === selectedId)!;

    expect(selected.scale).toEqual({ x: -1, y: -1, z: -1 });
  });

  it('repeats selected objects with gap and guards count below two', () => {
    const before = useCadStore.getState().objects.length;
    useCadStore.getState().repeatSelected('x', 1, 8);
    expect(useCadStore.getState().objects).toHaveLength(before);

    useCadStore.getState().repeatSelected('x', 4, 8);
    expect(useCadStore.getState().objects).toHaveLength(before + 3);
    expect(useCadStore.getState().selectedIds).toHaveLength(4);
  });

  it('aligns selected objects by side and distributes centers', () => {
    const a = createCadObject('box', { position: { x: 0, y: 5, z: 0 }, dimensions: { x: 10, y: 10, z: 10 } });
    const b = createCadObject('box', { position: { x: 50, y: 8, z: 0 }, dimensions: { x: 20, y: 16, z: 10 } });
    const c = createCadObject('box', { position: { x: 90, y: 9, z: 0 }, dimensions: { x: 10, y: 18, z: 10 } });
    resetStore([a, b, c], [a.id, b.id, c.id]);

    useCadStore.getState().alignSelected('y', 'min');
    expect(useCadStore.getState().objects.map((object) => object.position.y - object.dimensions.y / 2)).toEqual([0, 0, 0]);

    useCadStore.getState().distributeSelected('x');
    expect(useCadStore.getState().objects.map((object) => object.position.x)).toEqual([0, 45, 90]);
  });

  it('sets modes and snap options', () => {
    useCadStore.getState().setTransformMode('rotate');
    useCadStore.getState().setCameraMode('fly');
    useCadStore.getState().setBooleanMode('intersect');
    useCadStore.getState().toggleSnap();
    useCadStore.getState().setSnapStep(-5);

    const state = useCadStore.getState();
    expect(state.transformMode).toBe('rotate');
    expect(state.cameraMode).toBe('fly');
    expect(state.booleanMode).toBe('intersect');
    expect(state.snapEnabled).toBe(false);
    expect(state.snapStepMm).toBe(0.1);
  });
});
