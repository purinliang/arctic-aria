// Money Page - Compact Expense Entry.
import { useState } from 'react';
import { CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { TextArea } from '@/components/forms/text-area-field';
import { DatePickerField } from '@/components/forms/date-picker-field';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { Button } from '@/components/button';
import type { FormMessages } from '@/messages/app-messages';
import type { MoneyMessages } from '@/messages/money-messages';
import type { Currency, ExpenseInput, MoneyCategory, NoteUsage } from '../types';
import { currencies } from '../types';
import { validExpense } from '../money';
import { noteKey, noteSuggestions } from '../note-suggestions';
import { ExpenseCategories } from './ExpenseCategories';

export function ExpenseEditor({ input,categories,noteUsage,messages,formMessages,darkMode,today,onSave,onDelete,onClose,onError,onCreateCategory }: {
  input: ExpenseInput; categories: MoneyCategory[]; noteUsage: NoteUsage[]; messages: MoneyMessages;
  formMessages: FormMessages; darkMode: boolean; today: string; onSave: (input: ExpenseInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>; onClose: () => void; onError: (message: string) => void;
  onCreateCategory: (input: { id: string; name: string; isNew: boolean }) => Promise<boolean>;
}) {
  const [draft,setDraft] = useState(input), [pending,setPending] = useState(false), [confirm,setConfirm] = useState(false), [creating,setCreating] = useState(false);
  const [moreNotes,setMoreNotes] = useState<string | null>(null);
  const category = categories.find((category) => category.id === draft.categoryId);
  const suggestions = noteSuggestions(draft.categoryId,category?.seedKey ? messages.notePresets[category.seedKey] : [],noteUsage);
  const disabled = pending || creating;
  function update(patch: Partial<ExpenseInput>) { setDraft((current) => ({ ...current,...patch })); }
  async function submit() {
    if (disabled) return;
    if (!validExpense(draft,today)) { onError(messages.results.invalid); return; }
    setPending(true);
    try { if (await onSave(draft)) onClose(); } finally { setPending(false); }
  }
  return <>
    <CrudEditorDialog darkMode={darkMode} title={messages.title} pending={disabled} saving={pending && !confirm}
      saveText={messages.save} savingText={messages.saving} deleteText={messages.delete} closeLabel={messages.close}
      onClose={() => { if (!disabled) onClose(); }} onSubmit={() => void submit()} onDelete={input.isNew ? undefined : () => setConfirm(true)}>
      <ExpenseCategories value={draft.categoryId} originalCategoryId={input.categoryId} categories={categories} messages={messages}
        darkMode={darkMode} disabled={pending} onChange={(categoryId) => update({ categoryId })} onCreate={onCreateCategory} onCreating={setCreating} />
      <FieldLabel darkMode={darkMode} label={messages.amount}><TextInput darkMode={darkMode} aria-label={messages.amount}
        inputMode="decimal" value={draft.amount} disabled={disabled} autoFocus onChange={(event) => update({ amount: event.target.value })} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.currency}><SingleChoiceGroup darkMode={darkMode} disabled={disabled} value={draft.currency}
        onChange={(value) => update({ currency: value as Currency })} options={currencies.map((value) => ({ value,label: value }))} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.note}><TextArea darkMode={darkMode} aria-label={messages.note} value={draft.note} maxLength={500}
        disabled={disabled} onChange={(event) => update({ note: event.target.value })} />
        <div className="flex flex-wrap gap-[var(--aa-space-control-gap)]">
          {(moreNotes === draft.categoryId ? suggestions : suggestions.slice(0,6)).map((note) => <Button key={noteKey(note)} darkMode={darkMode}
            tone="ghost" size="sm" active={noteKey(draft.note) === noteKey(note)} disabled={disabled} onClick={() => update({ note })}>{note}</Button>)}
          {suggestions.length > 6 && moreNotes !== draft.categoryId ? <Button darkMode={darkMode} tone="ghost" size="sm" disabled={disabled}
            aria-label={messages.moreNotes} onClick={() => setMoreNotes(draft.categoryId)}>{messages.more}</Button> : null}
        </div>
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.date}><DatePickerField darkMode={darkMode} value={draft.date} disabled={disabled}
        allowClear={false} messages={formMessages.datePicker} onChange={(date) => update({ date })} /></FieldLabel>
    </CrudEditorDialog>
    {confirm ? <ConfirmDialog darkMode={darkMode} pending={pending} title={messages.deleteTitle} description={messages.deleteDescription}
      confirmText={messages.delete} pendingConfirmText={messages.deleting} cancelText={messages.cancel} closeLabel={messages.close}
      onCancel={() => { if (!pending) setConfirm(false); }} onConfirm={() => {
        setPending(true); void onDelete(input.id).then((saved) => { if (saved) onClose(); }).finally(() => setPending(false));
      }} /> : null}
  </>;
}
