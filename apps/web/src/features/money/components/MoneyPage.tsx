"use client";
// Money Page.
import { useState } from 'react';
import { Coins, PenLine, Plus, Settings2, Tag } from 'lucide-react';
import { ActionCard } from '@/components/action-card';
import { Button } from '@/components/button';
import { ContentSection } from '@/components/content-section';
import { Tabs } from '@/components/tabs';
import { PagedList } from '@/components/paged-list';
import { RecordCard } from '@/components/record-card';
import { Text } from '@/components/text';
import { DatePickerField } from '@/components/forms/date-picker-field';
import { SelectInput } from '@/components/forms/selection-field';
import { sectionStackClass } from '@/components/spacing';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { FormMessages } from '@/messages/app-messages';
import type { MoneyMessages } from '@/messages/money-messages';
import { localDateKey } from '@/features/settings/time-zones';
import { useMoney } from '../hooks/useMoney';
import { archiveExpense, archiveMoneyCategory, saveExpense, saveMoneyCategory, saveMoneySettings } from '../actions';
import { amountText, expenseTotals, formatMoney } from '../money';
import type { ExpenseInput, MoneyPeriod } from '../types';
import { ExpenseEditor, categoryName } from './ExpenseEditor';
import { CurrencyEditor } from './CurrencyEditor';
import { CategoryManager } from './CategoryManager';

export function MoneyPage({ userId, darkMode, timezone, language, messages, formMessages, ...options }: Omit<FeatureActionOptions, 'resultMessages'> & {
  userId: string; darkMode: boolean; timezone: string; language: string; messages: MoneyMessages; formMessages: FormMessages;
}) {
  const today = localDateKey(new Date(), timezone);
  const [period, setPeriod] = useState<MoneyPeriod>({ mode: 'day', date: today });
  const [filter, setFilter] = useState(''), [draft, setDraft] = useState<ExpenseInput | null>(null);
  const [categoryLocked,setCategoryLocked] = useState(false);
  const [manager, setManager] = useState<'categories' | 'currencies' | null>(null);
  const { data, loading, mutate } = useMoney({ userId,timezone,period }, { ...options, resultMessages: messages.results });
  const categories = data?.categories ?? [], settings = data?.settings ?? { preferredCurrencies: ['AUD' as const, 'CNY' as const], quickCategoryIds: [] };
  const name = (id: string) => { const category = categories.find((category) => category.id === id); return category ? categoryName(category, messages) : ''; };
  const expenses = (data?.expenses ?? []).filter((entry) => !filter || entry.categoryId === filter);
  function start(categoryId: string, locked = true) {
    if (!categoryId) return;
    setCategoryLocked(locked);
    setDraft({ id: crypto.randomUUID(), isNew: true, categoryId, amount: '', currency: settings.preferredCurrencies[0], date: today, note: '' });
  }
  return <div className={sectionStackClass}>
    <ContentSection darkMode={darkMode} title={messages.capture} action={<div className="flex flex-wrap gap-[var(--aa-space-control-gap)]">
      <Button darkMode={darkMode} disabled={loading} icon={<Plus size={16} />} onClick={() => start(categories.find((category) => !category.archived)?.id ?? '',false)}>{messages.new}</Button>
      <Button darkMode={darkMode} tone="ghost" disabled={loading} icon={<Tag size={16} />} onClick={() => setManager('categories')}>{messages.categories}</Button>
      <Button darkMode={darkMode} tone="ghost" disabled={loading} icon={<Settings2 size={16} />} onClick={() => setManager('currencies')}>{messages.currencies}</Button>
    </div>}>
      <div className="grid grid-cols-2 gap-[var(--aa-space-control-gap)] sm:grid-cols-3 lg:grid-cols-5">
        {settings.quickCategoryIds.map((id) => <ActionCard key={id} aria-label={name(id)} label={name(id)} icon={<Coins size={22} />}
          supporting={null} disabled={loading} onClick={() => start(id)} />)}
      </div>
    </ContentSection>
    <ContentSection darkMode={darkMode} title={messages.history}>
      <div className="flex min-w-0 flex-wrap items-center gap-[var(--aa-space-control-gap)]">
        <Tabs darkMode={darkMode} ariaLabel={messages.history} value={period.mode} onChange={(mode) => setPeriod({ ...period, mode: mode as MoneyPeriod['mode'] })}
          options={[{ value: 'day', label: messages.day }, { value: 'month', label: messages.month }]} />
        <DatePickerField darkMode={darkMode} value={period.date} allowClear={false} messages={formMessages.datePicker} onChange={(date) => setPeriod({ ...period, date })} />
        <SelectInput darkMode={darkMode} aria-label={messages.category} value={filter} onChange={setFilter} placeholder={messages.all}
          options={[{ value: '', label: messages.all }, ...categories.map((category) => ({ value: category.id, label: categoryName(category, messages) }))]} />
      </div>
      {!loading ? <div className="flex flex-wrap gap-[var(--aa-space-inline-gap)]">
        {expenseTotals(expenses).filter((total) => total.amount > BigInt(0)).map((total) => <Text key={total.currency} weight="semibold">{formatMoney(total.amount, total.currency, language)}</Text>)}
      </div> : null}
      <PagedList darkMode={darkMode} layout="cards" items={expenses} loading={loading} loadingText={messages.loading} emptyText={messages.empty}
        messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} pageSize={6} resetKey={`${period.mode}:${period.date}:${filter}`}
        renderItem={(entry) => <RecordCard darkMode={darkMode} key={entry.id}
          title={`${name(entry.categoryId)} · ${formatMoney(entry.amountMinor, entry.currency, language)}`}
          description={entry.note ?? undefined} support={entry.date}
          action={<Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.edit}: ${name(entry.categoryId)}`} title={messages.edit}
            icon={<PenLine size={16} />} onClick={() => { setCategoryLocked(false); setDraft({ ...entry, amount: amountText(entry.amountMinor, entry.currency), note: entry.note ?? '', isNew: false }); }} />} />} />
    </ContentSection>
    {draft ? <ExpenseEditor key={draft.id} input={draft} categories={categories} settings={settings} today={today}
      categoryLocked={categoryLocked} darkMode={darkMode} messages={messages} formMessages={formMessages} onError={options.showErrorNotification} onClose={() => setDraft(null)}
      onSave={(input) => mutate(() => saveExpense(input))} onDelete={(id) => mutate(() => archiveExpense(id))} /> : null}
    {manager === 'currencies' ? <CurrencyEditor settings={settings} darkMode={darkMode} messages={messages} onClose={() => setManager(null)}
      onSave={(value) => mutate(() => saveMoneySettings(value))} /> : null}
    {manager === 'categories' ? <CategoryManager categories={categories} settings={settings} darkMode={darkMode} messages={messages}
      onClose={() => setManager(null)} onCategory={(input) => mutate(() => saveMoneyCategory(input))}
      onArchive={(id) => mutate(() => archiveMoneyCategory(id))} onSettings={(value) => mutate(() => saveMoneySettings(value))} /> : null}
  </div>;
}
