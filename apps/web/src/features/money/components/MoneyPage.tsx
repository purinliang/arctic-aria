"use client";
// Money Page - Month, Category Totals And Transactions.
import { useState } from 'react';
import { ChevronLeft, ChevronRight, PenLine, Plus } from 'lucide-react';
import { Button } from '@/components/button';
import { Tabs } from '@/components/tabs';
import { ScrollArea } from '@/components/scroll-area';
import { PagedList } from '@/components/paged-list';
import { RecordCard } from '@/components/record-card';
import { LoadingLine } from '@/components/loading';
import { Text } from '@/components/text';
import { sectionStackClass } from '@/components/spacing';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { FormMessages } from '@/messages/app-messages';
import type { MoneyMessages } from '@/messages/money-messages';
import { localDateKey } from '@/features/settings/time-zones';
import { useMoney } from '../hooks/useMoney';
import { archiveExpense, saveExpense, saveMoneyCategory } from '../actions';
import { amountText, expenseTotals, formatMoney, shiftMonth } from '../money';
import type { ExpenseInput } from '../types';
import { ExpenseEditor } from './ExpenseEditor';
import { categoryName } from './ExpenseCategories';

export function MoneyPage({ userId,darkMode,timezone,language,messages,formMessages,...options }: Omit<FeatureActionOptions,'resultMessages'> & {
  userId: string; darkMode: boolean; timezone: string; language: string; messages: MoneyMessages; formMessages: FormMessages;
}) {
  const today = localDateKey(new Date(),timezone);
  const [month,setMonth] = useState(`${today.slice(0,7)}-01`), [filter,setFilter] = useState(''), [draft,setDraft] = useState<ExpenseInput | null>(null);
  const { data,loading,mutate } = useMoney({ userId,timezone,period: { mode: 'month',date: month } },{ ...options,resultMessages: messages.results });
  const categories = data?.categories ?? [];
  const expenses = (data?.expenses ?? []).filter((entry) => !filter || entry.categoryId === filter);
  const totals = expenseTotals(expenses).filter((total) => total.amount > BigInt(0));
  const formatDate = (value: string) => new Intl.DateTimeFormat(language,{ dateStyle: 'medium',timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
  const name = (id: string) => { const category = categories.find((item) => item.id === id); return category ? categoryName(category,messages) : ''; };
  const filterCategories = categories.filter((item) => !item.archived || item.id === filter || data?.expenses.some((entry) => entry.categoryId === item.id));
  function start() {
    const categoryId = categories.find((item) => item.seedKey === 'food' && !item.archived)?.id;
    if (categoryId) setDraft({ id: crypto.randomUUID(),isNew: true,categoryId,amount: '',currency: 'AUD',date: today,note: '' });
  }
  return <div className={sectionStackClass}>
    <div className="flex min-w-0 flex-col gap-[var(--aa-space-control-gap)] lg:flex-row lg:items-center">
      <div className="flex shrink-0 items-center gap-[var(--aa-space-control-gap)]">
        <Button darkMode={darkMode} tone="ghost" size="icon" title={messages.previousMonth} aria-label={messages.previousMonth}
          disabled={month === '1900-01-01'} icon={<ChevronLeft size={18} />} onClick={() => setMonth(shiftMonth(month,-1))} />
        <Text weight="semibold">{new Intl.DateTimeFormat(language,{ month: 'long',year: 'numeric',timeZone: 'UTC' }).format(new Date(`${month}T12:00:00Z`))}</Text>
        <Button darkMode={darkMode} tone="ghost" size="icon" title={messages.nextMonth} aria-label={messages.nextMonth}
          disabled={month >= `${today.slice(0,7)}-01`} icon={<ChevronRight size={18} />} onClick={() => setMonth(shiftMonth(month,1))} />
      </div>
      <ScrollArea className="min-w-0 flex-1" viewportClassName="overflow-x-auto" contentClassName="w-max" scrollbar="auto-hide">
        <Tabs darkMode={darkMode} ariaLabel={messages.category} value={filter} onChange={setFilter}
          options={[{ value: '',label: messages.all },...filterCategories.map((category) => ({ value: category.id,label: categoryName(category,messages) }))]} />
      </ScrollArea>
    </div>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--aa-space-inline-gap)]">
      <div className="flex min-w-0 flex-wrap gap-[var(--aa-space-inline-gap)]">
        {loading ? <LoadingLine darkMode={darkMode} text={messages.loading} /> :
          (totals.length ? totals : [{ currency: 'AUD' as const,amount: BigInt(0) }]).map((total) => <Text key={total.currency} size="page" weight="semibold"
            className="tabular-nums break-all">{formatMoney(total.amount,total.currency,language)}</Text>)}
      </div>
      <Button darkMode={darkMode} tone="primary" disabled={loading} icon={<Plus size={16} />} onClick={start}>{messages.newExpense}</Button>
    </div>
    <PagedList darkMode={darkMode} layout="rows" className="grid gap-[var(--aa-space-control-gap)]" items={expenses} loading={loading} loadingText={messages.loading} emptyText={messages.empty}
      messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} pageSize={6} resetKey={`${month}:${filter}`}
      renderItem={(entry) => <RecordCard darkMode={darkMode} key={entry.id} title={name(entry.categoryId)} description={entry.note ?? undefined}
        support={formatDate(entry.date)} value={formatMoney(entry.amountMinor,entry.currency,language)}
        action={<Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.edit}: ${name(entry.categoryId)}`} title={messages.edit}
          icon={<PenLine size={16} />} onClick={() => setDraft({ ...entry,amount: amountText(entry.amountMinor,entry.currency),note: entry.note ?? '',isNew: false })} />} />} />
    {draft ? <ExpenseEditor key={draft.id} input={draft} categories={categories} noteUsage={data?.noteUsage ?? []} today={today} darkMode={darkMode}
      messages={messages} formMessages={formMessages} onError={options.showErrorNotification} onClose={() => setDraft(null)}
      onCreateCategory={(input) => mutate(() => saveMoneyCategory(input))}
      onSave={(value) => mutate(() => saveExpense(value))} onDelete={(id) => mutate(() => archiveExpense(id))} /> : null}
  </div>;
}
