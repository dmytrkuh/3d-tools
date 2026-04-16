# Геометрическое ядро

## Цель

Геометрическое ядро должно давать printable geometry для бытовых моделей: отверстия, пазы, карманы, объединение форм, пересечения и bake результата.

## Текущая схема

Основной путь:

```text
CadObject[] -> THREE.BufferGeometry -> Manifold Mesh -> Manifold boolean -> THREE.BufferGeometry
```

Fallback:

```text
CadObject[] -> THREE.BufferGeometry -> three-bvh-csg -> THREE.BufferGeometry
```

## Manifold WASM

Manifold используется как основной kernel:

- загружается лениво при export/bake;
- получает mesh через `Mesh`;
- выполняет `union`, `subtract`, `intersect`;
- возвращает manifold mesh через `getMesh`.

Файл:

- `src/lib/manifoldKernel.ts`

Преимущества:

- ориентирован на manifold solids;
- лучше подходит для 3D-печати;
- даёт более надёжный результат для CAD boolean, чем обычные mesh-CSG библиотеки.

Ограничения:

- импортированные SVG/text/mesh могут создать геометрию, которую Manifold не примет;
- WASM грузится асинхронно;
- сложные операции могут быть дорогими по времени.

## three-bvh-csg fallback

Fallback используется, если Manifold бросил ошибку.

Файл:

- `src/lib/csg.ts`

Это сохраняет UX: пользователь всё ещё может экспортировать модель, даже если robust kernel отказался от конкретной сетки.

## Boolean roles

`solid` объекты сначала объединяются.

`hole` объекты применяются к объединённому solid результату через выбранный mode:

- `subtract`: вычитание;
- `union`: объединение;
- `intersect`: пересечение.

## Bake

Bake превращает итог boolean pipeline в `mesh` object.

После bake:

- исходные объекты заменяются baked mesh;
- параметрическая структура исходных объектов теряется;
- undo позволяет вернуться назад;
- Project JSON перед bake остаётся лучшим способом сохранить редактируемую версию.

## Требования к новым geometry features

Любой новый primitive должен:

- иметь запись в `PrimitiveKind`;
- иметь default размеры в `cadObjects.ts`;
- строиться в `geometry.ts`;
- корректно сериализоваться через Project JSON;
- проходить `npm run build`;
- быть описан в `docs/user-guide.md` и `docs/architecture.md`, если меняется поведение.
