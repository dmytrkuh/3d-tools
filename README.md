# 3D Tools CAD

Open-source browser CAD tool for practical 3D-printable models.

The goal is a simplified Fusion 360-style workflow for everyday printable parts: primitives, exact millimeter dimensions, hole objects, boolean operations, templates, printability hints, and export to print-friendly formats.

## Current Status

Implemented:

- Vite + React + TypeScript app.
- three.js viewport with orbit/fly navigation.
- CAD objects stored in millimeters.
- Primitives: box, rounded box, cylinder, tube, sphere, wedge, text.
- Hole objects: screw hole, slot, magnet pocket.
- SVG import and project JSON import/export.
- Templates: box + lid, hook, L bracket, cable clip, organizer.
- Move, rotate, scale, duplicate, mirror, repeat.
- Align and distribute helpers.
- Manifold WASM boolean kernel with mesh-CSG fallback.
- Boolean export and bake.
- Export 3MF, STL, OBJ, and project JSON.
- Basic printability checks.
- Undo/redo.

## Documentation

Start here:

- [Documentation hub](./docs/README.md)
- [User guide](./docs/user-guide.md)
- [Architecture](./docs/architecture.md)
- [Geometry kernel](./docs/geometry-kernel.md)
- [File formats and export](./docs/file-formats.md)
- [Printability](./docs/printability.md)
- [Development](./docs/development.md)
- [Roadmap](./docs/roadmap.md)
- [Contributing](./CONTRIBUTING.md)

## Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Tests are organized under `src/test/suites` and indexed by `src/test/testRegistry.ts`.

## Documentation Rule

Documentation must be updated together with functionality changes.

If a change affects user behavior, UX, architecture, file formats, import/export, geometry kernel, printability checks, hotkeys, or development workflow, update the relevant documentation in the same change.

See [Contributing](./CONTRIBUTING.md) and [Development](./docs/development.md).
