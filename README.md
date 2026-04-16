# 3D Tools MVP

Простой браузерный open-source прототип CAD-инструмента для бытового 3D-моделирования.

## Что уже реализовано

- Базовая сцена с сеткой и осями.
- Навигация Orbit + переключаемый Fly режим (WASD).
- Примитивы: box, rounded box, cylinder, tube, sphere, wedge.
- Трансформации: move / rotate / scale через gizmo.
- Duplicate, mirror, delete.
- Snap для трансформаций.
- Ввод точных позиций и габаритов в миллиметрах.
- Экспорт STL и OBJ.

## Локальный запуск

Откройте `index.html` через локальный статический сервер, например:

```bash
python3 -m http.server 4173
```

Затем откройте `http://localhost:4173`.

## Горячие клавиши

- `G` — move
- `R` — rotate
- `S` — scale
- `Ctrl/Cmd + D` — duplicate
- `M` — mirror X
- `Delete` — удалить объект
- `` ` `` или `~` — fly mode

## Дальше по плану

- Булевы операции (union / subtract / intersect) на robust-ядре.
- Hole-объекты, слоты, крепёжные шаблоны.
- Array/repeat.
- SVG import.
- Printability checks.
