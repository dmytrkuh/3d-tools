import { describe, expect, it } from 'vitest';
import { GRID_STEP_MM, MM_TO_SCENE, SCENE_TO_MM, clampMm, mmToScene, sceneToMm, snapMm } from '../../lib/units';

describe('units suite', () => {
  it('exposes stable unit constants', () => {
    expect(MM_TO_SCENE).toBe(0.001);
    expect(SCENE_TO_MM).toBe(1000);
    expect(GRID_STEP_MM).toBe(1);
  });

  it.each([
    [0, 0],
    [1, 0.001],
    [25, 0.025],
    [-10, -0.01],
  ])('converts %d mm to scene units', (mm, scene) => {
    expect(mmToScene(mm)).toBe(scene);
    expect(sceneToMm(scene)).toBe(mm);
  });

  it.each([
    [10.24, 0.5, 10],
    [10.26, 0.5, 10.5],
    [9.9, 1, 10],
    [-1.2, 1, -1],
  ])('snaps %d with step %d to %d', (value, step, expected) => {
    expect(snapMm(value, step)).toBe(expected);
  });

  it('clamps invalid or too-small dimensions', () => {
    expect(clampMm(-5, 0.8)).toBe(0.8);
    expect(clampMm(Number.NaN, 0.8)).toBe(0.8);
    expect(clampMm(Number.POSITIVE_INFINITY, 0.8)).toBe(0.8);
    expect(clampMm(2, 0.8)).toBe(2);
  });
});
