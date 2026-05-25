import type { CellData, SpreadsheetData } from './types.js';

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

  let col = 0;
  for (const letter of match[1]) {
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

  const ids: string[] = [];
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row += 1) {
    for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col += 1) {
      ids.push(getCellId(row, col));
    }
  }
  return ids;
}

function getType(raw: string): CellData['type'] {
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

function cellNumber(cells: SpreadsheetData, id: string): number {
  const cell = cells[id];
  const number = Number(cell?.value ?? cell?.raw ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function calculateFormula(raw: string, cells: SpreadsheetData): string {
  const formula = raw.trim().slice(1).toUpperCase();
  const group = formula.match(/^(SUM|AVERAGE)\(([A-Z]+\d+:[A-Z]+\d+)\)$/);

  if (group) {
    const values = getRangeIds(...group[2].split(':') as [string, string]).map(id => cellNumber(cells, id));
    const sum = values.reduce((total, value) => total + value, 0);
    return group[1] === 'AVERAGE' ? String(values.length ? sum / values.length : 0) : String(sum);
  }

  const expression = formula.replace(/[A-Z]+\d+/g, id => String(cellNumber(cells, id)));
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

export function makeCell(raw: string, cells: SpreadsheetData = {}): CellData {
  const type = getType(raw);
  return {
    raw,
    type,
    value: type === 'formula' ? calculateFormula(raw, cells) : raw,
  };
}

export function recalculateCells(cells: SpreadsheetData): SpreadsheetData {
  const next = { ...cells };
  Object.entries(next).forEach(([id, cell]) => {
    next[id] = makeCell(cell.raw, next);
  });
  return next;
}
