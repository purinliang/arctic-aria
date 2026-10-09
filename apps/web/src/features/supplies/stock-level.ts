import { stockQuantity } from './supplies.ts';
import type { SupplyInput, SupplyItem } from './types.ts';

export function isLevelStock(item: SupplyItem | SupplyInput) {
  const stock = stockQuantity(item);
  return stock.unit === 'unit' && stock.increment === 1 && stock.targetQuantity === 5
    && stock.lowStockThreshold === 1 && Number.isInteger(stock.quantity) && stock.quantity >= 0 && stock.quantity <= 5;
}
export function stockSeverity(item: SupplyItem) {
  const stock = stockQuantity(item);
  if (isLevelStock(item)) return stock.quantity <= 1 ? 0 : stock.quantity === 2 ? 1 : 2;
  // Physical quantities retain their configured threshold; never turn them into levels.
  return stock.quantity === 0 ? 0 : stock.quantity <= stock.lowStockThreshold ? 1 : 2;
}
export function compareStock(a: SupplyItem,b: SupplyItem) {
  return stockSeverity(a) - stockSeverity(b) || Number(a.kind === 'household') - Number(b.kind === 'household')
    || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
}
export function levelInput(item: SupplyItem,level: number): SupplyInput | null {
  if (!isLevelStock(item) || !Number.isInteger(level) || level < 0 || level > 5) return null;
  return { ...item,...stockQuantity(item),quantity: level,note: item.note ?? '',isNew: false };
}
