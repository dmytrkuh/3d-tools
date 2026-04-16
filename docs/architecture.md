# Architecture

## Stack

- Vite
- React
- TypeScript
- Vitest
- three.js
- Zustand
- Manifold WASM
- three-bvh-csg fallback
- fflate
- @jscadui/3mf-export

## Directories

```text
src/
  lib/
    cadObjects.ts
    csg.ts
    exporters.ts
    geometry.ts
    id.ts
    manifoldKernel.ts
    meshSerialization.ts
    printability.ts
    units.ts
  store/
    cadStore.ts
  test/
    setup.ts
    testRegistry.ts
    helpers/
    suites/
  ui/
    App.tsx
    Viewport.tsx
  types.ts
```

## UI Layer

Files:

- `src/ui/App.tsx`
- `src/ui/Viewport.tsx`
- `src/styles.css`

`App.tsx` owns the Fusion-like application shell:

- title bar;
- workspace tabs;
- compact active-workspace ribbon;
- Browser/outliner;
- Viewport region;
- Inspector;
- import/export actions;
- hotkeys.

Current workspace tabs:

- `Sketch`: thin 2D-like profiles and SVG import;
- `Solid`: 3D primitives, cutters, Extrude, Press Pull, Fillet;
- `Arrange`: transform, pattern, mirror, align, distribute;
- `Inspect`: printability, bake, export.

`Viewport.tsx` owns:

- three.js scene;
- camera;
- orbit/fly navigation;
- object selection;
- TransformControls;
- synchronization from `CadObject` state to `THREE.Mesh`.

## State Layer

File:

- `src/store/cadStore.ts`

Zustand stores:

- objects;
- selectedIds;
- transformMode;
- cameraMode;
- snap settings;
- booleanMode;
- printIssues;
- undo/redo history.

The store starts with an empty object list. New modeling operations must be added as store actions so project export/import, undo/redo, tests, and viewport stay consistent.

Current modeling actions include:

- addPrimitive;
- addImportedSvg;
- importProject;
- updateObject;
- duplicateSelected;
- mirrorSelected;
- repeatSelected;
- extrudeSelected;
- pressPullSelected;
- filletSelected;
- alignSelected;
- distributeSelected;
- bakeBooleanResult.

## CAD Object Layer

Files:

- `src/types.ts`
- `src/lib/cadObjects.ts`

`CadObject` stores millimeter-based parameters:

- kind;
- role;
- position;
- rotation;
- scale;
- dimensions;
- bevel;
- innerRadius;
- text;
- svgMarkup;
- mesh.

Roles:

- `solid`: normal printable geometry;
- `hole`: cutter used by the boolean pipeline;
- `reference`: helper geometry that is not a preset or startup object.

## Geometry Layer

File:

- `src/lib/geometry.ts`

Creates `THREE.BufferGeometry` from `CadObject`.

Supported geometry:

- box;
- rounded box;
- cylinder;
- tube;
- sphere;
- wedge;
- slot;
- screw hole;
- magnet pocket;
- text;
- svg;
- baked mesh.

## Boolean and Export Layer

Files:

- `src/lib/manifoldKernel.ts`
- `src/lib/csg.ts`
- `src/lib/exporters.ts`

Pipeline:

1. UI calls export or bake.
2. `exporters.ts` calls `buildRobustBooleanGroup`.
3. `csg.ts` tries Manifold WASM first.
4. If Manifold rejects a mesh, mesh-CSG fallback is used.
5. Result is exported to 3MF/STL/OBJ or converted to a baked mesh.

## Units

CAD state and UI are millimeters.

three.js scene units use:

```ts
1 mm = 0.001 scene units
```

Export scales geometry back to millimeters.

## Tests

Vitest tests live in:

```text
src/test/testRegistry.ts
src/test/helpers/*.ts
src/test/suites/*.test.ts
```

`src/test/testRegistry.ts` is the main suite index. `registry.test.ts` checks that every registered suite file exists.

Run:

```bash
npm test
```

## Architecture Rule

CAD state is the source of truth. Do not add behavior only to a three.js mesh if it affects model data. Put model-changing behavior in store actions and cover it with tests.
