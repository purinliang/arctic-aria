// Supplies Page - Simple Stock Editor.
import { useState } from 'react';
import { CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { Disclosure } from '@/components/disclosure';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { TextArea } from '@/components/forms/text-area-field';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { StockLevelSlider } from '@/components/stock-level-slider';
import { Text } from '@/components/text';
import type { SupplyInput } from '../types';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import { validSupply, stockQuantity } from '../supplies';
import { isLevelStock } from '../stock-level';

export function SupplyEditor({ input,messages,darkMode,onSave,onArchive,onClose,onError }: {
  input: SupplyInput; messages: SuppliesMessages; darkMode: boolean; onSave: (input: SupplyInput) => Promise<boolean>;
  onArchive: () => Promise<boolean>; onClose: () => void; onError: (message: string) => void;
}) {
  const [draft,setDraft] = useState({ ...input,...stockQuantity(input) });
  const [pending,setPending] = useState(false), [confirm,setConfirm] = useState(false);
  const scaled = isLevelStock(input);
  async function submit() {
    if (pending) return;
    if (!validSupply(draft)) { onError(messages.results.invalid); return; }
    setPending(true);
    try { if (await onSave(draft)) onClose(); } finally { setPending(false); }
  }
  return <>
    <CrudEditorDialog darkMode={darkMode} title={messages.item} closeLabel={messages.close} pending={pending} saving={pending && !confirm}
      saveText={input.isNew ? messages.create : messages.save} savingText={messages.saving} deleteText={messages.archive} onSubmit={() => void submit()}
      onClose={() => { if (!pending) onClose(); }} onDelete={input.isNew ? undefined : () => setConfirm(true)}>
      <FieldLabel darkMode={darkMode} label={messages.title}><TextInput darkMode={darkMode} aria-label={messages.title}
        maxLength={100} value={draft.title} autoFocus disabled={pending} onChange={(event) => setDraft({ ...draft,title: event.target.value })} /></FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.kind}><SingleChoiceGroup darkMode={darkMode} disabled={pending} value={draft.kind}
        onChange={(value) => setDraft({ ...draft,kind: value as SupplyInput['kind'] })}
        options={['food','household'].map((value) => ({ value,label: messages.tabs[value as 'food' | 'household'] }))} /></FieldLabel>
      {scaled ? <FieldLabel darkMode={darkMode} label={`${input.isNew ? messages.initialStock : messages.level} · ${draft.quantity}/5`}>
        <StockLevelSlider value={draft.quantity} label={input.isNew ? messages.initialStock : messages.level} disabled={pending}
          valueText={`${draft.quantity}/5 · ${messages.levelNames[draft.quantity]}`}
          onPreview={(quantity) => setDraft({ ...draft,quantity,...(input.isNew ? { level: quantity } : {}) })} onCommit={() => {}} />
      </FieldLabel> : <Text size="sm" tone="secondary">{draft.quantity} {draft.unit} · {messages.legacyQuantity}</Text>}
      <Disclosure title={messages.optionalNote} initiallyOpen={!!input.note}>
        <FieldLabel darkMode={darkMode} label={messages.note}><TextArea darkMode={darkMode} aria-label={messages.note} value={draft.note} maxLength={500}
          disabled={pending} onChange={(event) => setDraft({ ...draft,note: event.target.value })} /></FieldLabel>
      </Disclosure>
    </CrudEditorDialog>
    {confirm ? <ConfirmDialog darkMode={darkMode} pending={pending} title={messages.archiveTitle} description={messages.archiveDescription}
      closeLabel={messages.close} cancelText={messages.cancel} confirmText={messages.archive} pendingConfirmText={messages.archiving}
      onCancel={() => { if (!pending) setConfirm(false); }} onConfirm={() => {
        setPending(true); void onArchive().then((saved) => { if (saved) onClose(); }).finally(() => setPending(false));
      }} /> : null}
  </>;
}
