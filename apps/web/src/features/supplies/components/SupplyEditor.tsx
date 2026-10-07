// Supplies Page - One-Time Stock Configuration.
import { useState } from 'react';
import { CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { TextArea } from '@/components/forms/text-area-field';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { FormGrid } from '@/components/forms/form-layout';
import type { SupplyInput } from '../types';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import { validSupply, stockQuantity } from '../supplies';

export function SupplyEditor({ input,messages,darkMode,onSave,onArchive,onClose,onError }: {
  input: SupplyInput; messages: SuppliesMessages; darkMode: boolean; onSave: (input: SupplyInput) => Promise<boolean>;
  onArchive: () => Promise<boolean>; onClose: () => void; onError: (message: string) => void;
}) {
  const initial = stockQuantity(input);
  const [draft,setDraft] = useState({ ...input,...initial });
  const [numbers,setNumbers] = useState({ quantity: String(initial.quantity),increment: String(initial.increment),targetQuantity: String(initial.targetQuantity),lowStockThreshold: String(initial.lowStockThreshold) });
  const [pending,setPending] = useState(false), [confirm,setConfirm] = useState(false);
  async function submit() {
    if (pending) return;
    const parsed = Object.fromEntries(Object.entries(numbers).map(([key,value]) => [key,value.trim() ? Number(value) : NaN]));
    const value = { ...draft,...parsed };
    if (!validSupply(value)) { onError(messages.results.invalid); return; }
    setPending(true);
    try { if (await onSave(value)) onClose(); } finally { setPending(false); }
  }
  const fields = [ ['quantity',messages.quantity],['targetQuantity',messages.target],['increment',messages.increment],['lowStockThreshold',messages.threshold] ] as const;
  return <>
    <CrudEditorDialog darkMode={darkMode} title={messages.item} closeLabel={messages.close} pending={pending} saving={pending && !confirm}
      saveText={messages.save} savingText={messages.saving} deleteText={messages.archive} onSubmit={() => void submit()}
      onClose={() => { if (!pending) onClose(); }} onDelete={input.isNew ? undefined : () => setConfirm(true)}>
      <FieldLabel darkMode={darkMode} label={messages.title}><TextInput darkMode={darkMode} aria-label={messages.title}
        maxLength={100} value={draft.title} autoFocus disabled={pending} onChange={(event) => setDraft({ ...draft,title: event.target.value })} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.kind}><SingleChoiceGroup darkMode={darkMode} disabled={pending} value={draft.kind}
        onChange={(value) => setDraft({ ...draft,kind: value as SupplyInput['kind'] })}
        options={['food','household'].map((value) => ({ value,label: messages.tabs[value as 'food' | 'household'] }))} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.unit}><TextInput darkMode={darkMode} aria-label={messages.unit} value={draft.unit} maxLength={40}
        disabled={pending} onChange={(event) => setDraft({ ...draft,unit: event.target.value })} /></FieldLabel>
      <FormGrid columns={2} className="min-[360px]:grid-cols-2">
        {fields.map(([key,label]) => <FieldLabel key={key} darkMode={darkMode} label={label}>
          <TextInput darkMode={darkMode} type="number" inputMode="decimal" min={key === 'increment' || key === 'targetQuantity' ? 0.001 : 0}
            max={999999.999} step="any" aria-label={label} value={numbers[key]} disabled={pending}
            onChange={(event) => setNumbers({ ...numbers,[key]: event.target.value })} />
        </FieldLabel>)}
      </FormGrid>
      <FieldLabel darkMode={darkMode} label={messages.note}><TextArea darkMode={darkMode} aria-label={messages.note} value={draft.note} maxLength={500}
        disabled={pending} onChange={(event) => setDraft({ ...draft,note: event.target.value })} /></FieldLabel>
    </CrudEditorDialog>
    {confirm ? <ConfirmDialog darkMode={darkMode} pending={pending} title={messages.archiveTitle} description={messages.archiveDescription}
      closeLabel={messages.close} cancelText={messages.cancel} confirmText={messages.archive} pendingConfirmText={messages.archiving}
      onCancel={() => { if (!pending) setConfirm(false); }} onConfirm={() => {
        setPending(true); void onArchive().then((saved) => { if (saved) onClose(); }).finally(() => setPending(false));
      }} /> : null}
  </>;
}
