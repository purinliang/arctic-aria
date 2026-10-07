// Supplies Page - Supply Editor.
import { useState } from 'react';
import { CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { TextArea } from '@/components/forms/text-area-field';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { StockLevelControl } from '@/components/stock-level-control';
import type { SupplyInput } from '../types';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import { validSupply } from '../supplies';

export function SupplyEditor({ input,messages,darkMode,onSave,onArchive,onClose,onError }: {
  input: SupplyInput; messages: SuppliesMessages; darkMode: boolean; onSave: (input: SupplyInput) => Promise<boolean>;
  onArchive: () => Promise<boolean>; onClose: () => void; onError: (message: string) => void;
}) {
  const [draft,setDraft] = useState(input), [spares,setSpares] = useState(String(input.spares));
  const [pending,setPending] = useState(false), [confirm,setConfirm] = useState(false);
  async function submit() {
    if (pending) return;
    const value = { ...draft,spares: spares.trim() ? Number(spares) : NaN };
    if (!validSupply(value)) { onError(messages.results.invalid); return; }
    setPending(true);
    try { if (await onSave(value)) onClose(); } finally { setPending(false); }
  }
  return <>
    <CrudEditorDialog darkMode={darkMode} title={input.isNew ? `${messages.item} · ${messages.tabs[input.kind]}` : messages.item} closeLabel={messages.close} pending={pending} saving={pending && !confirm}
      saveText={messages.save} savingText={messages.saving} deleteText={messages.archive} onSubmit={() => void submit()}
      onClose={() => { if (!pending) onClose(); }} onDelete={input.isNew ? undefined : () => setConfirm(true)}>
      <FieldLabel darkMode={darkMode} label={messages.title}><TextInput darkMode={darkMode} aria-label={messages.title}
        maxLength={100} value={draft.title} autoFocus disabled={pending} onChange={(event) => setDraft({ ...draft,title: event.target.value })} /></FieldLabel>
      {!input.isNew ? <FieldLabel darkMode={darkMode} label={messages.kind}><SingleChoiceGroup darkMode={darkMode} disabled={pending} value={draft.kind}
        onChange={(value) => setDraft({ ...draft,kind: value as SupplyInput['kind'] })}
        options={['food','household'].map((value) => ({ value,label: messages.tabs[value as 'food' | 'household'] }))} /></FieldLabel> : null}
      {input.isNew ? <FieldLabel darkMode={darkMode} label={messages.level}><StockLevelControl darkMode={darkMode} disabled={pending}
        label={messages.level} value={draft.level} onChange={(level) => setDraft({ ...draft,level })} /></FieldLabel> : null}
      <FieldLabel darkMode={darkMode} label={messages.spares}><TextInput darkMode={darkMode} type="number" inputMode="numeric" min={0} max={999} step={1}
        aria-label={messages.spares} value={spares} disabled={pending} onChange={(event) => setSpares(event.target.value)} /></FieldLabel>
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
