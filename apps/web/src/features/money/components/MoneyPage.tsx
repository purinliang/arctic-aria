"use client";
// Money Page - Monthly Summary, Capture, And Transactions.
import { useState } from 'react';
import { ChevronLeft, ChevronRight, PenLine, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/button';
import { ContentSection } from '@/components/content-section';
import { Tabs } from '@/components/tabs';
import { PagedList } from '@/components/paged-list';
import { RecordCard } from '@/components/record-card';
import { LoadingLine } from '@/components/loading';
import { Text } from '@/components/text';
import { DatePickerField } from '@/components/forms/date-picker-field';
import { SelectInput } from '@/components/forms/selection-field';
import { sectionStackClass } from '@/components/spacing';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { FormMessages } from '@/messages/app-messages';
import type { MoneyMessages } from '@/messages/money-messages';
import { localDateKey } from '@/features/settings/time-zones';
import { useMoney } from '../hooks/useMoney';
import { archiveExpense, archiveMoneyCategory, saveExpense, saveMoneyCategory, saveMoneySettings, reorderMoneyCategories } from '../actions';
import { amountText, expenseTotals, formatMoney, monthBounds, shiftMonth } from '../money';
import type { ExpenseInput } from '../types';
import { ExpenseEditor, categoryName } from './ExpenseEditor';
import { CurrencyEditor } from './CurrencyEditor';
import { CategoryManager } from './CategoryManager';

export function MoneyPage({ userId,darkMode,timezone,language,messages,formMessages,...options }: Omit<FeatureActionOptions,'resultMessages'> & {
  userId: string; darkMode: boolean; timezone: string; language: string; messages: MoneyMessages; formMessages: FormMessages;
}) {
  const today = localDateKey(new Date(),timezone);
  const [date,setDate] = useState(today), [mode,setMode] = useState('month');
  const [filter,setFilter] = useState(''), [draft,setDraft] = useState<ExpenseInput | null>(null);
  const [manager,setManager] = useState<'categories' | 'currencies' | null>(null);
  // Fetch one monthly snapshot: summary and day history cannot disagree or duplicate reads.
  const { data,loading,mutate } = useMoney({ userId,timezone,period: { mode: 'month',date: `${date.slice(0,7)}-01` } },{ ...options,resultMessages: messages.results });
  const categories = data?.categories ?? [], settings = data?.settings ?? { preferredCurrencies: ['AUD' as const,'CNY' as const],quickCategoryIds: [] };
  const name = (id: string) => { const category = categories.find((item) => item.id === id); return category ? categoryName(category,messages) : ''; };
  const expenses = (data?.expenses ?? []).filter((entry) => (!filter || entry.categoryId === filter) && (mode === 'month' || entry.date === date));
  const bounds = monthBounds(date);
  const formatDate = (value: string) => new Intl.DateTimeFormat(language,{ dateStyle: 'medium',timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
  const totals = expenseTotals(data?.expenses ?? []).filter((total) => total.amount > BigInt(0));
  function start() {
    const categoryId = categories.find((item) => item.seedKey === 'food' && !item.archived)?.id;
    if (categoryId) setDraft({ id: crypto.randomUUID(),isNew: true,categoryId,amount: '',currency: settings.preferredCurrencies[0],date: today,note: '' });
  }
  return <div className={sectionStackClass}>
    <ContentSection darkMode={darkMode} title={new Intl.DateTimeFormat(language,{ month: 'long',year: 'numeric',timeZone: 'UTC' }).format(new Date(`${bounds.start}T12:00:00Z`))}
      action={<div className="flex gap-[var(--aa-space-control-gap)]">
        <Button darkMode={darkMode} tone="ghost" size="icon" title={messages.previousMonth} aria-label={messages.previousMonth}
          disabled={bounds.start === '1900-01-01'} icon={<ChevronLeft size={18} />} onClick={() => setDate(shiftMonth(date,-1))} />
        <Button darkMode={darkMode} tone="ghost" size="icon" title={messages.nextMonth} aria-label={messages.nextMonth}
          disabled={bounds.start >= today.slice(0,7) + '-01'} icon={<ChevronRight size={18} />} onClick={() => setDate(shiftMonth(date,1))} />
      </div>}>
      {loading ? <LoadingLine darkMode={darkMode} text={messages.loading} /> : <div className="flex flex-wrap gap-[var(--aa-space-inline-gap)]">
        {(totals.length ? totals : [{ currency: settings.preferredCurrencies[0],amount: BigInt(0) }]).map((total) =>
          <Text key={total.currency} size="page" weight="semibold" className="tabular-nums break-all">{formatMoney(total.amount,total.currency,language)}</Text>)}
      </div>}
      <Text size="sm" tone="secondary">{formatDate(bounds.start)} – {formatDate(bounds.end)}</Text>
    </ContentSection>
    <div className="flex flex-wrap items-center gap-[var(--aa-space-control-gap)]">
      <Button darkMode={darkMode} tone="primary" disabled={loading} icon={<Plus size={16} />} onClick={start}>{messages.newExpense}</Button>
      <Button darkMode={darkMode} tone="secondary" disabled={loading} icon={<Tag size={16} />} onClick={() => setManager('categories')}>{messages.categories}</Button>
    </div>
    <ContentSection darkMode={darkMode} title={messages.history}>
      <div className="flex min-w-0 flex-wrap items-center gap-[var(--aa-space-control-gap)]">
        <Tabs darkMode={darkMode} ariaLabel={messages.history} value={mode} onChange={setMode}
          options={[{ value: 'day',label: messages.day },{ value: 'month',label: messages.month }]} />
        <DatePickerField darkMode={darkMode} value={date} allowClear={false} messages={formMessages.datePicker} onChange={setDate} />
        <div className="w-full sm:w-56"><SelectInput darkMode={darkMode} aria-label={messages.category} value={filter} onChange={setFilter} placeholder={messages.all}
          options={[{ value: '',label: messages.all },...categories.map((category) => ({ value: category.id,label: categoryName(category,messages) }))]} /></div>
      </div>
      <PagedList darkMode={darkMode} layout="rows" className="grid gap-[var(--aa-space-control-gap)]" items={expenses} loading={loading} loadingText={messages.loading} emptyText={messages.empty}
        messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} pageSize={6} resetKey={`${mode}:${date}:${filter}`}
        renderItem={(entry) => <RecordCard darkMode={darkMode} key={entry.id} title={name(entry.categoryId)} description={entry.note ?? undefined}
          support={formatDate(entry.date)} value={formatMoney(entry.amountMinor,entry.currency,language)}
          action={<Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.edit}: ${name(entry.categoryId)}`} title={messages.edit}
            icon={<PenLine size={16} />} onClick={() => setDraft({ ...entry,amount: amountText(entry.amountMinor,entry.currency),note: entry.note ?? '',isNew: false })} />} />} />
    </ContentSection>
    {draft ? <ExpenseEditor key={draft.id} input={draft} categories={categories} settings={settings} today={today} darkMode={darkMode}
      messages={messages} formMessages={formMessages} onError={options.showErrorNotification} onClose={() => setDraft(null)}
      onManageCategories={() => setManager('categories')} onManageCurrencies={() => setManager('currencies')}
      onSave={(value) => mutate(() => saveExpense(value))} onDelete={(id) => mutate(() => archiveExpense(id))} /> : null}
    {manager === 'currencies' ? <CurrencyEditor settings={settings} darkMode={darkMode} messages={messages} onClose={() => setManager(null)}
      onSave={(value) => mutate(() => saveMoneySettings(value))} /> : null}
    {manager === 'categories' ? <CategoryManager categories={categories} darkMode={darkMode} messages={messages}
      onClose={() => setManager(null)} onCategory={(value) => mutate(() => saveMoneyCategory(value))}
      onArchive={(id) => mutate(() => archiveMoneyCategory(id))} onOrder={(ids) => mutate(() => reorderMoneyCategories(ids))} /> : null}
  </div>;
}
