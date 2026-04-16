import { useEffect, useRef } from 'react';
import { Download, Grid2X2, MousePointer2, RotateCcw, ScanLine, Scaling, Trash2, Upload } from 'lucide-react';
import { useCadStore } from '../store/cadStore';
import type { Axis, BooleanOperation, CadObject, PrimitiveKind, TemplateKind, TransformMode } from '../types';
import { export3mf, exportObj, exportProject, exportStl } from '../lib/exporters';
import { Viewport } from './Viewport';

const primitives: Array<{ kind: PrimitiveKind; label: string }> = [
  { kind: 'box', label: 'Box' },
  { kind: 'roundedBox', label: 'Rounded box' },
  { kind: 'cylinder', label: 'Cylinder' },
  { kind: 'tube', label: 'Tube' },
  { kind: 'sphere', label: 'Sphere' },
  { kind: 'wedge', label: 'Wedge' },
  { kind: 'text', label: 'Text' },
];

const holePrimitives: Array<{ kind: PrimitiveKind; label: string }> = [
  { kind: 'screwHole', label: 'Screw hole' },
  { kind: 'slot', label: 'Slot' },
  { kind: 'magnetPocket', label: 'Magnet pocket' },
];

const templates: Array<{ kind: TemplateKind; label: string }> = [
  { kind: 'boxWithLid', label: 'Box + lid' },
  { kind: 'hook', label: 'Hook' },
  { kind: 'lBracket', label: 'L bracket' },
  { kind: 'cableClip', label: 'Cable clip' },
  { kind: 'organizerTray', label: 'Organizer' },
];

export function App() {
  const svgInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const objects = useCadStore((state) => state.objects);
  const selectedIds = useCadStore((state) => state.selectedIds);
  const selected = objects.find((object) => object.id === selectedIds[0]);
  const selectObject = useCadStore((state) => state.selectObject);
  const addPrimitive = useCadStore((state) => state.addPrimitive);
  const addTemplate = useCadStore((state) => state.addTemplate);
  const addImportedSvg = useCadStore((state) => state.addImportedSvg);
  const importProject = useCadStore((state) => state.importProject);
  const deleteSelected = useCadStore((state) => state.deleteSelected);
  const duplicateSelected = useCadStore((state) => state.duplicateSelected);
  const mirrorSelected = useCadStore((state) => state.mirrorSelected);
  const repeatSelected = useCadStore((state) => state.repeatSelected);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const key = event.key.toLowerCase();

      if (event.key === 'Delete') deleteSelected();
      if (key === 'g') setTransformMode('translate');
      if (key === 'r') setTransformMode('rotate');
      if (key === 's') setTransformMode('scale');
      if (key === 'f') setCameraMode(cameraMode === 'fly' ? 'orbit' : 'fly');
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
  }, [cameraMode, deleteSelected, duplicateSelected, redo, setCameraMode, setTransformMode, undo]);

  return (
    <main className="app-shell">
      <aside className="sidebar left-panel">
        <header className="brand">
          <div className="brand-mark">3D</div>
          <div>
            <h1>3D Tools CAD</h1>
            <p>Моделирование в миллиметрах для печати</p>
          </div>
        </header>

        <Panel title="Примитивы">
          <div className="button-grid">
            {primitives.map((item) => (
              <button key={item.kind} onClick={() => addPrimitive(item.kind)}>
                {item.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Hole-объекты">
          <div className="button-grid">
            {holePrimitives.map((item) => (
              <button key={item.kind} className="danger-soft" onClick={() => addPrimitive(item.kind)}>
                {item.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Шаблоны">
          <div className="button-grid">
            {templates.map((item) => (
              <button key={item.kind} onClick={() => addTemplate(item.kind)}>
                {item.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Импорт">
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
          <div className="button-grid">
            <button onClick={() => svgInputRef.current?.click()}>
              <Upload size={16} /> SVG
            </button>
            <button onClick={() => projectInputRef.current?.click()}>
              <Upload size={16} /> Project
            </button>
          </div>
        </Panel>

        <Panel title="Трансформации">
          <div className="tool-row">
            <ModeButton mode="translate" active={transformMode} label="Move" icon={<MousePointer2 size={16} />} />
            <ModeButton mode="rotate" active={transformMode} label="Rotate" icon={<RotateCcw size={16} />} />
            <ModeButton mode="scale" active={transformMode} label="Scale" icon={<Scaling size={16} />} />
          </div>
          <div className="button-grid">
            <button onClick={duplicateSelected}>Duplicate</button>
            <button onClick={() => mirrorSelected('x')}>Mirror X</button>
            <button onClick={() => repeatSelected('x', 6, 8)}>Repeat X</button>
            <button onClick={() => repeatSelected('z', 6, 8)}>Repeat Z</button>
          </div>
          <div className="button-grid">
            <button onClick={() => alignSelected('x', 'center')}>Align X</button>
            <button onClick={() => alignSelected('y', 'min')}>Align bed</button>
            <button onClick={() => distributeSelected('x')}>Distribute X</button>
            <button onClick={() => distributeSelected('z')}>Distribute Z</button>
          </div>
          <div className="button-grid">
            <button onClick={undo}>Undo</button>
            <button onClick={redo}>Redo</button>
          </div>
          <button className="destructive" onClick={deleteSelected}>
            <Trash2 size={16} /> Delete
          </button>
        </Panel>

        <Panel title="Точность">
          <label className="toggle-line">
            <input type="checkbox" checked={snapEnabled} onChange={toggleSnap} />
            Snap to grid
          </label>
          <label className="compact-label">
            Grid step, mm
            <input type="number" min="0.1" step="0.5" value={snapStepMm} onChange={(event) => setSnapStep(Number(event.target.value))} />
          </label>
        </Panel>
      </aside>

      <section className="workspace">
        <Viewport />
        <div className="viewport-hud">
          <span>Grid {snapStepMm} mm</span>
          <span>{cameraMode === 'fly' ? 'Fly: WASD + mouse' : 'Orbit: mouse + wheel'}</span>
          <button onClick={() => setCameraMode(cameraMode === 'fly' ? 'orbit' : 'fly')}>
            {cameraMode === 'fly' ? 'Orbit mode' : 'Fly mode'}
          </button>
        </div>
      </section>

      <aside className="sidebar right-panel">
        <Panel title="Выбранный объект">
          {selected ? <Inspector objectId={selected.id} /> : <p className="muted">Выбери объект в сцене.</p>}
        </Panel>

        <Panel title="Объекты">
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
        </Panel>

        <Panel title="Печать">
          <button className="wide" onClick={runPrintabilityCheck}>
            <ScanLine size={16} /> Check printability
          </button>
          <div className="issues">
            {printIssues.length === 0 ? (
              <p className="muted">Проверка покажет тонкие места, объекты ниже стола и подсказки по поддержкам.</p>
            ) : (
              printIssues.map((issue) => (
                <div key={issue.id} className={`issue ${issue.severity}`}>
                  {issue.message}
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Экспорт">
          <label className="compact-label">
            Boolean mode for holes
            <select value={booleanMode} onChange={(event) => setBooleanMode(event.target.value as BooleanOperation)}>
              <option value="subtract">Subtract holes</option>
              <option value="union">Union holes</option>
              <option value="intersect">Intersect holes</option>
            </select>
          </label>
          <div className="button-grid">
            <button onClick={() => void exportStl(objects, booleanMode)}>
              <Download size={16} /> STL
            </button>
            <button onClick={() => void exportObj(objects, booleanMode)}>
              <Download size={16} /> OBJ
            </button>
            <button onClick={() => void export3mf(objects, booleanMode)}>
              <Download size={16} /> 3MF
            </button>
            <button onClick={() => exportProject(objects)}>
              <Grid2X2 size={16} /> Project
            </button>
          </div>
          <button className="wide" onClick={() => void bakeBooleanResult()}>
            Bake boolean result
          </button>
        </Panel>

        <Panel title="Навигация">
          <ul className="shortcuts">
            <li>G / R / S: move, rotate, scale</li>
            <li>F: orbit/fly mode</li>
            <li>WASD: fly movement</li>
            <li>Q / E: fly down/up</li>
            <li>Shift: faster fly</li>
            <li>Ctrl+Z / Ctrl+Y: undo, redo</li>
          </ul>
        </Panel>
      </aside>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ModeButton({ mode, active, label, icon }: { mode: TransformMode; active: TransformMode; label: string; icon: React.ReactNode }) {
  const setTransformMode = useCadStore((state) => state.setTransformMode);
  return (
    <button className={active === mode ? 'active' : ''} onClick={() => setTransformMode(mode)}>
      {icon}
      {label}
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
          onChange={(event) => updateObject(object.id, { role: event.target.value as 'solid' | 'hole' | 'template' })}
        >
          <option value="solid">Solid</option>
          <option value="hole">Hole</option>
          <option value="template">Template</option>
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
