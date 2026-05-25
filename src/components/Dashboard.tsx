import { FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import type { Document } from '../types';

interface DashboardProps {
  docs: Document[];
  onSelect: (doc: Document) => void;
  onCreate: (title: string) => void;
  onDelete: (id: string) => void;
}

export default function Dashboard({ docs, onSelect, onCreate, onDelete }: DashboardProps) {
  const askTitle = () => {
    const title = prompt('Название?')?.trim();
    if (title) {
      onCreate(title);
    }
  };

  return (
    <div className="p-8">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Мои документы</h1>
        <button onClick={askTitle} className="btn-create">
          <Plus size={18} /> Создать таблицу
        </button>
      </div>
      <div className="docs-grid">
        {docs.map((doc: Document) => (
          <div key={doc.id} className="doc-card" onClick={() => onSelect(doc)}>
            <FileSpreadsheet size={40} color="#2b7d2b" />
            <div style={{ marginTop: '10px' }}>
              <h3>{doc.title}</h3>
              <small>{new Date(doc.updatedAt).toLocaleDateString()}</small>
            </div>
            <button className="btn-del" onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
