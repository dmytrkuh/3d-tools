export type TestSuiteDefinition = {
  area: string;
  file: string;
  covers: string[];
};

export const testSuites: TestSuiteDefinition[] = [
  {
    area: 'Units',
    file: 'units.test.ts',
    covers: ['millimeter conversion', 'grid snapping', 'dimension clamping'],
  },
  {
    area: 'CAD objects',
    file: 'cad-objects.test.ts',
    covers: ['primitive defaults', 'hole roles', 'overrides', 'deep cloning'],
  },
  {
    area: 'Geometry',
    file: 'geometry.test.ts',
    covers: ['all primitive geometry builders', 'text', 'SVG', 'serialized mesh', 'object transforms'],
  },
  {
    area: 'Printability',
    file: 'printability.test.ts',
    covers: ['watertight geometry', 'open edges', 'non-manifold edges', 'triangle counts'],
  },
  {
    area: 'Mesh serialization',
    file: 'mesh-serialization.test.ts',
    covers: ['plain geometry serialization', 'baked mesh object dimensions'],
  },
  {
    area: 'Exporters',
    file: 'exporters.test.ts',
    covers: ['Project JSON', '3MF zip', 'STL download', 'OBJ download'],
  },
  {
    area: 'Store actions',
    file: 'store-actions.test.ts',
    covers: ['empty workspace', 'selection', 'add/import/update/delete', 'duplicate', 'mirror', 'repeat', 'extrude operations', 'press-pull targets', 'fillet', 'align', 'distribute'],
  },
  {
    area: 'Store history',
    file: 'store-history.test.ts',
    covers: ['undo', 'redo', 'history clearing', 'bake result'],
  },
  {
    area: 'Registry',
    file: 'registry.test.ts',
    covers: ['test registry integrity'],
  },
];
