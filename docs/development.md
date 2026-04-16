# Разработка

## Установка

```bash
npm install
```

## Dev server

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Tests

Run all automated tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The current test suite uses Vitest in the `node` environment with small DOM stubs for download APIs. This keeps binary/zip tooling deterministic while still allowing export functions to be tested.

Tests live in a dedicated suite folder:

```text
src/test/
  setup.ts
  testRegistry.ts
  helpers/
    storeTestUtils.ts
  suites/
    cad-objects.test.ts
    exporters.test.ts
    geometry.test.ts
    mesh-serialization.test.ts
    printability.test.ts
    registry.test.ts
    store-actions.test.ts
    store-history.test.ts
    units.test.ts
```

`src/test/testRegistry.ts` is the main registry for test areas. When adding a new suite file, add it to the registry. The registry test verifies that every declared suite file exists.

The suite covers:

- unit conversion helpers;
- CAD object creation/cloning;
- geometry generation for every primitive kind, text, SVG, serialized mesh, and transforms;
- printability mesh analysis;
- baked mesh serialization;
- Zustand store actions, selection, import, update, delete, duplicate, mirror, repeat, align, distribute, modes, undo, redo, bake, and printability;
- Project JSON export;
- 3MF zip export smoke test;
- STL and OBJ download paths;
- test registry integrity.

## Definition of Done

Изменение считается завершённым, когда:

- код компилируется через `npm run build`;
- автотесты проходят через `npm test`;
- новая функциональность доступна в UI или покрыта понятным API;
- Project JSON не ломается для существующих объектов;
- undo/redo учитывает новую modeling operation;
- export/bake поведение проверено логически;
- документация обновлена.
- новая логика покрыта тестами или явно объяснено, почему тест не нужен.

## Обязательное правило документации

Любое изменение функциональности, UX, архитектуры, форматов файлов, export/import pipeline, geometry kernel или hotkeys должно сопровождаться обновлением документации в том же изменении.

Минимальная проверка перед завершением задачи:

- поменялось поведение пользователя -> обнови `docs/user-guide.md`;
- поменялась архитектура/state/kernel -> обнови `docs/architecture.md` или `docs/geometry-kernel.md`;
- поменялись форматы/import/export -> обнови `docs/file-formats.md`;
- поменялась проверка печати -> обнови `docs/printability.md`;
- поменялся roadmap/status -> обнови `docs/roadmap.md`;
- поменялись правила разработки -> обнови `docs/development.md` или `CONTRIBUTING.md`.
- добавлена новая логика -> добавь или обнови автотесты рядом с изменением.
- добавлен новый suite-файл -> добавь его в `src/test/testRegistry.ts`.

Если изменение маленькое и документация не нужна, это должно быть осознанное решение. В PR/итоговом сообщении нужно указать: `Docs: not needed` и почему.

## Coding rules

- CAD state является источником истины.
- Viewport синхронизируется из state, а не наоборот.
- Новые операции моделирования должны быть store actions.
- Не добавляй mesh-only состояние, если оно влияет на project export/import.
- Все размеры в UI и state задаются в миллиметрах.
- Перед export геометрия масштабируется в миллиметры.
- Manifold kernel должен оставаться основным boolean path, mesh-CSG только fallback.

## Добавление нового примитива

1. Добавь kind в `PrimitiveKind`.
2. Добавь default dimensions и label в `cadObjects.ts`.
3. Добавь geometry builder в `geometry.ts`.
4. Добавь кнопку или workflow в `App.tsx`.
5. Проверь `Project JSON`.
6. Проверь `npm run build`.
7. Добавь или обнови тесты.
8. Если добавлен новый suite-файл, обнови `src/test/testRegistry.ts`.
9. Обнови документацию.

## Добавление новой операции моделирования

1. Добавь action в `cadStore.ts`.
2. Убедись, что action проходит через history.
3. Добавь UI/hotkey, если нужно.
4. Проверь undo/redo.
5. Добавь или обнови тесты.
6. Если добавлен новый suite-файл, обнови `src/test/testRegistry.ts`.
7. Обнови документацию.
