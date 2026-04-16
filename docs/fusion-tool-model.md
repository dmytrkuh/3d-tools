# Fusion-Inspired Tool Model

This project uses Autodesk Fusion documentation as a reference for interaction semantics, then removes professional CAD scope that is not needed for the browser MVP.

Reference pages:

- Autodesk Fusion Press Pull: https://help.autodesk.com/cloudhelp/ENU/Fusion-Model/files/GUID-02F9ADA3-7556-42A9-8AD1-552728D537AB.htm
- Autodesk Fusion Modify tools: https://help.autodesk.com/cloudhelp/ENU/Fusion-Model/files/SLD-MODIFY-SOLID-BODY.htm
- Autodesk Fusion Move/Copy: https://help.autodesk.com/cloudhelp/ENU/Fusion-Model/files/SLD-MOVE-COPY-GEOMETRY.htm
- Autodesk Fusion Combine: https://help.autodesk.com/cloudhelp/ENU/Fusion-Model/files/SLD-COMBINE.htm
- Autodesk Fusion keyboard shortcuts: https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-F0491540-0324-470A-B651-2238D0EFAC30

## Kept For MVP

- Workspace tabs inspired by Fusion's separated modeling contexts.
- Sketch-like profile workflow for fast schematic prototyping.
- Create solid primitives.
- Extrude selected profile/body by an exact distance.
- Press Pull selected geometry with context:
  - profile: route to extrusion;
  - face: offset one dimension and shift the center by half the delta;
  - edge: round supported edges through the bevel/fillet parameter.
- Fillet selected box-like geometry.
- Move, rotate, scale.
- Duplicate and pattern.
- Align and distribute.
- Combine-like boolean export through solid objects and hole objects.
- Exact millimeter input.
- Project save/open and mesh export.

## Removed From Current Scope

- Surface workspace.
- Form/T-Spline editing.
- Sheet metal workspace.
- Manufacturing/CAM.
- Simulation.
- Drawings.
- Assemblies and joints.
- Professional parametric timeline.
- Advanced face replacement, split body, silhouette split, draft, and shell dialogs.

## Command Semantics

### Extrude

Shortcut: `E`.

- Uses the selected object as the editable profile/body.
- The entered distance becomes the extrusion distance.
- Positive distance extrudes upward from the object's current bottom plane.
- Negative distance extrudes in the opposite direction.
- `New Body` keeps the result as a solid.
- `Join` currently behaves like a solid result until true body joining is implemented.
- `Cut` converts the result into a hole object for the boolean pipeline.
- `Intersect` currently keeps the result as a solid placeholder until target/tool body selection is implemented.

### Press Pull

Shortcut: `Q`.

- `Profile extrude`: routes to Extrude behavior.
- `Face offset`: changes selected X/Y/Z size and shifts the center by half the delta.
- `Edge round`: increases or decreases the bevel/fillet radius on supported objects.

### Fillet

Shortcut: `F`.

- Converts boxes to rounded boxes.
- Updates bevel radius on rounded boxes, text, and SVG objects.
- Does not yet perform true B-Rep edge selection.

### Move

Shortcut: `M` or legacy `G`.

- Uses the transform gizmo for free movement.
- Exact position remains editable in the Inspector.
- Copy is handled by Duplicate.

### Combine

- Solids and hole objects are combined during Bake/Export.
- `Subtract holes` is the default printing workflow.
- `Union holes` and `Intersect holes` are available boolean modes.

## Shortcut Alignment

Fusion reference shortcuts mirrored here:

- `E`: Extrude.
- `Q`: Press Pull.
- `F`: Fillet.
- `M`: Move.
- `Delete`: Delete selected.

Local-only shortcuts:

- `~`: toggle Orbit/Fly camera.
- `G`: legacy move alias.
- `R`: rotate gizmo.
- `S`: scale gizmo.
- `Ctrl+D`: duplicate.
