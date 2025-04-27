export interface Dream {
  id: number;
  createdAt: string; // ISO date string
  title: string | null;
  data: any; // We'll keep data generic for now
} 