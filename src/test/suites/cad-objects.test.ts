import { describe, expect, it } from 'vitest';
import type { PrimitiveKind } from '../../types';
import { cloneCadObject, createCadObject } from '../../lib/cadObjects';

const primitiveKinds: PrimitiveKind[] = [
  'box',
  'roundedBox',
  'cylinder',
  'tube',
  'sphere',
  'wedge',
  'slot',
  'screwHole',
  'magnetPocket',
  'text',
  'svg',
  'mesh',
];

describe('CAD objects suite', () => {
  it.each(primitiveKinds)('creates valid default object for %s', (kind) => {
    const object = createCadObject(kind);

    expect(object.id).toMatch(/^obj-/);
    expect(object.kind).toBe(kind);
    expect(object.visible).toBe(true);
    expect(object.dimensions.x).toBeGreaterThan(0);
    expect(object.dimensions.y).toBeGreaterThan(0);
    expect(object.dimensions.z).toBeGreaterThan(0);
    expect(object.position.y).toBe(object.dimensions.z / 2);
  });

  it.each(['slot', 'screwHole', 'magnetPocket'] as PrimitiveKind[])('marks %s as a hole cutter', (kind) => {
    const object = createCadObject(kind);

    expect(object.role).toBe('hole');
    expect(object.color).toBe('#ff5a66');
  });

  it('sets specialized defaults for rounded box, tube, text, and SVG', () => {
    expect(createCadObject('roundedBox').bevel).toBe(4);
    expect(createCadObject('tube').innerRadius).toBe(12);
    expect(createCadObject('text').text).toBe('Label');
    expect(createCadObject('svg').svgMarkup).toContain('<svg');
  });

  it('allows explicit overrides', () => {
    const object = createCadObject('box', {
      name: 'Custom',
      role: 'reference',
      dimensions: { x: 1, y: 2, z: 3 },
      position: { x: 4, y: 5, z: 6 },
    });

    expect(object.name).toBe('Custom');
    expect(object.role).toBe('reference');
    expect(object.dimensions).toEqual({ x: 1, y: 2, z: 3 });
    expect(object.position).toEqual({ x: 4, y: 5, z: 6 });
  });

  it('clones deeply with new identity and offset position', () => {
    const source = createCadObject('svg', {
      name: 'Badge',
      position: { x: 1, y: 2, z: 3 },
      mesh: { position: [0, 0, 0, 1, 0, 0, 0, 1, 0] },
    });
    const clone = cloneCadObject(source);

    expect(clone.id).not.toBe(source.id);
    expect(clone.name).toBe('Badge copy');
    expect(clone.position).toEqual({ x: 11, y: 2, z: 13 });
    clone.mesh!.position[0] = 99;
    expect(source.mesh!.position[0]).toBe(0);
  });
});
