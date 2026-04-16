# Roadmap

## Implemented

- Vite + React + TypeScript app.
- Fusion-like shell with title bar, ribbon, Browser, Viewport, and Inspector.
- Workspace tabs: Sketch, Solid, Arrange, Inspect.
- Compact active-workspace ribbon.
- Empty workspace on launch.
- three.js viewport.
- CAD objects in millimeters.
- Primitives: box, rounded box, cylinder, tube, sphere, wedge, text.
- Hole objects: screw hole, slot, magnet pocket.
- SVG import.
- Project JSON import/export.
- Move/rotate/scale.
- Fusion-inspired Extrude with operation selector.
- Context Press Pull: profile, face offset, edge round.
- Basic Fillet command for supported objects.
- Duplicate, mirror, repeat.
- Align/distribute helpers.
- Orbit/fly navigation.
- Manifold WASM boolean kernel.
- mesh-CSG fallback.
- Bake boolean result.
- Export 3MF/STL/OBJ.
- Basic printability check.
- Undo/redo.
- Vitest automated tests in `src/test/suites`.

## Next High-Impact UX Work

- Sketch mode with 2D profiles.
- True sketch-profile extrusion.
- Face selection.
- Workplane presets: XY/XZ/YZ.
- Place-on-face workflow.
- Press-pull by actual selected face normal.
- True target/tool body selection for Join/Cut/Intersect.
- Configurable pattern dialog: axis/count/gap.
- Mirror by X/Y/Z and mirror plane.
- Object visibility/lock.
- Grouping.
- Better object outliner.
- Numpad views: top/front/right.

## Geometry

- Real chamfer/fillet operations.
- Screw clearance presets.
- Magnet pocket presets.
- Thread-like visual objects.
- Better text layout and font support.
- More robust SVG cleanup.
- Mesh simplification after bake.

## Printability

- Overhang angle analysis.
- Minimum wall thickness sampling.
- Floating islands.
- Bed contact area.
- Clearance warnings.
- Bounding box summary.
- Material/printer profile presets.

## Formats

- GLB export.
- 3MF metadata improvements.
- Import STL/OBJ as mesh object.
- Project version migration.

## Not In Scope Yet

- NURBS.
- Professional feature history like Fusion 360.
- Photoreal rendering.
- Animation.
- FEM/load simulation.
