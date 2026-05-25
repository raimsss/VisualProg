export interface CellData {
  raw: string;
  value: string;
}

export type SpreadsheetData = Record<string, CellData>;

export interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  data: SpreadsheetData;
}
