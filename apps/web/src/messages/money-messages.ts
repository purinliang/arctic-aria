import { englishPaginationMessages, simplifiedChinesePaginationMessages } from './pagination-messages';
export const englishMoneyMessages = {
  capture: 'Record expense', history: 'Expenses', categories: 'Categories', currencies: 'Currencies',
  defaults: { food: 'Food', transport: 'Transport', housing: 'Housing', bills: 'Bills', shopping: 'Shopping', health: 'Health', other: 'Other' },
  day: 'Day', month: 'Month', date: 'Date', category: 'Category', all: 'All categories',
  amount: 'Amount', currency: 'Currency', note: 'Note', title: 'Expense', name: 'Name',
  moreCurrencies: 'More currencies', preferred: 'Preferred currencies', defaultCurrency: 'Default',
  up: 'Move up', down: 'Move down', drag: 'Drag to reorder', new: 'New', edit: 'Edit',
  save: 'Save', saving: 'Saving', close: 'Close', archive: 'Archive', archived: 'Archived',
  pin: 'Quick capture', unpin: 'Remove from quick capture', empty: 'No expenses.', loading: 'Loading expenses',
  delete: 'Delete', deleting: 'Deleting', cancel: 'Cancel', deleteTitle: 'Remove this record?',
  deleteDescription: 'Expenses are removed from totals. Archived categories remain on historical records.',
  pagination: { ...englishPaginationMessages, ariaLabel: 'Expense records' },
  results: { invalid: 'Check the amount, currency, category, and date. Future expenses are not supported.', missing: 'This record is no longer available.', unavailable: 'Money is unavailable. Please try again.', auth_required: 'Please sign in again.' },
};
export type MoneyMessages = typeof englishMoneyMessages;
export const chineseMoneyMessages: MoneyMessages = {
  capture: '记录支出', history: '支出', categories: '分类', currencies: '货币',
  defaults: { food: '饮食', transport: '交通', housing: '住房', bills: '账单', shopping: '购物', health: '健康', other: '其他' },
  day: '日', month: '月', date: '日期', category: '分类', all: '所有分类',
  amount: '金额', currency: '货币', note: '备注', title: '支出记录', name: '名称',
  moreCurrencies: '其他货币', preferred: '常用货币', defaultCurrency: '默认',
  up: '上移', down: '下移', drag: '拖动排序', new: '新建', edit: '编辑',
  save: '保存', saving: '正在保存', close: '关闭', archive: '归档', archived: '已归档',
  pin: '快速记录', unpin: '移出快速记录', empty: '暂无支出。', loading: '正在加载支出',
  delete: '删除', deleting: '正在删除', cancel: '取消', deleteTitle: '移除这条记录？',
  deleteDescription: '移除的支出不再计入总额。历史记录仍会保留已归档的分类。',
  pagination: { ...simplifiedChinesePaginationMessages, ariaLabel: '支出记录' },
  results: { invalid: '请检查金额、货币、分类和日期。不支持记录未来支出。', missing: '这条记录已不可用。', unavailable: '财务暂时不可用，请重试。', auth_required: '请重新登录。' },
};
