import type { Document } from './types.js';

export function patchDocument(id: string, patch: Partial<Document>): Promise<Partial<Document>> {
  return new Promise(resolve => {
    window.setTimeout(() => resolve({ ...patch, id }), 180);
  });
}
