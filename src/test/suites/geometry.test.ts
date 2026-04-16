import { Box3, Mesh, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { PrimitiveKind } from '../../types';
import { createCadObject } from '../../lib/cadObjects';
import { applyObjectTransform, createGeometry } from '../../lib/geometry';
import { sceneToMm } from '../../lib/units';

const geometryKinds: PrimitiveKind[] = [
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

describe('geometry suite', () => {
  it.each(geometryKinds)('creates finite geometry for %s', (kind) => {
    const geometry = createGeometry(
      createCadObject(kind, {
        text: 'CAD',
        svgMarkup: '<svg viewBox="0 0 10 10"><path d="M0 0h10v10h-10z"/></svg>',
        mesh: { position: [0, 0, 0, 0.01, 0, 0, 0, 0.01, 0] },
      }),
    );
    const position = geometry.getAttribute('position');

    expect(position.count).toBeGreaterThan(0);
    for (let i = 0; i < position.count; i += 1) {
      expect(Number.isFinite(position.getX(i))).toBe(true);
      expect(Number.isFinite(position.getY(i))).toBe(true);
      expect(Number.isFinite(position.getZ(i))).toBe(true);
    }
    geometry.dispose();
  });

  it('builds box geometry at requested millimeter size', () => {
    const geometry = createGeometry(createCadObject('box', { dimensions: { x: 20, y: 10, z: 6 } }));
    geometry.computeBoundingBox();
    const size = new Vector3();
    new Box3().copy(geometry.boundingBox!).getSize(size);

    expect(sceneToMm(size.x)).toBeCloseTo(20);
    expect(sceneToMm(size.y)).toBeCloseTo(10);
    expect(sceneToMm(size.z)).toBeCloseTo(6);
    geometry.dispose();
  });

  it('uses serialized mesh geometry when kind is mesh', () => {
    const geometry = createGeometry(
      createCadObject('mesh', {
        mesh: {
          position: [0, 0, 0, 0.01, 0, 0, 0, 0.02, 0],
          normal: [0, 0, 1, 0, 0, 1, 0, 0, 1],
        },
      }),
    );

    expect(geometry.getAttribute('position').count).toBe(3);
    expect(geometry.getAttribute('normal').count).toBe(3);
    geometry.dispose();
  });

  it('falls back to a placeholder for empty SVG markup', () => {
    const geometry = createGeometry(createCadObject('svg', { svgMarkup: '' }));

    expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
    geometry.dispose();
  });

  it('applies object transforms in scene units and radians', () => {
    const object = createCadObject('box', {
      position: { x: 10, y: 20, z: 30 },
      rotation: { x: 90, y: 45, z: 0 },
      scale: { x: 2, y: -1, z: 0.5 },
    });
    const mesh = new Mesh();
    applyObjectTransform(mesh, object);

    expect(mesh.position.x).toBeCloseTo(0.01);
    expect(mesh.position.y).toBeCloseTo(0.02);
    expect(mesh.position.z).toBeCloseTo(0.03);
    expect(mesh.rotation.x).toBeCloseTo(Math.PI / 2);
    expect(mesh.rotation.y).toBeCloseTo(Math.PI / 4);
    expect(mesh.scale.toArray()).toEqual([2, -1, 0.5]);
  });
});
