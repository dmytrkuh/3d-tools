import { describe, expect, it } from 'vitest';
import { createCadObject } from '../../lib/cadObjects';
import { analyzeObjectGeometry } from '../../lib/printability';

describe('printability suite', () => {
  it('reports closed box geometry as watertight', () => {
    const health = analyzeObjectGeometry(createCadObject('box'));

    expect(health.triangles).toBe(12);
    expect(health.boundaryEdges).toBe(0);
    expect(health.nonManifoldEdges).toBe(0);
  });

  it('detects open boundary edges in a broken mesh', () => {
    const health = analyzeObjectGeometry(
      createCadObject('mesh', {
        mesh: {
          position: [0, 0, 0, 0.01, 0, 0, 0, 0.01, 0],
        },
      }),
    );

    expect(health.boundaryEdges).toBe(3);
  });

  it('detects non-manifold edges when too many triangles share an edge', () => {
    const health = analyzeObjectGeometry(
      createCadObject('mesh', {
        mesh: {
          position: [
            0, 0, 0, 0.01, 0, 0, 0, 0.01, 0,
            0, 0, 0, 0.01, 0, 0, 0, 0, 0.01,
            0, 0, 0, 0.01, 0, 0, 0, -0.01, 0,
          ],
        },
      }),
    );

    expect(health.nonManifoldEdges).toBeGreaterThan(0);
  });

  it('counts triangles for curved primitives', () => {
    const health = analyzeObjectGeometry(createCadObject('sphere'));

    expect(health.triangles).toBeGreaterThan(100);
  });
});
