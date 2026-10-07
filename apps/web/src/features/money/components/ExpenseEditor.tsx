// Money Page - Expense Editor.
import { useState } from 'react';
import { CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { TextArea } from '@/components/forms/text-area-field';
import { SelectInput } from '@/components/forms/selection-field';
import { DatePickerField } from '@/components/forms/date-picker-field';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { Button } from '@/components/button';
import type { FormMessages } from '@/messages/app-messages';
import type { MoneyMessages } from '@/messages/money-messages';
import type { Currency, ExpenseInput, MoneyCategory, MoneySettings } from '../types';
import { currencies } from '../types';
import { validExpense } from '../money';

export function categoryName(category: MoneyCategory, messages: MoneyMessages) { return category.name ?? (category.seedKey ? messages.defaults[category.seedKey] : ''); }
export function ExpenseEditor({ input, categories, settings, messages, formMessages, darkMode, today, onSave, onDelete, onClose, onError }: {
  input: ExpenseInput; categories: MoneyCategory[]; settings: MoneySettings; messages: MoneyMessages;
  formMessages: FormMessages; darkMode: boolean; today: string; onSave: (input: ExpenseInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>; onClose: () => void; onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState(input), [pending, setPending] = useState(false), [confirm, setConfirm] = useState(false);
  const [more, setMore] = useState(!settings.preferredCurrencies.includes(input.currency));
  function update(patch: Partial<ExpenseInput>) { setDraft({ ...draft, ...patch }); }
  async function submit() {
    if (pending) return;
    if (!validExpense(draft, today)) { onError(messages.results.invalid); return; }
    setPending(true);
    try { if (await onSave(draft)) onClose(); } finally { setPending(false); }
  }
  return <>
    <CrudEditorDialog darkMode={darkMode} title={messages.title} pending={pending} saving={pending && !confirm}
      saveText={messages.save} savingText={messages.saving} deleteText={messages.delete} closeLabel={messages.close}
      onClose={() => { if (!pending) onClose(); }} onSubmit={() => void submit()} onDelete={input.isNew ? undefined : () => setConfirm(true)}>
      <FieldLabel darkMode={darkMode} label={messages.category}><SelectInput darkMode={darkMode} aria-label={messages.category}
        value={draft.categoryId} disabled={pending} onChange={(categoryId) => update({ categoryId })} placeholder={messages.category}
        options={categories.filter((category) => !category.archived || category.id === input.categoryId).map((category) => ({ value: category.id, label: categoryName(category, messages) }))} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.amount}><TextInput darkMode={darkMode} aria-label={messages.amount}
        inputMode="decimal" value={draft.amount} disabled={pending} autoFocus onChange={(event) => update({ amount: event.target.value })} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.currency}>
        <SingleChoiceGroup darkMode={darkMode} disabled={pending} value={draft.currency} onChange={(value) => update({ currency: value as Currency })}
          options={(more ? [...settings.preferredCurrencies, ...currencies.filter((code) => !settings.preferredCurrencies.includes(code))] : settings.preferredCurrencies).map((value) => ({ value, label: value }))}>
          {!more ? <Button darkMode={darkMode} tone="ghost" disabled={pending} onClick={() => setMore(true)}>{messages.moreCurrencies}</Button> : null}
        </SingleChoiceGroup>
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.date}><DatePickerField darkMode={darkMode} value={draft.date} disabled={pending}
        allowClear={false} messages={formMessages.datePicker} onChange={(date) => update({ date })} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.note}><TextArea darkMode={darkMode} aria-label={messages.note} value={draft.note}
        maxLength={500} disabled={pending} onChange={(event) => update({ note: event.target.value })} /></FieldLabel>
    </CrudEditorDialog>
    {confirm ? <ConfirmDialog darkMode={darkMode} pending={pending} title={messages.deleteTitle} description={messages.deleteDescription}
      confirmText={messages.delete} pendingConfirmText={messages.deleting} cancelText={messages.cancel} closeLabel={messages.close}
      onCancel={() => { if (!pending) setConfirm(false); }} onConfirm={() => {
        setPending(true); void onDelete(input.id).then((saved) => { if (saved) onClose(); }).finally(() => setPending(false));
      }} /> : null}
  </>;
}
