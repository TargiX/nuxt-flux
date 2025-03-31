export interface Tag {
  id: string;
  text: string;
  size: number;
  selected: boolean;
  zone: string;
  alias: string;
  children?: Tag[];
  parentId?: string;
  x?: number;
  y?: number;
  isLoading?: boolean;
  depth?: number;
} 