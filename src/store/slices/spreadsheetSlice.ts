import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_COLS, DEFAULT_ROWS, getCellId, makeCell, recalculateCells } from '../../cells.js';
import type { Document, SpreadsheetData } from '../../types.js';

interface Snapshot {
  cells: SpreadsheetData;
  rows: number;
  cols: number;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
}

interface SpreadsheetState extends Snapshot {
  activeCell: string;
  selectionStart: string;
  selectionEnd: string;
  history: Snapshot[];
  future: Snapshot[];
  dirty: boolean;
}

const emptySnapshot: Snapshot = {
  cells: {},
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  colWidths: {},
  rowHeights: {},
};

const initialState: SpreadsheetState = {
  ...emptySnapshot,
  activeCell: getCellId(0, 0),
  selectionStart: getCellId(0, 0),
  selectionEnd: getCellId(0, 0),
  history: [],
  future: [],
  dirty: false,
};

function snapshot(state: SpreadsheetState): Snapshot {
  return {
    cells: { ...state.cells },
    rows: state.rows,
    cols: state.cols,
    colWidths: { ...state.colWidths },
    rowHeights: { ...state.rowHeights },
  };
}

function saveHistory(state: SpreadsheetState) {
  state.history.push(snapshot(state));
  if (state.history.length > 50) {
    state.history.shift();
  }
  state.future = [];
}

function applySnapshot(state: SpreadsheetState, next: Snapshot) {
  state.cells = next.cells;
  state.rows = next.rows;
  state.cols = next.cols;
  state.colWidths = next.colWidths;
  state.rowHeights = next.rowHeights;
}

function shiftRows(data: SpreadsheetData, startRow: number, delta: number): SpreadsheetData {
  const next: SpreadsheetData = {};

  Object.entries(data).forEach(([id, cell]) => {
    const match = id.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      return;
    }

    const row = Number(match[2]) - 1;
    if (delta < 0 && row === startRow) {
      return;
    }

    const newRow = row >= startRow ? row + delta : row;
    if (newRow >= 0) {
      next[`${match[1]}${newRow + 1}`] = cell;
    }
  });

  return recalculateCells(next);
}

function getColumnIndex(name: string): number {
  return name.split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function getColumnName(index: number): string {
  let name = '';
  let current = index + 1;
  while (current > 0) {
    const rest = (current - 1) % 26;
    name = String.fromCharCode(65 + rest) + name;
    current = Math.floor((current - rest) / 26);
  }
  return name;
}

function shiftCols(data: SpreadsheetData, startCol: number, delta: number): SpreadsheetData {
  const next: SpreadsheetData = {};

  Object.entries(data).forEach(([id, cell]) => {
    const match = id.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      return;
    }

    const col = getColumnIndex(match[1]);
    if (delta < 0 && col === startCol) {
      return;
    }

    const newCol = col >= startCol ? col + delta : col;
    if (newCol >= 0) {
      next[`${getColumnName(newCol)}${match[2]}`] = cell;
    }
  });

  return recalculateCells(next);
}

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    loadSpreadsheet(state, action: PayloadAction<Document>) {
      state.cells = action.payload.data;
      state.rows = action.payload.rows;
      state.cols = action.payload.cols;
      state.colWidths = action.payload.colWidths;
      state.rowHeights = action.payload.rowHeights;
      state.activeCell = getCellId(0, 0);
      state.selectionStart = getCellId(0, 0);
      state.selectionEnd = getCellId(0, 0);
      state.history = [];
      state.future = [];
      state.dirty = false;
    },
    clearSpreadsheet(state) {
      applySnapshot(state, emptySnapshot);
      state.activeCell = getCellId(0, 0);
      state.selectionStart = getCellId(0, 0);
      state.selectionEnd = getCellId(0, 0);
      state.history = [];
      state.future = [];
      state.dirty = false;
    },
    selectCell(state, action: PayloadAction<{ id: string; shift: boolean }>) {
      state.activeCell = action.payload.id;
      if (action.payload.shift) {
        state.selectionEnd = action.payload.id;
      } else {
        state.selectionStart = action.payload.id;
        state.selectionEnd = action.payload.id;
      }
    },
    setCell(state, action: PayloadAction<{ id: string; value: string }>) {
      if (state.cells[action.payload.id]?.raw === action.payload.value) {
        return;
      }

      saveHistory(state);
      state.cells[action.payload.id] = makeCell(action.payload.value, state.cells);
      state.cells = recalculateCells(state.cells);
      state.dirty = true;
    },
    importData(state, action: PayloadAction<Snapshot>) {
      saveHistory(state);
      applySnapshot(state, {
        ...action.payload,
        cells: recalculateCells(action.payload.cells),
      });
      state.dirty = true;
    },
    insertRow(state, action: PayloadAction<number>) {
      saveHistory(state);
      state.cells = shiftRows(state.cells, action.payload, 1);
      state.rows += 1;
      state.dirty = true;
    },
    deleteRow(state, action: PayloadAction<number>) {
      if (state.rows <= 1) {
        return;
      }

      saveHistory(state);
      state.cells = shiftRows(state.cells, action.payload, -1);
      state.rows -= 1;
      state.dirty = true;
    },
    insertCol(state, action: PayloadAction<number>) {
      saveHistory(state);
      state.cells = shiftCols(state.cells, action.payload, 1);
      state.cols += 1;
      state.dirty = true;
    },
    deleteCol(state, action: PayloadAction<number>) {
      if (state.cols <= 1) {
        return;
      }

      saveHistory(state);
      state.cells = shiftCols(state.cells, action.payload, -1);
      state.cols -= 1;
      state.dirty = true;
    },
    resizeCol(state, action: PayloadAction<{ col: number; width: number }>) {
      state.colWidths[action.payload.col] = Math.max(24, action.payload.width);
      state.dirty = true;
    },
    resizeRow(state, action: PayloadAction<{ row: number; height: number }>) {
      state.rowHeights[action.payload.row] = Math.max(24, action.payload.height);
      state.dirty = true;
    },
    markSaved(state) {
      state.dirty = false;
    },
    undo(state) {
      const previous = state.history.pop();
      if (!previous) {
        return;
      }

      state.future.unshift(snapshot(state));
      applySnapshot(state, previous);
      state.dirty = true;
    },
    redo(state) {
      const next = state.future.shift();
      if (!next) {
        return;
      }

      state.history.push(snapshot(state));
      applySnapshot(state, next);
      state.dirty = true;
    },
  },
});

export const {
  clearSpreadsheet,
  deleteCol,
  deleteRow,
  importData,
  insertCol,
  insertRow,
  loadSpreadsheet,
  markSaved,
  redo,
  resizeCol,
  resizeRow,
  selectCell,
  setCell,
  undo,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;
