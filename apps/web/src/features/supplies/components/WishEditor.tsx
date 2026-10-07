// Supplies Page - Travel Shopping Editor.
import { useState } from 'react';
import { CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { TextArea } from '@/components/forms/text-area-field';
import { SelectInput } from '@/components/forms/selection-field';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import type { SupplyItem, WishInput } from '../types';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import { validWish } from '../supplies';

export function WishEditor({ input,items,messages,darkMode,onSave,onArchive,onClose,onError }: {
  input: WishInput; items: SupplyItem[]; messages: SuppliesMessages; darkMode: boolean;
  onSave: (input: WishInput) => Promise<boolean>; onArchive: () => Promise<boolean>; onClose: () => void; onError: (message: string) => void;
}) {
  const [draft,setDraft] = useState(input), [pending,setPending] = useState(false), [confirm,setConfirm] = useState(false);
  async function submit() {
    if (pending) return;
    if (!validWish(draft)) { onError(messages.results.invalid); return; }
    setPending(true);
    try { if (await onSave(draft)) onClose(); } finally { setPending(false); }
  }
  const fields = [['title',messages.title,100],['country',messages.country,100],['shop',messages.shop,200],['url',messages.url,1000]] as const;
  return <>
    <CrudEditorDialog darkMode={darkMode} title={messages.wish} closeLabel={messages.close} pending={pending} saving={pending && !confirm}
      saveText={messages.save} savingText={messages.saving} deleteText={messages.archive} onSubmit={() => void submit()}
      onClose={() => { if (!pending) onClose(); }} onDelete={input.isNew ? undefined : () => setConfirm(true)}>
      {fields.map(([key,label,maxLength]) => <FieldLabel key={key} darkMode={darkMode} label={label}><TextInput darkMode={darkMode}
        aria-label={label} value={draft[key] ?? ''} maxLength={maxLength} disabled={pending} autoFocus={key === 'title'}
        onChange={(event) => setDraft({ ...draft,[key]: event.target.value })} /></FieldLabel>)}
      <FieldLabel darkMode={darkMode} label={messages.linked}><SelectInput darkMode={darkMode} aria-label={messages.linked}
        value={draft.linkedSupplyId ?? ''} onChange={(value) => setDraft({ ...draft,linkedSupplyId: value || null })} disabled={pending}
        placeholder={messages.none} options={[{ value: '',label: messages.none }, ...items.map((item) => ({ value: item.id,label: item.title })),
          ...(draft.linkedSupplyId && !items.some((item) => item.id === draft.linkedSupplyId) ? [{ value: draft.linkedSupplyId,label: messages.archived }] : [])]} /></FieldLabel>
      <SingleChoiceGroup darkMode={darkMode} value={draft.status} disabled={pending} onChange={(value) => setDraft({ ...draft,status: value as WishInput['status'] })}
        options={[{ value: 'planned',label: messages.planned },{ value: 'purchased',label: messages.purchased }]} />
      <FieldLabel darkMode={darkMode} label={messages.note}><TextArea darkMode={darkMode} aria-label={messages.note} value={draft.note ?? ''} maxLength={500}
        disabled={pending} onChange={(event) => setDraft({ ...draft,note: event.target.value })} /></FieldLabel>
    </CrudEditorDialog>
    {confirm ? <ConfirmDialog darkMode={darkMode} pending={pending} title={messages.archiveTitle} description={messages.archiveDescription}
      closeLabel={messages.close} cancelText={messages.cancel} confirmText={messages.archive} pendingConfirmText={messages.archiving}
      onCancel={() => { if (!pending) setConfirm(false); }} onConfirm={() => {
        setPending(true); void onArchive().then((saved) => { if (saved) onClose(); }).finally(() => setPending(false));
      }} /> : null}
  </>;
}
