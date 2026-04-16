import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFreshStore } from '../helpers/storeTestUtils';

const context = await loadFreshStore();
const { useCadStore, initialObjects, resetStore } = context;

describe('store history suite', () => {
  beforeEach(() => resetStore());

  it('does nothing when undo or redo stacks are empty', () => {
    const before = structuredClone(useCadStore.getState().objects);

    useCadStore.getState().undo();
    useCadStore.getState().redo();

    expect(useCadStore.getState().objects).toEqual(before);
  });

  it('supports undo and redo for add/update/delete operations', () => {
    const originalName = useCadStore.getState().objects[0].name;

    useCadStore.getState().addPrimitive('box');
    useCadStore.getState().updateObject(useCadStore.getState().selectedIds[0], { name: 'Changed' });
    useCadStore.getState().deleteSelected();

    expect(useCadStore.getState().objects).toHaveLength(initialObjects.length);

    useCadStore.getState().undo();
    expect(useCadStore.getState().objects.some((object) => object.name === 'Changed')).toBe(true);

    useCadStore.getState().undo();
    expect(useCadStore.getState().objects.some((object) => object.name === 'Changed')).toBe(false);

    useCadStore.getState().undo();
    expect(useCadStore.getState().objects).toHaveLength(initialObjects.length);
    expect(useCadStore.getState().objects[0].name).toBe(originalName);

    useCadStore.getState().redo();
    expect(useCadStore.getState().objects).toHaveLength(initialObjects.length + 1);
  });

  it('clears redo future when a new history operation happens', () => {
    useCadStore.getState().addPrimitive('box');
    useCadStore.getState().undo();
    expect(useCadStore.getState().future).toHaveLength(1);

    useCadStore.getState().addPrimitive('sphere');
    expect(useCadStore.getState().future).toHaveLength(0);
  });

  it('bakes boolean result into one selected mesh object', async () => {
    await useCadStore.getState().bakeBooleanResult();
    const state = useCadStore.getState();

    expect(state.objects).toHaveLength(1);
    expect(state.objects[0].kind).toBe('mesh');
    expect(state.selectedIds).toEqual([state.objects[0].id]);
    expect(state.past.length).toBeGreaterThan(0);
  });

  it('reports bake errors when boolean result has no mesh', async () => {
    const { buildRobustBooleanGroup } = await import('../../lib/csg');
    const mocked = vi.mocked(buildRobustBooleanGroup);
    mocked.mockResolvedValueOnce({ group: new (await import('three')).Group(), warnings: ['No mesh'] });

    await useCadStore.getState().bakeBooleanResult();

    expect(useCadStore.getState().printIssues[0]).toMatchObject({
      severity: 'error',
      message: 'No mesh',
    });
  });
});
