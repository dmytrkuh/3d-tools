# Проверка печати

## Назначение

Printability check помогает поймать очевидные проблемы до экспорта в слайсер.

Это не полноценный slicer analysis. Проверка не заменяет Cura/PrusaSlicer/Bambu Studio, но даёт быстрые hints прямо в CAD.

## Текущие проверки

### Thin details

Если минимальный размер объекта меньше `0.8 mm`, выводится warning.

Причина: тонкие элементы могут быть хрупкими или не напечататься на FDM-принтере.

### Below bed

Если объект уходит ниже печатного стола, выводится error.

### Open edges

Geometry analyzer считает boundary edges.

Если solid имеет открытые рёбра, STL может быть не watertight.

### Non-manifold edges

Если одно ребро принадлежит более чем двум треугольникам, выводится error.

### Heavy meshes

Если объект содержит очень много треугольников, выводится info.

Причина: boolean, bake, export и slicer могут работать медленнее.

### Overhang hints

Некоторые формы, например wedge, могут требовать поддержки в зависимости от ориентации.

## Где реализовано

- `src/lib/printability.ts`
- `checkObject` в `src/store/cadStore.ts`

## Будущие проверки

- minimum wall thickness по локальной геометрии;
- overhang angle по нормалям;
- floating islands;
- bed contact area;
- estimated bounding box;
- warning при слишком маленьком отверстии под винт;
- clearance presets для FDM/SLA.
