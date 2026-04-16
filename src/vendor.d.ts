declare module '@jscadui/3mf-export' {
  export const fileForContentTypes: { name: string; content: string };
  export class FileForRelThumbnail {
    name: string;
    content: string;
    add3dModel(path: string): void;
  }
  export function to3dmodelSimple(
    meshes: Array<{
      id: string;
      vertices: Float32Array;
      indices: Uint32Array;
      name?: string;
      transform: number[];
    }>,
    header?: {
      unit?: string;
      title?: string;
      author?: string;
      description?: string;
      application?: string;
      creationDate?: Date;
      license?: string;
      modificationDate?: Date;
    },
    precision?: number,
  ): string;
}
