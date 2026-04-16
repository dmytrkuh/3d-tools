export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type PrimitiveKind =
  | 'box'
  | 'roundedBox'
  | 'cylinder'
  | 'tube'
  | 'sphere'
  | 'wedge'
  | 'slot'
  | 'screwHole'
  | 'magnetPocket'
  | 'text'
  | 'svg'
  | 'mesh';

export type BooleanOperation = 'union' | 'subtract' | 'intersect';
export type TransformMode = 'translate' | 'rotate' | 'scale';
export type CameraMode = 'orbit' | 'fly';
export type Axis = 'x' | 'y' | 'z';

export type CadObject = {
  id: string;
  name: string;
  kind: PrimitiveKind;
  role: 'solid' | 'hole' | 'template';
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  dimensions: Vec3;
  radius?: number;
  innerRadius?: number;
  bevel?: number;
  segments?: number;
  text?: string;
  svgMarkup?: string;
  mesh?: SerializedGeometry;
  color: string;
  visible: boolean;
};

export type SerializedGeometry = {
  position: number[];
  normal?: number[];
  index?: number[];
};

export type PrintIssue = {
  id: string;
  objectId?: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
};

export type TemplateKind =
  | 'boxWithLid'
  | 'hook'
  | 'lBracket'
  | 'cableClip'
  | 'organizerTray';
