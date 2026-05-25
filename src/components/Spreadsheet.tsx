import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Save, Upload } from 'lucide-react';
import {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  getCellId,
  getColumnName,
  makeCell,
  parseCsv,
  recalculateCells,
  toCsv,
} from '../cells';
import type { Document, SpreadsheetData } from '../types';

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 30;
const SHEET_HEIGHT = 620;
const OVERSCAN = 8;

interface SpreadsheetProps {
  doc: Document;
  onBack: () => void;
  onSave: (data: SpreadsheetData) => Promise<void>;
  onChangeDoc: (patch: Partial<Document>) => Promise<void>;
}

interface MenuState {
  x: number;
  y: number;
  row: number;
  col: number;
}

type SaveState = 'saved' | 'saving' | 'error';

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function shiftRows(data: SpreadsheetData, startRow: number, delta: number): SpreadsheetData {
  const entries = Object.entries(data);
  const next: SpreadsheetData = {};

  entries.forEach(([id, cell]) => {
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

function shiftCols(data: SpreadsheetData, startCol: number, delta: number): SpreadsheetData {
  const next: SpreadsheetData = {};

  Object.entries(data).forEach(([id, cell]) => {
    const match = id.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      return;
    }
    const col = match[1].split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
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

export default function Spreadsheet({ doc, onBack, onSave, onChangeDoc }: SpreadsheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [cells, setCells] = useState<SpreadsheetData>(doc.data);
  const [rows, setRows] = useState(doc.rows || DEFAULT_ROWS);
  const [cols, setCols] = useState(doc.cols || DEFAULT_COLS);
  const [colWidths, setColWidths] = useState<Record<number, number>>(doc.colWidths || {});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>(doc.rowHeights || {});
  const [active, setActive] = useState(getCellId(0, 0));
  const [editing, setEditing] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState(getCellId(0, 0));
  const [selectionEnd, setSelectionEnd] = useState(getCellId(0, 0));
  const [scrollTop, setScrollTop] = useState(0);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [dirty, setDirty] = useState(false);

  const rowTop = useMemo(() => {
    const tops: number[] = [];
    let top = 0;
    for (let row = 0; row < rows; row += 1) {
      tops.push(top);
      top += rowHeights[row] || DEFAULT_ROW_HEIGHT;
    }
    return tops;
  }, [rows, rowHeights]);

  const totalHeight = rows ? rowTop[rows - 1] + (rowHeights[rows - 1] || DEFAULT_ROW_HEIGHT) : 0;
  const foundStart = rowTop.findIndex(top => top + DEFAULT_ROW_HEIGHT >= scrollTop);
  const startRow = Math.max(0, (foundStart === -1 ? rows - 1 : foundStart) - OVERSCAN);
  const endRow = Math.min(rows - 1, startRow + Math.ceil(SHEET_HEIGHT / DEFAULT_ROW_HEIGHT) + OVERSCAN * 2);
  const visibleRows = Array.from({ length: Math.max(0, endRow - startRow + 1) }, (_, index) => startRow + index);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      onSave(cells)
        .then(() => {
          setDirty(false);
          setSaveState('saved');
        })
        .catch(() => setSaveState('error'));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [cells, dirty, onSave]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        setSaveState('saving');
        onSave(cells)
          .then(() => {
            setDirty(false);
            setSaveState('saved');
          })
          .catch(() => setSaveState('error'));
      }
      if (event.key === 'Enter' && !editing) {
        setEditing(active);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, cells, editing, onSave]);

  const selectCell = (id: string, shift: boolean) => {
    setActive(id);
    if (shift) {
      setSelectionEnd(id);
    } else {
      setSelectionStart(id);
      setSelectionEnd(id);
    }
  };

  const setCell = (id: string, value: string) => {
    setCells(currentCells => {
      const next = {
        ...currentCells,
        [id]: makeCell(value, currentCells),
      };
      return recalculateCells(next);
    });
    setDirty(true);
    setSaveState('saving');
  };

  const manualSave = () => {
    setSaveState('saving');
    onSave(cells)
      .then(() => {
        setDirty(false);
        setSaveState('saved');
      })
      .catch(() => setSaveState('error'));
  };

  const inSelection = (row: number, col: number) => {
    const start = selectionStart.match(/^([A-Z]+)(\d+)$/);
    const end = selectionEnd.match(/^([A-Z]+)(\d+)$/);
    if (!start || !end) {
      return false;
    }
    const startRow = Number(start[2]) - 1;
    const endRow = Number(end[2]) - 1;
    const startCol = start[1].split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
    const endCol = end[1].split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;

    return row >= Math.min(startRow, endRow)
      && row <= Math.max(startRow, endRow)
      && col >= Math.min(startCol, endCol)
      && col <= Math.max(startCol, endCol);
  };

  const changeSize = async (patch: Partial<Document>) => {
    await onChangeDoc(patch);
  };

  const insertRow = (row: number) => {
    const data = shiftRows(cells, row, 1);
    setRows(value => value + 1);
    setCells(data);
    setDirty(true);
    setSaveState('saving');
    void changeSize({ rows: rows + 1, data });
  };

  const deleteRow = (row: number) => {
    if (rows <= 1) {
      return;
    }
    const data = shiftRows(cells, row, -1);
    setRows(value => value - 1);
    setCells(data);
    setDirty(true);
    setSaveState('saving');
    void changeSize({ rows: rows - 1, data });
  };

  const insertCol = (col: number) => {
    const data = shiftCols(cells, col, 1);
    setCols(value => value + 1);
    setCells(data);
    setDirty(true);
    setSaveState('saving');
    void changeSize({ cols: cols + 1, data });
  };

  const deleteCol = (col: number) => {
    if (cols <= 1) {
      return;
    }
    const data = shiftCols(cells, col, -1);
    setCols(value => value - 1);
    setCells(data);
    setDirty(true);
    setSaveState('saving');
    void changeSize({ cols: cols - 1, data });
  };

  const startResize = (kind: 'row' | 'col', index: number, start: number) => {
    const base = kind === 'col' ? colWidths[index] || DEFAULT_COL_WIDTH : rowHeights[index] || DEFAULT_ROW_HEIGHT;
    let nextColWidths = colWidths;
    let nextRowHeights = rowHeights;

    const move = (event: MouseEvent) => {
      const size = Math.max(24, base + (kind === 'col' ? event.clientX - start : event.clientY - start));
      if (kind === 'col') {
        nextColWidths = { ...nextColWidths, [index]: size };
        setColWidths(nextColWidths);
      } else {
        nextRowHeights = { ...nextRowHeights, [index]: size };
        setRowHeights(nextRowHeights);
      }
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      void onChangeDoc({ colWidths: nextColWidths, rowHeights: nextRowHeights });
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const exportCsv = () => {
    const rowsForCsv = Array.from({ length: rows }, (_, row) => (
      Array.from({ length: cols }, (_, col) => cells[getCellId(row, col)]?.raw || '')
    ));
    downloadFile(`${doc.title}.csv`, toCsv(rowsForCsv), 'text/csv;charset=utf-8');
  };

  const exportJson = () => {
    downloadFile(`${doc.title}.json`, JSON.stringify({ ...doc, rows, cols, data: cells }, null, 2), 'application/json');
  };

  const importCsv = (file: File) => {
    file.text().then(text => {
      window.setTimeout(() => {
        const parsed = parseCsv(text);
        const data: SpreadsheetData = {};
        parsed.forEach((row, rowIndex) => {
          row.forEach((value, colIndex) => {
            if (value !== '') {
              data[getCellId(rowIndex, colIndex)] = makeCell(value, data);
            }
          });
        });
        const next = recalculateCells(data);
        setRows(Math.max(parsed.length, 1));
        setCols(Math.max(...parsed.map(row => row.length), 1));
        setCells(next);
        setDirty(true);
        setSaveState('saving');
        void onChangeDoc({ rows: Math.max(parsed.length, 1), cols: Math.max(...parsed.map(row => row.length), 1), data: next });
      }, 0);
    });
  };

  return (
    <main className="st-wrapper" onClick={() => setMenu(null)}>
      <div className="toolbar">
        <button className="btn" onClick={onBack}>Назад</button>
        <strong>{doc.title}</strong>
        <span className={`save-state ${saveState}`}>{saveState === 'saved' ? 'Сохранено' : saveState === 'saving' ? 'Сохранение...' : 'Ошибка сохранения'}</span>
        <button className="btn" onClick={manualSave}><Save size={16} /> Сохранить</button>
        <button className="btn" onClick={exportCsv}><Download size={16} /> CSV</button>
        <button className="btn" onClick={exportJson}><Download size={16} /> JSON</button>
        <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} /> Импорт CSV</button>
        <input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            importCsv(file);
          }
        }} />
      </div>

      <div className="f-bar">
        <div className="f-id">{active}</div>
        <input value={cells[active]?.raw || ''} onChange={(event) => setCell(active, event.target.value)} />
      </div>

      <div className="sheet" ref={sheetRef} style={{ height: SHEET_HEIGHT }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <div className="grid-h">
          <div className="corner-cell" />
          {Array.from({ length: cols }, (_, col) => (
            <div
              key={col}
              className="col-h"
              style={{ width: colWidths[col] || DEFAULT_COL_WIDTH }}
              onContextMenu={(event) => {
                event.preventDefault();
                setMenu({ x: event.clientX, y: event.clientY, row: 0, col });
              }}
            >
              {getColumnName(col)}
              <span className="resize-x" onMouseDown={(event) => startResize('col', col, event.clientX)} />
            </div>
          ))}
        </div>

        <div className="rows-window" style={{ height: totalHeight, position: 'relative' }}>
          {visibleRows.map(row => (
            <div className="sheet-row" key={row} style={{ top: rowTop[row], height: rowHeights[row] || DEFAULT_ROW_HEIGHT }}>
              <div
                className="row-num"
                onContextMenu={(event) => {
                  event.preventDefault();
                  setMenu({ x: event.clientX, y: event.clientY, row, col: 0 });
                }}
              >
                {row + 1}
                <span className="resize-y" onMouseDown={(event) => startResize('row', row, event.clientY)} />
              </div>
              {Array.from({ length: cols }, (_, col) => {
                const id = getCellId(row, col);
                const cell = cells[id];
                const isEditing = editing === id;
                return (
                  <div
                    key={id}
                    className={`cell-unit ${active === id ? 'active' : ''} ${inSelection(row, col) ? 'selected' : ''}`}
                    style={{ width: colWidths[col] || DEFAULT_COL_WIDTH, height: rowHeights[row] || DEFAULT_ROW_HEIGHT }}
                    onClick={(event) => selectCell(id, event.shiftKey)}
                    onDoubleClick={() => setEditing(id)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setMenu({ x: event.clientX, y: event.clientY, row, col });
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={cell?.raw || ''}
                        onChange={(event) => setCell(id, event.target.value)}
                        onBlur={() => setEditing(null)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            setEditing(null);
                          }
                        }}
                      />
                    ) : (
                      <span>{cell?.value || ''}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {menu && (
        <div className="context-menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
          <button onClick={() => insertRow(menu.row)}>Добавить строку</button>
          <button onClick={() => deleteRow(menu.row)}>Удалить строку</button>
          <button onClick={() => insertCol(menu.col)}>Добавить столбец</button>
          <button onClick={() => deleteCol(menu.col)}>Удалить столбец</button>
        </div>
      )}
    </main>
  );
}
