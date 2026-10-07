import assert from 'node:assert/strict';
import test from 'node:test';
import { amountText, expenseTotals, formatMoney, parseAmount, validExpense, validMoneySettings, validPeriod } from '../money.ts';
import type { Expense } from '../types.ts';
const id = '11111111-1111-4111-8111-111111111111';
test('amounts use exact minor units with supported currency precision', () => {
  assert.equal(parseAmount('0.10', 'AUD'), 10);
  assert.equal(parseAmount('12.3', 'CNY'), 1230);
  assert.equal(parseAmount('900', 'JPY'), 900);
  assert.equal(parseAmount('9999999999.99', 'USD'), 999999999999);
  for (const amount of ['0','-1','1e2','0.001','1,000','NaN','Infinity','9'.repeat(50)]) assert.equal(parseAmount(amount, 'AUD'), null);
  assert.equal(parseAmount('1.00', 'JPY'), null);
  assert.equal(parseAmount('1', 'GBP'), null);
  assert.equal(parseAmount(null, 'AUD'), null);
  assert.equal(amountText(1230, 'AUD'), '12.30');
  assert.equal(amountText(1230, 'JPY'), '1230');
  assert.ok(formatMoney(10, 'AUD', 'en').includes('0.10'));
  assert.ok(formatMoney(999999999999999999n, 'AUD', 'en').endsWith('.99'));
});
test('settings preserve explicit order, reject unsupported and duplicate preferences', () => {
  const settings = { preferredCurrencies: ['CNY','AUD'] as const, quickCategoryIds: [id] };
  assert.equal(validMoneySettings({ ...settings, preferredCurrencies: [...settings.preferredCurrencies] }), true);
  for (const preferredCurrencies of [[], ['AUD','AUD'], ['GBP']]) assert.equal(validMoneySettings({ preferredCurrencies: preferredCurrencies as never, quickCategoryIds: [] }), false);
  assert.equal(validMoneySettings({ preferredCurrencies: ['AUD'], quickCategoryIds: [id,id] }), false);
  assert.equal(validMoneySettings({ preferredCurrencies: ['AUD'], quickCategoryIds: ['bad'] }), false);
});
test('dates, periods, and expenses are validated without allowing future spending', () => {
  assert.equal(validPeriod({ mode: 'month', date: '2026-02-28' }), true);
  assert.equal(validPeriod({ mode: 'day', date: '2026-02-30' }), false);
  const input = { id, isNew: true, categoryId: id, amount: '12.34', currency: 'AUD' as const, date: '2026-10-07', note: '' };
  assert.equal(validExpense(input, '2026-10-07'), true);
  assert.equal(validExpense(input, '2026-10-06'), false);
  assert.equal(validExpense({ ...input, note: 'a'.repeat(501) }, '2026-10-07'), false);
});
test('totals never mix currencies and include the complete filtered list', () => {
  const expenses = Array.from({ length: 8 }, (_, index) => ({ id: String(index), categoryId: id, amountMinor: 10, currency: index === 7 ? 'CNY' : 'AUD', date: '2026-10-07', note: null })) as Expense[];
  const totals = expenseTotals(expenses);
  assert.equal(totals.find((item) => item.currency === 'AUD')?.amount, 70n);
  assert.equal(totals.find((item) => item.currency === 'CNY')?.amount, 10n);
});
