export type SupplyKind = 'food' | 'household';
export type StockQuantity = { quantity: number; unit: string; increment: number; targetQuantity: number; lowStockThreshold: number };
export type Observation = { id: string; cycleId: string; level: number; recordedAt: string };
export type SupplyItem = {
  id: string; kind: SupplyKind; title: string; note: string | null; level: number;
  spares: number; version: number; cycleId: string; observations: Observation[];
} & Partial<StockQuantity>;
export type SupplyInput = {
  id: string; isNew: boolean; kind: SupplyKind; title: string; note: string;
  level: number; spares: number; version: number;
} & Partial<StockQuantity>;
export type QuantityCommand = { id: string; version: number; key: string; direction: -1 | 1 };
export type StockCommand = { id: string; version: number; key: string; operation: 'observe' | 'replace'; level: number; useSpare: boolean };
export type WishItem = {
  id: string; title: string; country: string | null; shop: string | null; url: string | null;
  note: string | null; linkedSupplyId: string | null; linkedTitle?: string | null; linkedArchived?: boolean;
  status: 'planned' | 'purchased'; version: number;
};
export type WishInput = Omit<WishItem, 'linkedTitle' | 'linkedArchived'> & { isNew: boolean };
export type SuppliesData = { items: SupplyItem[]; wishlist: WishItem[] };
