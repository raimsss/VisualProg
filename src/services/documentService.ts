import type { Document } from '../types.js';

const STORAGE_KEY = 'visualprog-documents';

function readAll(): Document[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) as Document[] : [];
}

function writeAll(docs: Document[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }
}

export const documentService = {
  listDocuments(userId: string): Document[] {
    return readAll().filter(doc => doc.ownerId === userId);
  },

  getDocument(userId: string, documentId: string): Document | null {
    return readAll().find(doc => doc.ownerId === userId && doc.id === documentId) ?? null;
  },

  saveDocuments(docs: Document[]) {
    writeAll(docs);
  },

  saveDocument(doc: Document): Document {
    const docs = readAll();
    const next = docs.some(item => item.id === doc.id)
      ? docs.map(item => item.id === doc.id ? doc : item)
      : [...docs, doc];

    writeAll(next);
    return doc;
  },
};
