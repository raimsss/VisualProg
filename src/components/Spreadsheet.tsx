import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Save, Upload } from 'lucide-react';
import {
  getCellId,
  getColumnName,
  makeCell,
  parseCellId,
  parseCsv,
  toCsv,
} from '../cells';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { saveActiveDocument } from '../store/slices/documentsSlice';
import {
  deleteCol,
  deleteRow,
  importData,
  insertCol,
  insertRow,
  resizeCol,
  resizeRow,
  selectCell,
  setCell,
} from '../store/slices/spreadsheetSlice';
import type { SpreadsheetData } from '../types';

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 30;
const SHEET_HEIGHT = 620;
const OVERSCAN = 8;

interface SpreadsheetProps {
  onBack: () => void;
}

interface MenuState {
  x: number;
  y: number;
  row: number;
  col: number;
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function isSelected(id: string, from: string, to: string) {
  const start = parseCellId(from);
  const end = parseCellId(to);
  const current = parseCellId(id);

  if (!start || !end || !current) {
    return false;
  }

  return current.row >= Math.min(start.row, end.row)
    && current.row <= Math.max(start.row, end.row)
    && current.col >= Math.min(start.col, end.col)
    && current.col <= Math.max(start.col, end.col);
}

export default function Spreadsheet({ onBack }: SpreadsheetProps) {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const activeDocument = useAppSelector(state => (
    state.documents.items.find(doc => doc.id === state.documents.activeDocumentId)
  ));
  const saveStatus = useAppSelector(state => state.ui.saveStatus);
  const {
    activeCell,
    cells,
    colWidths,
    cols,
    rowHeights,
    rows,
    selectionEnd,
    selectionStart,
  } = useAppSelector(state => state.spreadsheet);

  const [editing, setEditing] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [menu, setMenu] = useState<MenuState | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !editing) {
        setEditing(activeCell);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeCell, editing]);

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

  const changeCell = (id: string, value: string) => {
    dispatch(setCell({ id, value }));
  };

  const startResize = (kind: 'row' | 'col', index: number, start: number) => {
    const base = kind === 'col' ? colWidths[index] || DEFAULT_COL_WIDTH : rowHeights[index] || DEFAULT_ROW_HEIGHT;

    const move = (event: MouseEvent) => {
      const size = Math.max(24, base + (kind === 'col' ? event.clientX - start : event.clientY - start));
      if (kind === 'col') {
        dispatch(resizeCol({ col: index, width: size }));
      } else {
        dispatch(resizeRow({ row: index, height: size }));
      }
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const exportCsv = () => {
    const rowsForCsv = Array.from({ length: rows }, (_, row) => (
      Array.from({ length: cols }, (_, col) => cells[getCellId(row, col)]?.raw || '')
    ));
    downloadFile(`${activeDocument?.title || 'table'}.csv`, toCsv(rowsForCsv), 'text/csv;charset=utf-8');
  };

  const exportJson = () => {
    downloadFile(
      `${activeDocument?.title || 'table'}.json`,
      JSON.stringify({ ...activeDocument, rows, cols, colWidths, rowHeights, data: cells }, null, 2),
      'application/json',
    );
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

        dispatch(importData({
          cells: data,
          rows: Math.max(parsed.length, 1),
          cols: Math.max(...parsed.map(row => row.length), 1),
          colWidths: {},
          rowHeights: {},
        }));
      }, 0);
    });
  };

  return (
    <main className="st-wrapper" onClick={() => setMenu(null)}>
      <div className="toolbar">
        <button className="btn" onClick={onBack}>Назад</button>
        <strong>{activeDocument?.title}</strong>
        <span className={`save-state ${saveStatus}`}>
          {saveStatus === 'saved' ? 'Сохранено' : saveStatus === 'saving' ? 'Сохранение...' : 'Ошибка сохранения'}
        </span>
        <button className="btn" onClick={() => dispatch(saveActiveDocument())}><Save size={16} /> Сохранить</button>
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
        <div className="f-id">{activeCell}</div>
        <input value={cells[activeCell]?.raw || ''} onChange={(event) => changeCell(activeCell, event.target.value)} />
      </div>

      <div className="sheet" style={{ height: SHEET_HEIGHT }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
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
                    className={`cell-unit ${activeCell === id ? 'active' : ''} ${isSelected(id, selectionStart, selectionEnd) ? 'selected' : ''}`}
                    style={{ width: colWidths[col] || DEFAULT_COL_WIDTH, height: rowHeights[row] || DEFAULT_ROW_HEIGHT }}
                    onClick={(event) => dispatch(selectCell({ id, shift: event.shiftKey }))}
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
                        onChange={(event) => changeCell(id, event.target.value)}
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
          <button onClick={() => dispatch(insertRow(menu.row))}>Добавить строку</button>
          <button onClick={() => dispatch(deleteRow(menu.row))}>Удалить строку</button>
          <button onClick={() => dispatch(insertCol(menu.col))}>Добавить столбец</button>
          <button onClick={() => dispatch(deleteCol(menu.col))}>Удалить столбец</button>
        </div>
      )}
    </main>
  );
}
