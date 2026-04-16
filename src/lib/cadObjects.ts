import type { CadObject, PrimitiveKind, Vec3 } from '../types';
import { createId } from './id';

const DEFAULT_SIZE: Record<PrimitiveKind, Vec3> = {
  box: { x: 60, y: 40, z: 30 },
  roundedBox: { x: 60, y: 40, z: 30 },
  cylinder: { x: 30, y: 30, z: 50 },
  tube: { x: 36, y: 36, z: 50 },
  sphere: { x: 40, y: 40, z: 40 },
  wedge: { x: 60, y: 40, z: 30 },
  slot: { x: 50, y: 16, z: 20 },
  screwHole: { x: 5, y: 5, z: 25 },
  magnetPocket: { x: 10, y: 10, z: 4 },
  text: { x: 60, y: 6, z: 2 },
  svg: { x: 60, y: 3, z: 60 },
  mesh: { x: 10, y: 10, z: 10 },
};

const DEFAULT_COLOR: Record<CadObject['role'], string> = {
  solid: '#58a6ff',
  hole: '#ff5a66',
  reference: '#9ee493',
};

const SOLID_LABELS: Record<PrimitiveKind, string> = {
  box: 'Box',
  roundedBox: 'Rounded box',
  cylinder: 'Cylinder',
  tube: 'Tube',
  sphere: 'Sphere',
  wedge: 'Wedge',
  slot: 'Slot hole',
  screwHole: 'Screw hole',
  magnetPocket: 'Magnet pocket',
  text: 'Text',
  svg: 'SVG contour',
  mesh: 'Baked mesh',
};

export function createCadObject(kind: PrimitiveKind, overrides: Partial<CadObject> = {}): CadObject {
  const role = kind === 'slot' || kind === 'screwHole' || kind === 'magnetPocket' ? 'hole' : 'solid';
  const dimensions = DEFAULT_SIZE[kind];

  return {
    id: createId(),
    name: `${SOLID_LABELS[kind]} ${kind === 'text' ? '' : ''}`.trim(),
    kind,
    role,
    position: { x: 0, y: dimensions.z / 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions,
    radius: kind === 'roundedBox' ? 4 : kind === 'cylinder' || kind === 'sphere' ? dimensions.x / 2 : undefined,
    innerRadius: kind === 'tube' ? 12 : undefined,
    bevel: kind === 'roundedBox' ? 4 : 0,
    segments: 48,
    text: kind === 'text' ? 'Label' : undefined,
    svgMarkup: kind === 'svg' ? '<svg viewBox="0 0 100 100"><path d="M10 10h80v80h-80z"/></svg>' : undefined,
    color: DEFAULT_COLOR[role],
    visible: true,
    ...overrides,
  };
}

export function cloneCadObject(object: CadObject): CadObject {
  return {
    ...structuredClone(object),
    id: createId(),
    name: `${object.name} copy`,
    position: {
      x: object.position.x + 10,
      y: object.position.y,
      z: object.position.z + 10,
    },
  };
}
