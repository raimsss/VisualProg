import type { CellData, SpreadsheetData } from './types.js';

export const DEFAULT_ROWS = 100;
export const DEFAULT_COLS = 26;
export const MAX_RENDER_ROWS = 1000;

export function getColumnName(index: number): string {
  let name = '';
  let current = index + 1;

  while (current > 0) {
    const rest = (current - 1) % 26;
    name = String.fromCharCode(65 + rest) + name;
    current = Math.floor((current - rest) / 26);
  }

  return name;
}

export function getCellId(row: number, col: number): string {
  return `${getColumnName(col)}${row + 1}`;
}

export function parseCellId(id: string): { row: number; col: number } | null {
  const match = id.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return null;
  }

  const letters = match[1];
  let col = 0;
  for (const letter of letters) {
    col = col * 26 + letter.charCodeAt(0) - 64;
  }

  return {
    row: Number(match[2]) - 1,
    col: col - 1,
  };
}

export function getRangeIds(from: string, to: string): string[] {
  const start = parseCellId(from);
  const end = parseCellId(to);
  if (!start || !end) {
    return [];
  }

  const rowStart = Math.min(start.row, end.row);
  const rowEnd = Math.max(start.row, end.row);
  const colStart = Math.min(start.col, end.col);
  const colEnd = Math.max(start.col, end.col);
  const ids: string[] = [];

  for (let row = rowStart; row <= rowEnd; row += 1) {
    for (let col = colStart; col <= colEnd; col += 1) {
      ids.push(getCellId(row, col));
    }
  }

  return ids;
}

function getValueType(raw: string): CellData['type'] {
  const value = raw.trim();
  if (value.startsWith('=')) {
    return 'formula';
  }
  if (value === 'true' || value === 'false') {
    return 'boolean';
  }
  if (value !== '' && !Number.isNaN(Number(value))) {
    return 'number';
  }
  return 'string';
}

function numberFromCell(cells: SpreadsheetData, id: string): number {
  const raw = cells[id]?.raw ?? '';
  const value = raw.startsWith('=') ? cells[id]?.value : raw;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function aggregateFormula(name: 'SUM' | 'AVERAGE', range: string, cells: SpreadsheetData): string {
  const [from, to] = range.split(':');
  const values = getRangeIds(from, to).map(id => numberFromCell(cells, id));
  if (name === 'SUM') {
    return String(values.reduce((sum, value) => sum + value, 0));
  }
  return values.length ? String(values.reduce((sum, value) => sum + value, 0) / values.length) : '0';
}

export function calculateFormula(raw: string, cells: SpreadsheetData): string {
  const formula = raw.trim().slice(1).toUpperCase();
  const aggregate = formula.match(/^(SUM|AVERAGE)\(([A-Z]+\d+:[A-Z]+\d+)\)$/);

  if (aggregate) {
    return aggregateFormula(aggregate[1] as 'SUM' | 'AVERAGE', aggregate[2], cells);
  }

  const expression = formula.replace(/[A-Z]+\d+/g, id => String(numberFromCell(cells, id)));
  if (!/^[\d+\-*/().\s]+$/.test(expression)) {
    return '#ERROR';
  }

  try {
    const result = Function(`"use strict"; return (${expression})`)() as unknown;
    return typeof result === 'number' && Number.isFinite(result) ? String(result) : '#ERROR';
  } catch {
    return '#ERROR';
  }
}

export function makeCell(value: string, cells: SpreadsheetData = {}): CellData {
  const type = getValueType(value);
  return {
    raw: value,
    value: type === 'formula' ? calculateFormula(value, cells) : value,
    type,
  };
}

export function recalculateCells(cells: SpreadsheetData): SpreadsheetData {
  let next = { ...cells };

  Object.entries(cells).forEach(([id, cell]) => {
    next = {
      ...next,
      [id]: makeCell(cell.raw, next),
    };
  });

  return next;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some(cell => cell !== '')) {
    rows.push(row);
  }

  return rows;
}

export function toCsv(rows: string[][]): string {
  return rows.map(row => row.map(value => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replaceAll('"', '""')}"`;
    }
    return value;
  }).join(',')).join('\n');
}
