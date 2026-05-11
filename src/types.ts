export interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, any>;
}