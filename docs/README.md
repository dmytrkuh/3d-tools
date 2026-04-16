# 3D Tools CAD Documentation

3D Tools CAD is a browser CAD tool for practical 3D-printable parts. It keeps a Fusion-inspired workflow where it helps, but removes heavy professional workspace scope.

## Sections

- [User guide](./user-guide.md)
- [Fusion-inspired tool model](./fusion-tool-model.md)
- [Architecture](./architecture.md)
- [Geometry kernel](./geometry-kernel.md)
- [File formats and export](./file-formats.md)
- [Printability](./printability.md)
- [Development](./development.md)
- [Roadmap](./roadmap.md)

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## Product Principles

- All dimensions are millimeters.
- The workspace starts empty.
- Hole objects are first-class model objects and are applied through the boolean pipeline during export/bake.
- 3MF is preferred for printing; STL and OBJ remain compatibility formats.
- CAD object parameters are separate from the three.js viewport.
- Documentation must be updated together with functionality changes.
