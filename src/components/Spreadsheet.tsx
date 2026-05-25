import { useMemo, useState } from 'react';
import { getCellId, getColumnName, parseCellId, makeCell, recalculateCells } from '../cells';
import type { SpreadsheetData } from '../types';

const DEFAULT_ROWS = 100;
const DEFAULT_COLS = 26;
const ROW_HEIGHT = 30;
const COL_WIDTH = 100;
const TABLE_HEIGHT = 620;
const OVERSCAN = 8;

interface Menu {
  x: number;
  y: number;
  row: number;
  col: number;
}

function isInRange(id: string, from: string, to: string) {
  const current = parseCellId(id);
  const start = parseCellId(from);
  const end = parseCellId(to);
  if (!current || !start || !end) {
    return false;
  }

  return current.row >= Math.min(start.row, end.row)
    && current.row <= Math.max(start.row, end.row)
    && current.col >= Math.min(start.col, end.col)
    && current.col <= Math.max(start.col, end.col);
}

function shiftRows(cells: SpreadsheetData, startRow: number, delta: number) {
  const next: SpreadsheetData = {};

  Object.entries(cells).forEach(([id, cell]) => {
    const pos = parseCellId(id);
    if (!pos || (delta < 0 && pos.row === startRow)) {
      return;
    }

    const row = pos.row >= startRow ? pos.row + delta : pos.row;
    if (row >= 0) {
      next[getCellId(row, pos.col)] = cell;
    }
  });

  return recalculateCells(next);
}

function shiftCols(cells: SpreadsheetData, startCol: number, delta: number) {
  const next: SpreadsheetData = {};

  Object.entries(cells).forEach(([id, cell]) => {
    const pos = parseCellId(id);
    if (!pos || (delta < 0 && pos.col === startCol)) {
      return;
    }

    const col = pos.col >= startCol ? pos.col + delta : pos.col;
    if (col >= 0) {
      next[getCellId(pos.row, col)] = cell;
    }
  });

  return recalculateCells(next);
}

export default function Spreadsheet() {
  const [cells, setCells] = useState<SpreadsheetData>({});
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [active, setActive] = useState('A1');
  const [selectionStart, setSelectionStart] = useState('A1');
  const [selectionEnd, setSelectionEnd] = useState('A1');
  const [editing, setEditing] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

  const rowTop = useMemo(() => {
    const tops: number[] = [];
    let top = 0;
    for (let row = 0; row < rows; row += 1) {
      tops.push(top);
      top += rowHeights[row] || ROW_HEIGHT;
    }
    return tops;
  }, [rows, rowHeights]);

  const totalHeight = rows ? rowTop[rows - 1] + (rowHeights[rows - 1] || ROW_HEIGHT) : 0;
  const foundStart = rowTop.findIndex(top => top + ROW_HEIGHT >= scrollTop);
  const startRow = Math.max(0, (foundStart === -1 ? rows - 1 : foundStart) - OVERSCAN);
  const endRow = Math.min(rows - 1, startRow + Math.ceil(TABLE_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2);
  const visibleRows = Array.from({ length: endRow - startRow + 1 }, (_, index) => startRow + index);

  const selectCell = (id: string, shift: boolean) => {
    setActive(id);
    if (shift) {
      setSelectionEnd(id);
    } else {
      setSelectionStart(id);
      setSelectionEnd(id);
    }
  };

  const updateCell = (id: string, value: string) => {
    setCells(current => {
      const next = {
        ...current,
        [id]: makeCell(value, current),
      };
      return recalculateCells(next);
    });
  };

  const startResize = (kind: 'row' | 'col', index: number, start: number) => {
    const base = kind === 'col' ? colWidths[index] || COL_WIDTH : rowHeights[index] || ROW_HEIGHT;

    const move = (event: MouseEvent) => {
      const size = Math.max(24, base + (kind === 'col' ? event.clientX - start : event.clientY - start));
      if (kind === 'col') {
        setColWidths(widths => ({ ...widths, [index]: size }));
      } else {
        setRowHeights(heights => ({ ...heights, [index]: size }));
      }
    };

    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
  };

  const insertRow = (row: number) => {
    setCells(current => shiftRows(current, row, 1));
    setRows(count => count + 1);
  };

  const removeRow = (row: number) => {
    if (rows > 1) {
      setCells(current => shiftRows(current, row, -1));
      setRows(count => count - 1);
    }
  };

  const insertCol = (col: number) => {
    setCells(current => shiftCols(current, col, 1));
    setCols(count => count + 1);
  };

  const removeCol = (col: number) => {
    if (cols > 1) {
      setCells(current => shiftCols(current, col, -1));
      setCols(count => count - 1);
    }
  };

  return (
    <main className="app" onClick={() => setMenu(null)}>
      <div className="toolbar">
        <strong>Таблица</strong>
        <span>{rows} x {cols}</span>
      </div>

      <div className="formula">
        <div>{active}</div>
        <input value={cells[active]?.raw || ''} onChange={(event) => updateCell(active, event.target.value)} />
      </div>

      <div className="sheet" style={{ height: TABLE_HEIGHT }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <div className="header">
          <div className="corner" />
          {Array.from({ length: cols }, (_, col) => (
            <div
              className="col-head"
              key={col}
              style={{ width: colWidths[col] || COL_WIDTH }}
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

        <div className="rows" style={{ height: totalHeight }}>
          {visibleRows.map(row => (
            <div className="row" key={row} style={{ top: rowTop[row], height: rowHeights[row] || ROW_HEIGHT }}>
              <div
                className="row-head"
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
                const selected = isInRange(id, selectionStart, selectionEnd);
                return (
                  <div
                    className={`cell ${active === id ? 'active' : ''} ${selected ? 'selected' : ''}`}
                    key={id}
                    style={{ width: colWidths[col] || COL_WIDTH, height: rowHeights[row] || ROW_HEIGHT }}
                    onClick={(event) => selectCell(id, event.shiftKey)}
                    onDoubleClick={() => setEditing(id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setEditing(id);
                      }
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setMenu({ x: event.clientX, y: event.clientY, row, col });
                    }}
                    tabIndex={0}
                  >
                    {editing === id ? (
                      <input
                        autoFocus
                        value={cell?.raw || ''}
                        onChange={(event) => updateCell(id, event.target.value)}
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
        <div className="menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
          <button onClick={() => insertRow(menu.row)}>Добавить строку</button>
          <button onClick={() => removeRow(menu.row)}>Удалить строку</button>
          <button onClick={() => insertCol(menu.col)}>Добавить столбец</button>
          <button onClick={() => removeCol(menu.col)}>Удалить столбец</button>
        </div>
      )}
    </main>
  );
}
