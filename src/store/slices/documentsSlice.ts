import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store.js';
import { loadSpreadsheet, markSaved } from './spreadsheetSlice.js';
import { setSaveStatus } from './uiSlice.js';
import type { Document, DocumentDraft } from '../../types.js';

const STORAGE_KEY = 'visualprog-documents';

interface DocumentsState {
  items: Document[];
  activeDocumentId: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

const initialState: DocumentsState = {
  items: [],
  activeDocumentId: null,
  status: 'idle',
};

function readDocs(): Document[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) as Document[] : [];
}

function writeDocs(docs: Document[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }
}

function makeDocument(draft: DocumentDraft, ownerId: string): Document {
  const now = new Date().toISOString();

  return {
    id: Math.random().toString(36).slice(2, 11),
    ownerId,
    title: draft.title.trim(),
    createdAt: now,
    updatedAt: now,
    rows: Math.max(1, draft.rows || 100),
    cols: Math.max(1, draft.cols || 26),
    colWidths: {},
    rowHeights: {},
    data: {},
  };
}

export const loadDocuments = createAsyncThunk<Document[], void, { state: RootState }>(
  'documents/loadDocuments',
  async (_, { getState }) => {
    const userId = getState().auth.user.id;
    return readDocs().filter(doc => doc.ownerId === userId);
  },
);

export const loadDocument = createAsyncThunk<Document, string, { state: RootState }>(
  'documents/loadDocument',
  async (id, { getState, dispatch }) => {
    const document = getState().documents.items.find(doc => doc.id === id);
    if (!document) {
      throw new Error('Документ не найден');
    }

    dispatch(loadSpreadsheet(document));
    return document;
  },
);

export const saveActiveDocument = createAsyncThunk<Document, void, { state: RootState }>(
  'documents/saveActiveDocument',
  async (_, { getState, dispatch }) => {
    dispatch(setSaveStatus('saving'));
    const state = getState();
    const document = state.documents.items.find(doc => doc.id === state.documents.activeDocumentId);
    if (!document) {
      throw new Error('Нет активного документа');
    }

    const updated: Document = {
      ...document,
      updatedAt: new Date().toISOString(),
      rows: state.spreadsheet.rows,
      cols: state.spreadsheet.cols,
      colWidths: state.spreadsheet.colWidths,
      rowHeights: state.spreadsheet.rowHeights,
      data: state.spreadsheet.cells,
    };

    const docs = state.documents.items.map(doc => doc.id === updated.id ? updated : doc);
    writeDocs(docs);
    dispatch(markSaved());
    dispatch(setSaveStatus('saved'));
    return updated;
  },
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    createDocument: {
      reducer(state, action: PayloadAction<Document>) {
        state.items.push(action.payload);
        state.activeDocumentId = action.payload.id;
        writeDocs(state.items);
      },
      prepare(payload: { draft: DocumentDraft; ownerId: string }) {
        return {
          payload: makeDocument(payload.draft, payload.ownerId),
        };
      },
    },
    renameDocument(state, action: PayloadAction<{ id: string; title: string }>) {
      const doc = state.items.find(item => item.id === action.payload.id);
      const title = action.payload.title.trim();
      if (doc && title) {
        doc.title = title;
        doc.updatedAt = new Date().toISOString();
        writeDocs(state.items);
      }
    },
    deleteDocument(state, action: PayloadAction<string>) {
      state.items = state.items.filter(doc => doc.id !== action.payload);
      if (state.activeDocumentId === action.payload) {
        state.activeDocumentId = null;
      }
      writeDocs(state.items);
    },
    duplicateDocument(state, action: PayloadAction<string>) {
      const doc = state.items.find(item => item.id === action.payload);
      if (!doc) {
        return;
      }

      const now = new Date().toISOString();
      state.items.push({
        ...doc,
        id: Math.random().toString(36).slice(2, 11),
        title: `${doc.title} копия`,
        createdAt: now,
        updatedAt: now,
        data: { ...doc.data },
        colWidths: { ...doc.colWidths },
        rowHeights: { ...doc.rowHeights },
      });
      writeDocs(state.items);
    },
    closeDocument(state) {
      state.activeDocumentId = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadDocuments.pending, state => {
        state.status = 'loading';
      })
      .addCase(loadDocuments.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'ready';
      })
      .addCase(loadDocuments.rejected, state => {
        state.status = 'error';
      })
      .addCase(loadDocument.fulfilled, (state, action) => {
        state.activeDocumentId = action.payload.id;
      })
      .addCase(saveActiveDocument.fulfilled, (state, action) => {
        state.items = state.items.map(doc => doc.id === action.payload.id ? action.payload : doc);
      });
  },
});

export const {
  closeDocument,
  createDocument,
  deleteDocument,
  duplicateDocument,
  renameDocument,
} = documentsSlice.actions;
export default documentsSlice.reducer;
