export interface CellData {
  raw: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'formula';
}

export type SpreadsheetData = Record<string, CellData>;
