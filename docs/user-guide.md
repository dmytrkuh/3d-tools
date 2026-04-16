# User Guide

## Purpose

3D Tools CAD helps build practical 3D-printable parts in a browser: brackets, holders, boxes, lids, labels, fixtures, slots, pockets, and technical parts with holes.

The workspace starts empty by design. The user chooses what to create instead of being dropped into preset demo geometry.

## Interface

The interface follows a Fusion 360-like CAD layout:

- Top title bar: project actions, undo/redo, open/save JSON.
- Workspace tabs: Sketch, Solid, Arrange, Inspect.
- Compact ribbon: only the active workspace tools are shown.
- Left Browser: object tree/outliner.
- Center Viewport: 3D workspace, grid, camera controls, transform gizmo.
- Right Inspector: exact parameters, printability results, delete action.

There is no preset library. New designs begin from a blank scene and explicit modeling tools.

## Empty Workspace

On launch:

- there are no objects;
- nothing is selected;
- Browser shows an empty design hint;
- Viewport shows a start hint.

Start by adding a primitive, importing SVG, or opening a project JSON.

## Navigation

Orbit mode is the default:

- Mouse drag: orbit.
- Wheel: zoom.
- Pan depends on browser/device input support.

Fly mode is toggled with `~` or the HUD button:

- `W / A / S / D`: movement.
- `Q / E`: down/up in fly mode.
- `Shift`: faster movement.

## Workspace Tabs

### Sketch

Sketch is the schematic/prototyping workspace. It creates thin editable profiles first:

- Rectangle profile
- Circle profile
- Slot profile
- Text profile
- SVG profile import

Use `Extrude` or `Cut profile` to turn these profiles into solid or cutter geometry.

### Solid

Solid is the 3D modeling workspace. It contains:

- solid primitives;
- hole/cutter objects;
- Extrude;
- Press Pull;
- Fillet.

### Arrange

Arrange contains object layout tools:

- Move
- Rotate
- Scale
- Duplicate
- Mirror
- Pattern
- Align
- Distribute

### Inspect

Inspect contains validation and output tools:

- printability check;
- boolean mode;
- bake;
- 3MF/STL/OBJ/project export.

## Create Tools

Solid primitives:

- Box
- Rounded box
- Cylinder
- Tube
- Sphere
- Wedge
- Text

Cutters:

- Screw hole
- Slot
- Magnet pocket

Cutters are regular CAD objects with role `hole`. They appear as translucent cutter geometry and are applied during export/bake through the boolean pipeline.

## Solid Modify Tools

### Extrude

`Extrude` creates a distance-based extrusion from the selected profile/body.

Shortcut:

- `E`

Options:

- `New Body`: keeps the result as a solid.
- `Join`: currently behaves as a solid result until true target-body joining is implemented.
- `Cut`: converts the selected result to a hole object for boolean subtract.
- `Intersect`: currently keeps the result as a solid placeholder until target/tool selection is implemented.

Positive distances extrude upward from the object's current bottom plane. Negative distances extrude in the opposite direction.

### Press Pull

`Press Pull` is context-based:

- `Profile extrude`: routes to Extrude behavior.
- `Face offset`: changes the selected X/Y/Z dimension and shifts the center by half the delta.
- `Edge round`: changes the bevel/fillet radius on supported objects.

Shortcut:

- `Q`

### Fillet

`Fillet` rounds supported box-like edges.

Shortcut:

- `F`

Current implementation converts boxes to rounded boxes or edits the bevel on rounded boxes, text, and SVG objects. True edge-picking is still planned.

## Transform Tools

- Move
- Rotate
- Scale
- Duplicate
- Mirror X
- Pattern X
- Align X
- Align Bed
- Distribute

Hotkeys:

- `M`: move
- `G`: move legacy alias
- `R`: rotate
- `S`: scale
- `Delete`: delete selected
- `Ctrl+D`: duplicate
- `Ctrl+Z`: undo
- `Ctrl+Y`: redo
- `Ctrl+Shift+Z`: redo

## Exact Parameters

The Inspector edits:

- Name
- Role
- Position mm
- Size mm
- Rotation deg
- Color
- Bevel for supported objects
- Inner radius for tube
- Text content
- SVG markup

All user-facing dimensions are millimeters.

## Import

### SVG

SVG contours become extruded editable `svg` objects.

Recommendations:

- use simple closed paths;
- avoid highly complex SVGs with thousands of points;
- inspect and resize after import.

### Project JSON

Project JSON is the editable project format. Use it to preserve CAD object parameters before baking.

## Export and Bake

Boolean modes:

- `Subtract holes`
- `Union holes`
- `Intersect holes`

Export formats:

- `3MF`: preferred for printing.
- `STL`: slicer compatibility.
- `OBJ`: mesh workflow compatibility.
- `Project JSON`: editable project state.

`Bake boolean result` applies the boolean pipeline and replaces the scene with one baked mesh object. Save Project JSON before baking if you want to preserve parametric objects.
