import { beforeEach, describe, expect, it } from 'vitest';
import { createCadObject } from '../../lib/cadObjects';
import { loadFreshStore } from '../helpers/storeTestUtils';

const context = await loadFreshStore();
const { useCadStore, resetStore } = context;

function seedOne() {
  useCadStore.getState().addPrimitive('box');
  return useCadStore.getState().selectedIds[0];
}

describe('store actions suite', () => {
  beforeEach(() => resetStore());

  it('starts from an empty workspace', () => {
    expect(useCadStore.getState().objects).toEqual([]);
    expect(useCadStore.getState().selectedIds).toEqual([]);
  });

  it('adds primitives and selects the new object', () => {
    useCadStore.getState().addPrimitive('cylinder');
    const selected = useCadStore.getState().objects.find((object) => object.id === useCadStore.getState().selectedIds[0]);

    expect(useCadStore.getState().objects).toHaveLength(1);
    expect(selected?.kind).toBe('cylinder');
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
    const first = createCadObject('box');
    const second = createCadObject('sphere');
    resetStore([first, second], [first.id]);

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
    const selectedId = seedOne();
    useCadStore.getState().updateObject(selectedId, {
      position: { x: 10.4, y: 20.6, z: 30.5 },
      dimensions: { x: -10, y: 0, z: 4 },
    });
    const selected = useCadStore.getState().objects.find((object) => object.id === selectedId)!;

    expect(selected.position).toEqual({ x: 10, y: 21, z: 31 });
    expect(selected.dimensions).toEqual({ x: 0.1, y: 0.1, z: 4 });
  });

  it('updates selected object and no-ops without selection', () => {
    const selectedId = seedOne();
    useCadStore.getState().updateSelectedObject({ name: 'Renamed' });
    expect(useCadStore.getState().objects.find((object) => object.id === selectedId)?.name).toBe('Renamed');

    useCadStore.getState().selectObject(null);
    const before = structuredClone(useCadStore.getState().objects);
    useCadStore.getState().updateSelectedObject({ name: 'Ignored' });
    expect(useCadStore.getState().objects).toEqual(before);
  });

  it('deletes and duplicates selected objects', () => {
    seedOne();
    useCadStore.getState().duplicateSelected();
    expect(useCadStore.getState().objects).toHaveLength(2);
    expect(useCadStore.getState().selectedIds).toHaveLength(1);

    useCadStore.getState().deleteSelected();
    expect(useCadStore.getState().objects).toHaveLength(1);
    expect(useCadStore.getState().selectedIds).toEqual([]);
  });

  it('mirrors selected objects on each axis', () => {
    const selectedId = seedOne();
    useCadStore.getState().mirrorSelected('x');
    useCadStore.getState().mirrorSelected('y');
    useCadStore.getState().mirrorSelected('z');
    const selected = useCadStore.getState().objects.find((object) => object.id === selectedId)!;

    expect(selected.scale).toEqual({ x: -1, y: -1, z: -1 });
  });

  it('repeats selected objects with gap and guards count below two', () => {
    seedOne();
    const before = useCadStore.getState().objects.length;
    useCadStore.getState().repeatSelected('x', 1, 8);
    expect(useCadStore.getState().objects).toHaveLength(before);

    useCadStore.getState().repeatSelected('x', 4, 8);
    expect(useCadStore.getState().objects).toHaveLength(before + 3);
    expect(useCadStore.getState().selectedIds).toHaveLength(4);
  });

  it('extrudes selected profiles by distance and supports cut role', () => {
    const selectedId = seedOne();
    const before = useCadStore.getState().objects.find((object) => object.id === selectedId)!;

    useCadStore.getState().extrudeSelected(12, 'cut');
    const after = useCadStore.getState().objects.find((object) => object.id === selectedId)!;

    expect(after.dimensions.y).toBe(12);
    expect(after.position.y).toBe(before.position.y - before.dimensions.y / 2 + 6);
    expect(after.role).toBe('hole');
  });

  it('press-pulls faces by axis and profiles through extrude behavior', () => {
    const selectedId = seedOne();
    const before = useCadStore.getState().objects.find((object) => object.id === selectedId)!;

    useCadStore.getState().pressPullSelected(7, 'face', 'z');
    let after = useCadStore.getState().objects.find((object) => object.id === selectedId)!;
    expect(after.dimensions.z).toBe(before.dimensions.z + 7);
    expect(after.position.z).toBe(before.position.z + 3.5);

    useCadStore.getState().pressPullSelected(9, 'profile', 'y');
    after = useCadStore.getState().objects.find((object) => object.id === selectedId)!;
    expect(after.dimensions.y).toBe(9);
  });

  it('guards extrude for spheres and invalid press-pull distances', () => {
    useCadStore.getState().addPrimitive('sphere');
    const selectedId = useCadStore.getState().selectedIds[0];
    const before = structuredClone(useCadStore.getState().objects.find((object) => object.id === selectedId));

    useCadStore.getState().extrudeSelected(10);
    useCadStore.getState().pressPullSelected(Number.NaN);

    expect(useCadStore.getState().objects.find((object) => object.id === selectedId)).toEqual(before);
  });

  it('rounds box edges through fillet and press-pull edge mode', () => {
    const selectedId = seedOne();

    useCadStore.getState().filletSelected(3);
    let selected = useCadStore.getState().objects.find((object) => object.id === selectedId)!;
    expect(selected.kind).toBe('roundedBox');
    expect(selected.bevel).toBe(3);

    useCadStore.getState().pressPullSelected(2, 'edge', 'y');
    selected = useCadStore.getState().objects.find((object) => object.id === selectedId)!;
    expect(selected.bevel).toBe(5);
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
