import { BoxGeometry } from 'three';
import { describe, expect, it } from 'vitest';
import { createGeometry } from '../../lib/geometry';
import { createBakedMeshObject, serializeGeometry } from '../../lib/meshSerialization';

describe('mesh serialization suite', () => {
  it('serializes geometry into plain arrays', () => {
    const geometry = new BoxGeometry(0.01, 0.02, 0.03);
    const serialized = serializeGeometry(geometry);

    expect(serialized.position.length).toBeGreaterThan(0);
    expect(serialized.normal?.length).toBe(serialized.position.length);
    geometry.dispose();
  });

  it('creates a baked mesh object with millimeter dimensions', () => {
    const geometry = new BoxGeometry(0.01, 0.02, 0.03);
    const object = createBakedMeshObject(geometry);

    expect(object.kind).toBe('mesh');
    expect(object.role).toBe('solid');
    expect(object.dimensions.x).toBeCloseTo(10);
    expect(object.dimensions.y).toBeCloseTo(20);
    expect(object.dimensions.z).toBeCloseTo(30);
    expect(object.mesh?.position.length).toBeGreaterThan(0);
    geometry.dispose();
  });

  it('round-trips baked mesh object back into geometry', () => {
    const source = new BoxGeometry(0.01, 0.02, 0.03);
    const object = createBakedMeshObject(source);
    const restored = createGeometry(object);

    expect(restored.getAttribute('position').count).toBeGreaterThan(0);
    source.dispose();
    restored.dispose();
  });
});
