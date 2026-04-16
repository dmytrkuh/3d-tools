# Архитектура

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

## Основные директории

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
  ui/
    App.tsx
    Viewport.tsx
  types.ts
```

## Слои

### UI layer

Файлы:

- `src/ui/App.tsx`
- `src/ui/Viewport.tsx`
- `src/styles.css`

`App.tsx` отвечает за панели, кнопки, inspector, import/export actions и hotkeys.

`Viewport.tsx` отвечает за:

- создание three.js scene;
- камеру;
- orbit/fly navigation;
- selection;
- TransformControls;
- синхронизацию `CadObject` -> `THREE.Mesh`.

### State layer

Файл:

- `src/store/cadStore.ts`

Zustand store хранит:

- objects;
- selectedIds;
- transformMode;
- cameraMode;
- snap settings;
- booleanMode;
- printIssues;
- undo/redo history.

Все операции моделирования проходят через store actions. Это важно: viewport не должен становиться источником истины.

### CAD object layer

Файлы:

- `src/types.ts`
- `src/lib/cadObjects.ts`

`CadObject` хранит параметры объекта в миллиметрах:

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

Роли:

- `solid`: обычная геометрия;
- `hole`: cutter для boolean pipeline;
- `template`: объект/группа-заготовка.

### Geometry layer

Файл:

- `src/lib/geometry.ts`

Создаёт `THREE.BufferGeometry` из `CadObject`.

Поддерживает:

- box;
- rounded box;
- cylinder;
- tube;
- sphere;
- wedge;
- slot;
- text;
- svg;
- baked mesh.

### Boolean/export layer

Файлы:

- `src/lib/manifoldKernel.ts`
- `src/lib/csg.ts`
- `src/lib/exporters.ts`

Порядок:

1. UI вызывает export или bake.
2. `exporters.ts` вызывает `buildRobustBooleanGroup`.
3. `csg.ts` сначала пробует Manifold WASM.
4. Если Manifold не принимает сетку, используется mesh-CSG fallback.
5. Результат экспортируется в 3MF/STL/OBJ или превращается в baked mesh.

## Единицы измерения

Внутренний UI и CAD state работают в миллиметрах.

three.js scene использует метры/scene units:

```ts
1 mm = 0.001 scene units
```

Перед экспортом STL/OBJ/3MF геометрия масштабируется обратно в миллиметры.

## Undo/redo

Undo/redo хранит snapshots:

- objects;
- selectedIds.

История ограничена 80 состояниями.

Не следует сохранять в history:

- camera position;
- viewport-only state;
- transient warnings;
- UI hover/focus.

## Automated tests

Vitest tests live in a dedicated suite folder:

```text
src/test/testRegistry.ts
src/test/helpers/*.ts
src/test/suites/*.test.ts
```

Tests run in the Vitest `node` environment. `src/test/setup.ts` provides small DOM stubs for `document.createElement`, anchor clicks, and `URL.createObjectURL`, because export functions rely on browser download APIs. This avoids jsdom typed-array quirks in zip tests while still exercising the export code.

`src/test/testRegistry.ts` is the main index of test suites and coverage areas. `src/test/suites/registry.test.ts` checks that the registry points to real suite files.

Run:

```bash
npm test
```

## Правило архитектуры

Новые CAD-функции должны добавляться через параметры `CadObject` и store actions. Не добавляй поведение напрямую в mesh без отражения в state, иначе project export/import и undo/redo начнут расходиться с viewport.
