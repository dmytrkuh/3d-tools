# Roadmap

## Сейчас реализовано

- Vite + React + TypeScript приложение.
- three.js viewport.
- CAD objects в миллиметрах.
- Примитивы: box, rounded box, cylinder, tube, sphere, wedge, text.
- Hole-объекты: screw hole, slot, magnet pocket.
- SVG import.
- Project JSON import/export.
- Templates: box + lid, hook, L bracket, cable clip, organizer.
- Move/rotate/scale.
- Duplicate, mirror, repeat.
- Align/distribute helpers.
- Orbit/fly navigation.
- Manifold WASM boolean kernel.
- mesh-CSG fallback.
- Bake boolean result.
- Export 3MF/STL/OBJ.
- Basic printability check.
- Undo/redo.
- Vitest automated tests in `src/test/suites`: 9 suite files covering core CAD modules, store actions/history, exporters, geometry, printability, serialization, units, and registry integrity.

## Ближайший этап

- UI для параметров repeat: axis/count/gap.
- Mirror по X/Y/Z и mirror plane.
- Align/distribute controls с выбором side/axis.
- Object visibility/lock.
- Grouping.
- Better fly mouse look.
- Numpad views: top/front/right.
- Workplane presets: XY/XZ/YZ.
- Place-on-face workflow.

## Геометрия

- Настоящие chamfer/fillet operations для выбранных объектов.
- Screw presets: M2/M3/M4/M5 clearance/countersink.
- Magnet presets.
- Thread-like visual/template objects.
- Better text layout and font support.
- More robust SVG cleanup.
- Mesh simplification after bake.

## Проверка печати

- Overhang angle analysis.
- Minimum wall thickness sampling.
- Floating islands.
- Bed contact area.
- Clearance warnings.
- Bounding box summary.
- Material/printer profile presets.

## Форматы

- GLB export.
- 3MF metadata improvements.
- Import STL/OBJ as mesh object.
- Project version migration.

## UX polishing

- Command palette.
- Context menu.
- Better object outliner.
- Editable hotkeys.
- Measurement tool.
- Ruler/grid overlays.
- Status bar with selected dimensions.

## Не в приоритете

- NURBS.
- Профессиональная feature history как в Fusion 360.
- Реалистичный рендер.
- Анимация.
- FEM/нагрузочные симуляции.
