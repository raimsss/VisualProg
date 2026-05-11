import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Spreadsheet from './components/Spreadsheet';
import { Document } from './types';

export default function App() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  const createDoc = (title: string) => {
    const newDoc: Document = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {}
    };
    setDocs([...docs, newDoc]);
  };

  const deleteDoc = (id: string) => {
    if (window.confirm('Удалить документ?')) {
      setDocs(docs.filter(d => d.id !== id));
    }
  };

  return (
    <div className="app-container">
      {activeDoc ? (
        <Spreadsheet 
          doc={activeDoc} 
          onBack={() => setActiveDoc(null)} 
          onSave={(data) => {
            setDocs(docs.map(d => d.id === activeDoc.id ? {...d, data, updatedAt: new Date().toISOString()} : d));
          }}
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