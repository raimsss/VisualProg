export interface CellData {
  raw: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'formula';
}

export type SpreadsheetData = Record<string, CellData>;

export interface Document {
  id: string;
  ownerId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  rows: number;
  cols: number;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  data: SpreadsheetData;
}

export interface DocumentDraft {
  title: string;
  rows: number;
  cols: number;
}
