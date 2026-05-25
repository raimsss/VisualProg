import { useCallback, useState } from 'react';
import Dashboard from './components/Dashboard';
import Spreadsheet from './components/Spreadsheet';
import type { Document, SpreadsheetData } from './types';

export default function App() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  const createDoc = (title: string) => {
    const name = title.trim();
    if (!name) {
      return;
    }

    const now = new Date().toISOString();
    const newDoc: Document = {
      id: Math.random().toString(36).substr(2, 9),
      title: name,
      createdAt: now,
      updatedAt: now,
      data: {}
    };
    setDocs(currentDocs => [...currentDocs, newDoc]);
  };

  const deleteDoc = (id: string) => {
    if (window.confirm('Удалить документ?')) {
      setDocs(currentDocs => currentDocs.filter(doc => doc.id !== id));
    }
  };

  const saveDoc = useCallback((id: string, data: SpreadsheetData) => {
    setDocs(currentDocs => currentDocs.map(doc => (
      doc.id === id ? { ...doc, data, updatedAt: new Date().toISOString() } : doc
    )));
  }, []);

  return (
    <div className="app-container">
      {activeDoc ? (
        <Spreadsheet
          doc={activeDoc}
          onBack={() => setActiveDoc(null)}
          onSave={(data) => saveDoc(activeDoc.id, data)}
        />
      ) : (
        <Dashboard
          docs={docs}
          onSelect={setActiveDoc}
          onCreate={createDoc}
          onDelete={deleteDoc}
        />
      )}
    </div>
  );
}
