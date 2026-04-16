import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Circle,
  Combine,
  Download,
  FileJson,
  FolderOpen,
  Grid2X2,
  Layers,
  Maximize2,
  MousePointer2,
  Move3D,
  RotateCcw,
  ScanLine,
  Scaling,
  Square,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { useCadStore } from '../store/cadStore';
import type { Axis, BooleanOperation, CadObject, PrimitiveKind, TransformMode } from '../types';
import type { ExtrudeOperation, PressPullTarget } from '../types';
import { export3mf, exportObj, exportProject, exportStl } from '../lib/exporters';
import { Viewport } from './Viewport';

const solidTools: Array<{ kind: PrimitiveKind; label: string; icon: React.ReactNode }> = [
  { kind: 'box', label: 'Box', icon: <Box size={18} /> },
  { kind: 'roundedBox', label: 'Rounded', icon: <Square size={18} /> },
  { kind: 'cylinder', label: 'Cylinder', icon: <Circle size={18} /> },
  { kind: 'tube', label: 'Tube', icon: <Circle size={18} /> },
  { kind: 'sphere', label: 'Sphere', icon: <Circle size={18} /> },
  { kind: 'wedge', label: 'Wedge', icon: <Maximize2 size={18} /> },
  { kind: 'text', label: 'Text', icon: <Type size={18} /> },
];

const holeTools: Array<{ kind: PrimitiveKind; label: string }> = [
  { kind: 'screwHole', label: 'Screw hole' },
  { kind: 'slot', label: 'Slot' },
  { kind: 'magnetPocket', label: 'Magnet pocket' },
];

type WorkspaceTab = 'sketch' | 'solid' | 'arrange' | 'inspect';

const workspaceTabs: Array<{ id: WorkspaceTab; label: string; caption: string }> = [
  { id: 'sketch', label: 'Sketch', caption: '2D profiles' },
  { id: 'solid', label: 'Solid', caption: '3D model' },
  { id: 'arrange', label: 'Arrange', caption: 'layout' },
  { id: 'inspect', label: 'Inspect', caption: 'check/export' },
];

export function App() {
  const svgInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('solid');
  const [extrudeDistance, setExtrudeDistance] = useState(10);
  const [extrudeOperation, setExtrudeOperation] = useState<ExtrudeOperation>('newBody');
  const [pressPullDistance, setPressPullDistance] = useState(5);
  const [pressPullTarget, setPressPullTarget] = useState<PressPullTarget>('face');
  const [pressPullAxis, setPressPullAxis] = useState<Axis>('y');
  const [filletRadius, setFilletRadius] = useState(2);

  const objects = useCadStore((state) => state.objects);
  const selectedIds = useCadStore((state) => state.selectedIds);
  const selected = objects.find((object) => object.id === selectedIds[0]);
  const selectObject = useCadStore((state) => state.selectObject);
  const addPrimitive = useCadStore((state) => state.addPrimitive);
  const addImportedSvg = useCadStore((state) => state.addImportedSvg);
  const importProject = useCadStore((state) => state.importProject);
  const updateObject = useCadStore((state) => state.updateObject);
  const deleteSelected = useCadStore((state) => state.deleteSelected);
  const duplicateSelected = useCadStore((state) => state.duplicateSelected);
  const mirrorSelected = useCadStore((state) => state.mirrorSelected);
  const repeatSelected = useCadStore((state) => state.repeatSelected);
  const extrudeSelected = useCadStore((state) => state.extrudeSelected);
  const pressPullSelected = useCadStore((state) => state.pressPullSelected);
  const filletSelected = useCadStore((state) => state.filletSelected);
  const alignSelected = useCadStore((state) => state.alignSelected);
  const distributeSelected = useCadStore((state) => state.distributeSelected);
  const setTransformMode = useCadStore((state) => state.setTransformMode);
  const setCameraMode = useCadStore((state) => state.setCameraMode);
  const cameraMode = useCadStore((state) => state.cameraMode);
  const transformMode = useCadStore((state) => state.transformMode);
  const booleanMode = useCadStore((state) => state.booleanMode);
  const setBooleanMode = useCadStore((state) => state.setBooleanMode);
  const snapEnabled = useCadStore((state) => state.snapEnabled);
  const snapStepMm = useCadStore((state) => state.snapStepMm);
  const toggleSnap = useCadStore((state) => state.toggleSnap);
  const setSnapStep = useCadStore((state) => state.setSnapStep);
  const runPrintabilityCheck = useCadStore((state) => state.runPrintabilityCheck);
  const bakeBooleanResult = useCadStore((state) => state.bakeBooleanResult);
  const printIssues = useCadStore((state) => state.printIssues);
  const undo = useCadStore((state) => state.undo);
  const redo = useCadStore((state) => state.redo);

  const createSketchProfile = (kind: PrimitiveKind, dimensions: CadObject['dimensions'], name: string) => {
    addPrimitive(kind);
    const id = useCadStore.getState().selectedIds[0];
    if (!id) return;
    updateObject(id, {
      name,
      dimensions,
      position: { x: 0, y: dimensions.y / 2, z: 0 },
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      const key = event.key.toLowerCase();
      if (cameraMode === 'fly' && ['w', 'a', 's', 'd', 'q', 'e', 'shift'].includes(key)) return;

      if (event.key === 'Delete') deleteSelected();
      if (key === 'm' || key === 'g') setTransformMode('translate');
      if (key === 'r') setTransformMode('rotate');
      if (key === 's') setTransformMode('scale');
      if (key === 'e') extrudeSelected(extrudeDistance, extrudeOperation);
      if (key === 'q') pressPullSelected(pressPullDistance, pressPullTarget, pressPullAxis);
      if (key === 'f') filletSelected(filletRadius);
      if (event.key === '`' || event.key === '~') setCameraMode(cameraMode === 'fly' ? 'orbit' : 'fly');
      if ((event.ctrlKey || event.metaKey) && key === 'd') {
        event.preventDefault();
        duplicateSelected();
      }
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if ((event.ctrlKey || event.metaKey) && key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    cameraMode,
    deleteSelected,
    duplicateSelected,
    extrudeDistance,
    extrudeOperation,
    extrudeSelected,
    filletRadius,
    filletSelected,
    pressPullDistance,
    pressPullAxis,
    pressPullTarget,
    pressPullSelected,
    redo,
    setCameraMode,
    setTransformMode,
    undo,
  ]);

  return (
    <main className="fusion-shell">
      <header className="fusion-titlebar">
        <div className="app-identity">
          <div className="app-mark">3D</div>
          <div>
            <h1>3D Tools CAD</h1>
            <p>Design workspace - millimeters - print-ready exports</p>
          </div>
        </div>
        <div className="title-actions">
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <button onClick={() => projectInputRef.current?.click()}>
            <FolderOpen size={16} /> Open
          </button>
          <button onClick={() => exportProject(objects)}>
            <FileJson size={16} /> Save JSON
          </button>
        </div>
      </header>

      <section className="command-deck">
        <nav className="workspace-tabs" aria-label="CAD workspace tabs">
          {workspaceTabs.map((tab) => (
            <button key={tab.id} className={workspaceTab === tab.id ? 'workspace-tab active' : 'workspace-tab'} onClick={() => setWorkspaceTab(tab.id)}>
              <span>{tab.label}</span>
              <small>{tab.caption}</small>
            </button>
          ))}
        </nav>
        <div className="ribbon-stage">
          <section className="ribbon">
            {workspaceTab === 'sketch' && (
              <>
                <RibbonGroup title="Profile Create">
                  <button className="ribbon-button" onClick={() => createSketchProfile('box', { x: 60, y: 2, z: 40 }, 'Rectangle profile')}>
                    <Square size={18} />
                    <span>Rectangle</span>
                  </button>
                  <button className="ribbon-button" onClick={() => createSketchProfile('cylinder', { x: 32, y: 2, z: 32 }, 'Circle profile')}>
                    <Circle size={18} />
                    <span>Circle</span>
                  </button>
                  <button className="ribbon-button danger-soft" onClick={() => createSketchProfile('slot', { x: 52, y: 16, z: 2 }, 'Slot profile')}>
                    <Combine size={18} />
                    <span>Slot</span>
                  </button>
                  <button className="ribbon-button" onClick={() => createSketchProfile('text', { x: 60, y: 2, z: 8 }, 'Text profile')}>
                    <Type size={18} />
                    <span>Text</span>
                  </button>
                  <button className="ribbon-button" onClick={() => svgInputRef.current?.click()}>
                    <Upload size={18} />
                    <span>SVG</span>
                  </button>
                </RibbonGroup>
                <RibbonGroup title="Prototype To Solid">
                  <label className="mini-control">
                    Distance
                    <input type="number" value={extrudeDistance} step="1" onChange={(event) => setExtrudeDistance(Number(event.target.value))} />
                  </label>
                  <button className="ribbon-button" disabled={!selected} onClick={() => extrudeSelected(extrudeDistance, 'newBody')}>
                    <Move3D size={18} />
                    <span>Extrude</span>
                  </button>
                  <button className="ribbon-button" disabled={!selected} onClick={() => extrudeSelected(extrudeDistance, 'cut')}>
                    <Combine size={18} />
                    <span>Cut profile</span>
                  </button>
                </RibbonGroup>
              </>
            )}

            {workspaceTab === 'solid' && (
              <>
                <RibbonGroup title="Create">
                  {solidTools.map((tool) => (
                    <button key={tool.kind} className="ribbon-button" onClick={() => addPrimitive(tool.kind)}>
                      {tool.icon}
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </RibbonGroup>
                <RibbonGroup title="Cutters">
                  {holeTools.map((tool) => (
                    <button key={tool.kind} className="ribbon-button danger-soft" onClick={() => addPrimitive(tool.kind)}>
                      <Combine size={18} />
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </RibbonGroup>
                <RibbonGroup title="Modify">
                  <label className="mini-control">
                    Extrude
                    <input type="number" value={extrudeDistance} step="1" onChange={(event) => setExtrudeDistance(Number(event.target.value))} />
                  </label>
                  <select className="ribbon-select slim" value={extrudeOperation} onChange={(event) => setExtrudeOperation(event.target.value as ExtrudeOperation)}>
                    <option value="newBody">New Body</option>
                    <option value="join">Join</option>
                    <option value="cut">Cut</option>
                    <option value="intersect">Intersect</option>
                  </select>
                  <button className="ribbon-button" disabled={!selected} onClick={() => extrudeSelected(extrudeDistance, extrudeOperation)} title="Extrude selected profile/body (E)">
                    <Move3D size={18} />
                    <span>Extrude</span>
                  </button>
                  <label className="mini-control">
                    Press Pull
                    <input type="number" value={pressPullDistance} step="1" onChange={(event) => setPressPullDistance(Number(event.target.value))} />
                  </label>
                  <select className="ribbon-select slim" value={pressPullTarget} onChange={(event) => setPressPullTarget(event.target.value as PressPullTarget)}>
                    <option value="face">Face offset</option>
                    <option value="profile">Profile extrude</option>
                    <option value="edge">Edge round</option>
                  </select>
                  <select className="axis-select" value={pressPullAxis} onChange={(event) => setPressPullAxis(event.target.value as Axis)} disabled={pressPullTarget !== 'face'}>
                    <option value="x">X</option>
                    <option value="y">Y</option>
                    <option value="z">Z</option>
                  </select>
                  <button className="ribbon-button" disabled={!selected} onClick={() => pressPullSelected(pressPullDistance, pressPullTarget, pressPullAxis)} title="Press Pull selected geometry (Q)">
                    <Maximize2 size={18} />
                    <span>Press Pull</span>
                  </button>
                  <label className="mini-control">
                    Fillet
                    <input type="number" min="0" value={filletRadius} step="0.5" onChange={(event) => setFilletRadius(Number(event.target.value))} />
                  </label>
                  <button className="ribbon-button" disabled={!selected} onClick={() => filletSelected(filletRadius)} title="Round selected edges (F)">
                    <Circle size={18} />
                    <span>Fillet</span>
                  </button>
                </RibbonGroup>
              </>
            )}

            {workspaceTab === 'arrange' && (
              <>
                <RibbonGroup title="Transform">
                  <ModeButton mode="translate" active={transformMode} label="Move" icon={<MousePointer2 size={18} />} />
                  <ModeButton mode="rotate" active={transformMode} label="Rotate" icon={<RotateCcw size={18} />} />
                  <ModeButton mode="scale" active={transformMode} label="Scale" icon={<Scaling size={18} />} />
                  <button className="ribbon-button" disabled={!selected} onClick={duplicateSelected}>Duplicate</button>
                  <button className="ribbon-button" disabled={!selected} onClick={() => mirrorSelected('x')}>Mirror X</button>
                  <button className="ribbon-button" disabled={!selected} onClick={() => repeatSelected('x', 6, 8)}>Pattern X</button>
                </RibbonGroup>
                <RibbonGroup title="Align">
                  <button className="ribbon-button" disabled={selectedIds.length < 2} onClick={() => alignSelected('x', 'center')}>Align X</button>
                  <button className="ribbon-button" disabled={selectedIds.length < 2} onClick={() => alignSelected('y', 'min')}>Align Bed</button>
                  <button className="ribbon-button" disabled={selectedIds.length < 3} onClick={() => distributeSelected('x')}>Distribute</button>
                </RibbonGroup>
              </>
            )}

            {workspaceTab === 'inspect' && (
              <>
                <RibbonGroup title="Inspect">
                  <button className="ribbon-button" onClick={runPrintabilityCheck}>
                    <ScanLine size={18} />
                    <span>Print check</span>
                  </button>
                  <select className="ribbon-select" value={booleanMode} onChange={(event) => setBooleanMode(event.target.value as BooleanOperation)}>
                    <option value="subtract">Subtract holes</option>
                    <option value="union">Union holes</option>
                    <option value="intersect">Intersect holes</option>
                  </select>
                  <button className="ribbon-button" onClick={() => void bakeBooleanResult()}>Bake</button>
                </RibbonGroup>
                <RibbonGroup title="Export">
                  <button className="ribbon-button" onClick={() => void export3mf(objects, booleanMode)}>
                    <Download size={18} />
                    <span>3MF</span>
                  </button>
                  <button className="ribbon-button" onClick={() => void exportStl(objects, booleanMode)}>STL</button>
                  <button className="ribbon-button" onClick={() => void exportObj(objects, booleanMode)}>OBJ</button>
                  <button className="ribbon-button" onClick={() => exportProject(objects)}>
                    <FileJson size={18} />
                    <span>Project</span>
                  </button>
                </RibbonGroup>
              </>
            )}
          </section>
          <div className="ribbon-context">
            <strong>{workspaceTabs.find((tab) => tab.id === workspaceTab)?.label}</strong>
            <span>{workspaceTab === 'sketch' ? 'Create thin profiles first, then extrude them into bodies.' : workspaceTab === 'solid' ? 'Create and modify printable 3D bodies.' : workspaceTab === 'arrange' ? 'Position, pattern, mirror, and align selected objects.' : 'Check printability, bake booleans, and export.'}</span>
          </div>
        </div>
        <input
          ref={svgInputRef}
          className="hidden-file"
          type="file"
          accept=".svg,image/svg+xml"
          onChange={(event) => void handleSvgImport(event.currentTarget.files?.[0], addImportedSvg)}
        />
        <input
          ref={projectInputRef}
          className="hidden-file"
          type="file"
          accept=".json,application/json"
          onChange={(event) => void handleProjectImport(event.currentTarget.files?.[0], importProject)}
        />
      </section>

      <section className="cad-main">
        <aside className="browser-panel">
          <PanelHeader icon={<Layers size={16} />} title="Browser" />
          {objects.length === 0 ? (
            <div className="empty-browser">
              <strong>Empty design</strong>
              <span>Create a primitive, insert SVG, or open a project.</span>
            </div>
          ) : (
            <div className="object-list">
              {objects.map((object) => (
                <button
                  key={object.id}
                  className={selectedIds.includes(object.id) ? 'object-row selected' : 'object-row'}
                  onClick={(event) => selectObject(object.id, event.shiftKey)}
                >
                  <span>{object.name}</span>
                  <small>{object.role}</small>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="workspace">
          <Viewport />
          {objects.length === 0 && (
            <div className="empty-workspace">
              <strong>Start with geometry</strong>
              <span>Use the Create tools above. The workspace is intentionally empty by default.</span>
            </div>
          )}
          <div className="viewport-hud">
            <span>Grid {snapStepMm} mm</span>
            <label className="hud-toggle">
              <input type="checkbox" checked={snapEnabled} onChange={toggleSnap} />
              Snap
            </label>
            <input
              className="hud-number"
              type="number"
              min="0.1"
              step="0.5"
              value={snapStepMm}
              onChange={(event) => setSnapStep(Number(event.target.value))}
            />
            <span>{cameraMode === 'fly' ? 'Fly: WASD + Q/E' : 'Orbit: mouse + wheel'}</span>
            <button onClick={() => setCameraMode(cameraMode === 'fly' ? 'orbit' : 'fly')}>
              {cameraMode === 'fly' ? 'Orbit mode' : 'Fly mode'}
            </button>
          </div>
        </section>

        <aside className="inspector-panel">
          <PanelHeader icon={<Grid2X2 size={16} />} title="Inspector" />
          {selected ? <Inspector objectId={selected.id} /> : <p className="muted">Select an object to edit exact parameters.</p>}

          <div className="panel-divider" />
          <PanelHeader icon={<ScanLine size={16} />} title="Printability" />
          <button className="wide" onClick={runPrintabilityCheck}>Run check</button>
          <div className="issues">
            {printIssues.length === 0 ? (
              <p className="muted">No check results yet.</p>
            ) : (
              printIssues.map((issue) => (
                <div key={issue.id} className={`issue ${issue.severity}`}>
                  {issue.message}
                </div>
              ))
            )}
          </div>

          <button className="destructive" disabled={!selected} onClick={deleteSelected}>
            <Trash2 size={16} /> Delete selected
          </button>
        </aside>
      </section>
    </main>
  );
}

async function handleSvgImport(file: File | undefined, addImportedSvg: (svgMarkup: string, name?: string) => void) {
  if (!file) return;
  addImportedSvg(await file.text(), file.name.replace(/\.svg$/i, ''));
}

async function handleProjectImport(file: File | undefined, importProject: (objects: CadObject[]) => void) {
  if (!file) return;
  const data = JSON.parse(await file.text()) as { objects?: CadObject[] };
  if (Array.isArray(data.objects)) {
    importProject(data.objects);
  }
}

function RibbonGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ribbon-group">
      <div className="ribbon-tools">{children}</div>
      <h2>{title}</h2>
    </section>
  );
}

function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <header className="panel-header">
      {icon}
      <h2>{title}</h2>
    </header>
  );
}

function ModeButton({ mode, active, label, icon }: { mode: TransformMode; active: TransformMode; label: string; icon: React.ReactNode }) {
  const setTransformMode = useCadStore((state) => state.setTransformMode);
  return (
    <button className={active === mode ? 'ribbon-button active' : 'ribbon-button'} onClick={() => setTransformMode(mode)}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Inspector({ objectId }: { objectId: string }) {
  const object = useCadStore((state) => state.objects.find((item) => item.id === objectId));
  const updateObject = useCadStore((state) => state.updateObject);

  if (!object) return null;

  return (
    <div className="inspector">
      <label>
        Name
        <input value={object.name} onChange={(event) => updateObject(object.id, { name: event.target.value })} />
      </label>
      <label>
        Role
        <select
          value={object.role}
          onChange={(event) => updateObject(object.id, { role: event.target.value as 'solid' | 'hole' | 'reference' })}
        >
          <option value="solid">Solid</option>
          <option value="hole">Hole</option>
          <option value="reference">Reference</option>
        </select>
      </label>
      <VectorEditor title="Position mm" value={object.position} onChange={(position) => updateObject(object.id, { position })} />
      <VectorEditor title="Size mm" value={object.dimensions} onChange={(dimensions) => updateObject(object.id, { dimensions })} />
      <VectorEditor title="Rotation deg" value={object.rotation} onChange={(rotation) => updateObject(object.id, { rotation })} />
      {object.kind === 'tube' && (
        <NumberField label="Inner radius" value={object.innerRadius ?? 8} onChange={(innerRadius) => updateObject(object.id, { innerRadius })} />
      )}
      {(object.kind === 'roundedBox' || object.kind === 'text' || object.kind === 'svg') && (
        <NumberField label="Bevel" value={object.bevel ?? 0} onChange={(bevel) => updateObject(object.id, { bevel })} />
      )}
      {object.kind === 'text' && (
        <label>
          Text
          <input value={object.text ?? ''} onChange={(event) => updateObject(object.id, { text: event.target.value })} />
        </label>
      )}
      {object.kind === 'svg' && (
        <label>
          SVG markup
          <textarea value={object.svgMarkup ?? ''} onChange={(event) => updateObject(object.id, { svgMarkup: event.target.value })} />
        </label>
      )}
      <label>
        Color
        <input type="color" value={object.color} onChange={(event) => updateObject(object.id, { color: event.target.value })} />
      </label>
    </div>
  );
}

function VectorEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: { x: number; y: number; z: number };
  onChange: (value: { x: number; y: number; z: number }) => void;
}) {
  return (
    <fieldset className="vector-field">
      <legend>{title}</legend>
      {(['x', 'y', 'z'] as Axis[]).map((axis) => (
        <label key={axis}>
          {axis.toUpperCase()}
          <input
            type="number"
            step="1"
            value={Number(value[axis].toFixed(3))}
            onChange={(event) => onChange({ ...value, [axis]: Number(event.target.value) })}
          />
        </label>
      ))}
    </fieldset>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      {label}
      <input type="number" step="0.5" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
