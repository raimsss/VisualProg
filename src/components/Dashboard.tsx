import { useState } from 'react';
import { Copy, FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react';
import { getCellId } from '../cells';
import type { Document, DocumentDraft } from '../types';

interface DashboardProps {
  docs: Document[];
  onSelect: (doc: Document) => void;
  onCreate: (draft: DocumentDraft) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export default function Dashboard({
  docs,
  onSelect,
  onCreate,
  onDelete,
  onDuplicate,
  onRename,
}: DashboardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<DocumentDraft>({ title: 'Новая таблица', rows: 100, cols: 26 });

  const renameDoc = (doc: Document) => {
    const title = prompt('Новое название', doc.title)?.trim();
    if (title) {
      onRename(doc.id, title);
    }
  };

  return (
    <main className="dashboard">
      <div className="topbar">
        <h1>Мои документы</h1>
        <button onClick={() => setModalOpen(true)} className="btn primary">
          <Plus size={18} /> Создать
        </button>
      </div>

      <div className="docs-grid">
        {docs.map(doc => (
          <article key={doc.id} className="doc-card" onClick={() => onSelect(doc)}>
            <div className="doc-head">
              <FileSpreadsheet size={30} color="#24723a" />
              <div>
                <h3>{doc.title}</h3>
                <p>{doc.rows} x {doc.cols}</p>
              </div>
            </div>

            <div className="preview">
              {Array.from({ length: 3 }, (_, row) => (
                <div className="preview-row" key={row}>
                  {Array.from({ length: 3 }, (_, col) => {
                    const cell = doc.data[getCellId(row, col)];
                    return <span key={col}>{cell?.value || cell?.raw || ''}</span>;
                  })}
                </div>
              ))}
            </div>

            <div className="doc-meta">
              <span>Создан: {new Date(doc.createdAt).toLocaleDateString()}</span>
              <span>Изменён: {new Date(doc.updatedAt).toLocaleDateString()}</span>
            </div>

            <div className="doc-actions" onClick={(event) => event.stopPropagation()}>
              <button title="Переименовать" onClick={() => renameDoc(doc)}><Pencil size={16} /></button>
              <button title="Дублировать" onClick={() => onDuplicate(doc.id)}><Copy size={16} /></button>
              <button title="Удалить" onClick={() => onDelete(doc.id)}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={(event) => {
              event.preventDefault();
              onCreate(draft);
              setModalOpen(false);
              setDraft({ title: 'Новая таблица', rows: 100, cols: 26 });
            }}
          >
            <h2>Новый документ</h2>
            <label>
              Название
              <input
                value={draft.title}
                onChange={(event) => setDraft(value => ({ ...value, title: event.target.value }))}
                autoFocus
              />
            </label>
            <div className="modal-grid">
              <label>
                Строки
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={draft.rows}
                  onChange={(event) => setDraft(value => ({ ...value, rows: Number(event.target.value) }))}
                />
              </label>
              <label>
                Столбцы
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={draft.cols}
                  onChange={(event) => setDraft(value => ({ ...value, cols: Number(event.target.value) }))}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn" type="button" onClick={() => setModalOpen(false)}>Отмена</button>
              <button className="btn primary" type="submit">Создать</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
