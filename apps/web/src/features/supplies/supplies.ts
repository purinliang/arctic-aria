import { validId } from '../../server/feature-result.ts';
import type { SupplyInput, SupplyItem, StockCommand, WishInput } from './types.ts';
const text = (value: unknown, limit: number, required = false): boolean =>
  value == null ? !required : typeof value === 'string' && (!required || !!value.trim()) && Array.from(value.trim()).length <= limit;
const integer = (value: unknown, minimum: number, maximum: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum;
export function validSupply(input: SupplyInput) {
  return !!input && validId(input.id) && typeof input.isNew === 'boolean' && ['food','household'].includes(input.kind)
    && text(input.title,100,true) && typeof input.note === 'string' && text(input.note,500) && integer(input.level,0,5)
    && integer(input.spares,0,999) && integer(input.version,1,2_147_483_646);
}
export function validStock(input: StockCommand) {
  return !!input && validId(input.id) && validId(input.key) && integer(input.version,1,2_147_483_646)
    && ['observe','replace'].includes(input.operation) && integer(input.level,0,5) && typeof input.useSpare === 'boolean';
}
export function validWish(input: WishInput) {
  if (!input || !validId(input.id) || typeof input.isNew !== 'boolean' || !text(input.title,100,true)
    || !text(input.country,100) || !text(input.shop,200) || !text(input.note,500)
    || !['planned','purchased'].includes(input.status) || !integer(input.version,1,2_147_483_646)
    || (input.linkedSupplyId !== null && !validId(input.linkedSupplyId)) || !text(input.url,1000)) return false;
  if (input.url?.trim()) { try { return ['https:','http:'].includes(new URL(input.url.trim()).protocol); } catch { return false; } }
  return true;
}
export type Depletion = { state: 'empty' } | { state: 'unknown' } | { state: 'estimated'; at: Date };
export function depletion(item: SupplyItem): Depletion {
  if (item.level === 0) return { state: 'empty' };
  const points = item.observations.filter((point) => point.cycleId === item.cycleId)
    .sort((a,b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0,3).reverse();
  if (points.length < 2 || points.at(-1)?.level !== item.level) return { state: 'unknown' };
  if (points.some((point,index) => index > 0 && point.level > points[index - 1].level)) return { state: 'unknown' };
  const first = points[0], last = points[points.length - 1];
  const elapsed = Date.parse(last.recordedAt) - Date.parse(first.recordedAt), used = first.level - last.level;
  if (elapsed <= 0 || used <= 0) return { state: 'unknown' };
  const at = new Date(Date.parse(last.recordedAt) + item.level / used * elapsed);
  return Number.isFinite(at.getTime()) ? { state: 'estimated', at } : { state: 'unknown' };
}
export function needsAttention(item: SupplyItem, now = new Date()) {
  const estimate = depletion(item);
  return item.level <= 1 || (estimate.state === 'estimated' && estimate.at.getTime() <= now.getTime() + 7 * 86400_000);
}
