import { useState, type FormEvent } from 'react';
import { Copy, FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react';
import { getCellId } from '../cells';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  loadDocument,
  renameDocument,
} from '../store/slices/documentsSlice';
import { loadSpreadsheet } from '../store/slices/spreadsheetSlice';
import { closeCreateModal, openCreateModal } from '../store/slices/uiSlice';
import type { DocumentDraft } from '../types';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const docs = useAppSelector(state => state.documents.items);
  const userId = useAppSelector(state => state.auth.user.id);
  const modalOpen = useAppSelector(state => state.ui.createModalOpen);
  const [draft, setDraft] = useState<DocumentDraft>({ title: 'Новая таблица', rows: 100, cols: 26 });

  const rename = (id: string, oldTitle: string) => {
    const title = prompt('Новое название', oldTitle)?.trim();
    if (title) {
      dispatch(renameDocument({ id, title }));
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const action = createDocument({ draft, ownerId: userId });
    dispatch(action);
    dispatch(loadSpreadsheet(action.payload));
    dispatch(closeCreateModal());
    setDraft({ title: 'Новая таблица', rows: 100, cols: 26 });
  };

  return (
    <main className="dashboard">
      <div className="topbar">
        <h1>Мои документы</h1>
        <button onClick={() => dispatch(openCreateModal())} className="btn primary">
          <Plus size={18} /> Создать
        </button>
      </div>

      <div className="docs-grid">
        {docs.map(doc => (
          <article key={doc.id} className="doc-card" onClick={() => dispatch(loadDocument(doc.id))}>
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
              <button title="Переименовать" onClick={() => rename(doc.id, doc.title)}><Pencil size={16} /></button>
              <button title="Дублировать" onClick={() => dispatch(duplicateDocument(doc.id))}><Copy size={16} /></button>
              <button title="Удалить" onClick={() => {
                if (window.confirm('Удалить документ?')) {
                  dispatch(deleteDocument(doc.id));
                }
              }}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submit}>
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
              <button className="btn" type="button" onClick={() => dispatch(closeCreateModal())}>Отмена</button>
              <button className="btn primary" type="submit">Создать</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
