export const MM_TO_SCENE = 0.001;
export const SCENE_TO_MM = 1000;
export const GRID_STEP_MM = 1;

export function mmToScene(value: number) {
  return value * MM_TO_SCENE;
}

export function sceneToMm(value: number) {
  return value * SCENE_TO_MM;
}

export function snapMm(value: number, step = GRID_STEP_MM) {
  return Math.round(value / step) * step;
}

export function clampMm(value: number, min = 0.1) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}
