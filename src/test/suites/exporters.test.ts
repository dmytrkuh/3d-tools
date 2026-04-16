import * as THREE from 'three';
import { strFromU8, unzipSync } from 'fflate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCadObject } from '../../lib/cadObjects';

vi.mock('../../lib/csg', () => ({
  buildRobustBooleanGroup: vi.fn(async () => {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), new THREE.MeshStandardMaterial());
    mesh.name = 'Mock mesh';
    group.add(mesh);
    return { group, warnings: [] };
  }),
}));

function objectUrlMock() {
  return vi.mocked(URL.createObjectURL);
}

async function lastDownloadedBlob() {
  return objectUrlMock().mock.calls.at(-1)?.[0] as Blob;
}

describe('exporters suite', () => {
  beforeEach(() => {
    objectUrlMock().mockClear();
    vi.mocked(URL.revokeObjectURL).mockClear();
    vi.mocked(HTMLAnchorElement.prototype.click).mockClear();
  });

  it('exports project JSON with version and CAD objects', async () => {
    const { exportProject } = await import('../../lib/exporters');
    const object = createCadObject('box');
    exportProject([object]);

    const data = JSON.parse(await (await lastDownloadedBlob()).text()) as { version: number; objects: Array<{ id: string }> };

    expect(data.version).toBe(1);
    expect(data.objects[0].id).toBe(object.id);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });

  it('exports a valid 3MF zip container with millimeter metadata', async () => {
    const { export3mf } = await import('../../lib/exporters');
    await export3mf([createCadObject('box')]);

    const files = unzipSync(new Uint8Array(await (await lastDownloadedBlob()).arrayBuffer()));
    const model = strFromU8(files['3D/3dmodel.model']);

    expect(files['[Content_Types].xml']).toBeDefined();
    expect(files['_rels/.rels']).toBeDefined();
    expect(model).toContain('unit="millimeter"');
    expect(model).toContain('<vertices>');
    expect(model).toContain('<triangles>');
  });

  it('exports STL through the download path', async () => {
    const { exportStl } = await import('../../lib/exporters');
    await exportStl([createCadObject('box')]);

    const text = await (await lastDownloadedBlob()).text();
    expect(text).toContain('solid');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });

  it('exports OBJ through the download path', async () => {
    const { exportObj } = await import('../../lib/exporters');
    await exportObj([createCadObject('box')]);

    const text = await (await lastDownloadedBlob()).text();
    expect(text).toContain('v ');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });
});
