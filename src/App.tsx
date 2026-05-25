import { useCallback, useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import Spreadsheet from './components/Spreadsheet';
import { DEFAULT_COLS, DEFAULT_ROWS } from './cells';
import { patchDocument } from './api';
import type { Document, DocumentDraft, SpreadsheetData } from './types';

const USER_ID = 'local-user';
const STORAGE_KEY = 'visualprog-documents';

function createDocument(draft: DocumentDraft): Document {
  const now = new Date().toISOString();

  return {
    id: Math.random().toString(36).slice(2, 11),
    ownerId: USER_ID,
    title: draft.title.trim(),
    createdAt: now,
    updatedAt: now,
    rows: draft.rows,
    cols: draft.cols,
    colWidths: {},
    rowHeights: {},
    data: {},
  };
}

export default function App() {
  const [docs, setDocs] = useState<Document[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as Document[] : [];
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }, [docs]);

  const userDocs = docs.filter(doc => doc.ownerId === USER_ID);
  const activeDoc = userDocs.find(doc => doc.id === activeId) ?? null;

  const createDoc = (draft: DocumentDraft) => {
    if (!draft.title.trim()) {
      return;
    }

    const doc = createDocument({
      title: draft.title,
      rows: Math.max(1, draft.rows || DEFAULT_ROWS),
      cols: Math.max(1, draft.cols || DEFAULT_COLS),
    });
    setDocs(currentDocs => [...currentDocs, doc]);
    setActiveId(doc.id);
  };

  const renameDoc = (id: string, title: string) => {
    const name = title.trim();
    if (!name) {
      return;
    }

    setDocs(currentDocs => currentDocs.map(doc => (
      doc.id === id ? { ...doc, title: name, updatedAt: new Date().toISOString() } : doc
    )));
  };

  const deleteDoc = (id: string) => {
    if (window.confirm('Удалить документ?')) {
      setDocs(currentDocs => currentDocs.filter(doc => doc.id !== id));
      if (activeId === id) {
        setActiveId(null);
      }
    }
  };

  const duplicateDoc = (id: string) => {
    const doc = docs.find(item => item.id === id);
    if (!doc) {
      return;
    }

    const now = new Date().toISOString();
    const copy: Document = {
      ...doc,
      id: Math.random().toString(36).slice(2, 11),
      title: `${doc.title} копия`,
      createdAt: now,
      updatedAt: now,
      data: { ...doc.data },
      colWidths: { ...doc.colWidths },
      rowHeights: { ...doc.rowHeights },
    };
    setDocs(currentDocs => [...currentDocs, copy]);
  };

  const saveDoc = useCallback(async (id: string, patch: Partial<Document>) => {
    await patchDocument(id, patch);
    setDocs(currentDocs => currentDocs.map(doc => (
      doc.id === id ? { ...doc, ...patch, updatedAt: new Date().toISOString() } : doc
    )));
  }, []);

  const saveCells = useCallback((id: string, data: SpreadsheetData) => (
    saveDoc(id, { data })
  ), [saveDoc]);

  return (
    <div className="app-container">
      {activeDoc ? (
        <Spreadsheet
          doc={activeDoc}
          onBack={() => setActiveId(null)}
          onSave={(data) => saveCells(activeDoc.id, data)}
          onChangeDoc={(patch) => saveDoc(activeDoc.id, patch)}
        />
      ) : (
        <Dashboard
          docs={userDocs}
          onSelect={(doc) => setActiveId(doc.id)}
          onCreate={createDoc}
          onDelete={deleteDoc}
          onDuplicate={duplicateDoc}
          onRename={renameDoc}
        />
      )}
    </div>
  );
}
