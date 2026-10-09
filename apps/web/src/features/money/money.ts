import { currencies } from './types.ts';
import type { Currency, Expense, ExpenseInput, MoneyPeriod, MoneySettings } from './types.ts';
import { validId } from '../../server/feature-result.ts';
const precision: Record<Currency, number> = { AUD: 2, CNY: 2, USD: 2, JPY: 0, EUR: 2 };
export function parseAmount(amount: unknown, currency: unknown): number | null {
  if (!currencies.includes(currency as Currency) || typeof amount !== 'string') return null;
  if (amount.length > 32) return null;
  const digits = precision[currency as Currency];
  if (!(digits ? /^\d+(?:\.\d{1,2})?$/ : /^\d+$/).test(amount.trim())) return null;
  const [whole, fraction = ''] = amount.trim().split('.');
  const value = Number(BigInt(whole) * BigInt(10 ** digits) + BigInt(fraction.padEnd(digits, '0') || '0'));
  return Number.isSafeInteger(value) && value > 0 && value <= 999_999_999_999 ? value : null;
}
export function formatMoney(value: number | bigint, currency: Currency, language: string) {
  const scale = BigInt(10 ** precision[currency]);
  const minor = BigInt(value);
  return new Intl.NumberFormat(language, { style: 'currency', currency, currencyDisplay: 'code' }).formatToParts(minor / scale)
    .map((part) => part.type === 'fraction' ? String(minor % scale).padStart(precision[currency], '0') : part.value).join('');
}
export function amountText(value: number, currency: Currency) {
  const digits = precision[currency], scale = 10 ** digits;
  return `${Math.floor(value / scale)}${digits ? `.${String(value % scale).padStart(digits, '0')}` : ''}`;
}
export function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value >= '1900-01-01';
}
export function validPeriod(period: MoneyPeriod) { return !!period && ['day', 'month'].includes(period.mode) && validDate(period.date); }
export function validExpense(input: ExpenseInput, today: string) {
  return !!input && validId(input.id) && typeof input.isNew === 'boolean' && validId(input.categoryId)
    && parseAmount(input.amount, input.currency) !== null && validDate(input.date) && input.date <= today
    && typeof input.note === 'string' && Array.from(input.note.trim()).length <= 500;
}
export function validMoneySettings(value: MoneySettings) {
  return !!value && Array.isArray(value.preferredCurrencies) && value.preferredCurrencies.length > 0
    && value.preferredCurrencies.length <= 5 && new Set(value.preferredCurrencies).size === value.preferredCurrencies.length
    && value.preferredCurrencies.every((code) => currencies.includes(code)) && Array.isArray(value.quickCategoryIds)
    && value.quickCategoryIds.length <= 5 && new Set(value.quickCategoryIds).size === value.quickCategoryIds.length && value.quickCategoryIds.every(validId);
}
export function expenseTotals(expenses: Expense[]) {
  return currencies.map((currency) => ({ currency, amount: expenses.filter((entry) => entry.currency === currency).reduce((sum, entry) => sum + BigInt(entry.amountMinor), BigInt(0)) }));
}
export function monthBounds(date: string) {
  const start = `${date.slice(0,7)}-01`;
  const next = shiftMonth(start,1);
  return { start,end: new Date(Date.parse(`${next}T12:00:00Z`) - 86400000).toISOString().slice(0,10) };
}
export function shiftMonth(date: string, direction: number) {
  const instant = new Date(`${date.slice(0,7)}-01T12:00:00Z`);
  instant.setUTCMonth(instant.getUTCMonth() + direction);
  return instant.toISOString().slice(0,10);
}
