import type { CellData } from './types.js';

export function makeCell(value: string): CellData {
  return {
    raw: value,
    value: value.startsWith('=') ? 'CALC...' : value,
  };
}
