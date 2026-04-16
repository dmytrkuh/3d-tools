# Contributing

## Documentation rule

Documentation must be updated together with functionality changes.

If a change affects user behavior, UX, architecture, file formats, import/export, geometry kernel, printability checks, hotkeys, or development workflow, update the relevant documentation in the same change.

Use this checklist:

- User-facing behavior: update `docs/user-guide.md`.
- Architecture/state/kernel: update `docs/architecture.md` or `docs/geometry-kernel.md`.
- Import/export/file formats: update `docs/file-formats.md`.
- Printability checks: update `docs/printability.md`.
- Roadmap/status: update `docs/roadmap.md`.
- Development rules: update `docs/development.md` or this file.

If documentation is intentionally not changed, include a short note in the final message or PR description:

```text
Docs: not needed because ...
```

## Build

Before finishing a code change, run:

```bash
npm run build
```

## Tests

Before finishing a behavior change, run:

```bash
npm test
```

New modeling, geometry, export, import, store, or printability logic should include tests in the same change. If a test is intentionally not added, include a short note:

```text
Tests: not added because ...
```

Tests live in `src/test/suites`. Add new suite files to `src/test/testRegistry.ts`; the registry test keeps the suite list honest.

## Project principles

- CAD state is the source of truth.
- UI and viewport should reflect state, not hide independent model data.
- All user-facing dimensions are millimeters.
- 3MF is the preferred print export format.
- Manifold WASM is the primary boolean kernel; mesh-CSG is fallback.
