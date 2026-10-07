// Money Page - Category Manager.
import { useState } from 'react';
import { Archive, PenLine, Pin, Plus } from 'lucide-react';
import { Button } from '@/components/button';
import { DialogOverlay, DialogFrame, DialogHeader, CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { ManagerDialogSection, ManagerList, ManagerListRow } from '@/components/manager-list';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import type { MoneyCategory, MoneySettings } from '../types';
import type { MoneyMessages } from '@/messages/money-messages';
import { categoryName } from './ExpenseEditor';

export function CategoryManager({ categories, settings, messages, darkMode, onCategory, onArchive, onSettings, onClose }: {
  categories: MoneyCategory[]; settings: MoneySettings; messages: MoneyMessages; darkMode: boolean;
  onCategory: (input: { id: string; name: string; isNew: boolean }) => Promise<boolean>;
  onArchive: (id: string) => Promise<boolean>; onSettings: (settings: MoneySettings) => Promise<boolean>; onClose: () => void;
}) {
  const [draft, setDraft] = useState<{ id: string; name: string; isNew: boolean } | null>(null);
  const [archive, setArchive] = useState<string | null>(null), [pending, setPending] = useState(false);
  async function command(action: () => Promise<boolean>, done: () => void) {
    if (pending) return;
    setPending(true);
    try { if (await action()) done(); } finally { setPending(false); }
  }
  return <>
    <DialogOverlay><DialogFrame darkMode={darkMode}>
      <DialogHeader darkMode={darkMode} title={messages.categories} closeLabel={messages.close} onClose={() => { if (!pending) onClose(); }} />
      <ManagerDialogSection darkMode={darkMode} title={messages.categories} action={<Button darkMode={darkMode} disabled={pending}
        icon={<Plus size={16} />} onClick={() => setDraft({ id: crypto.randomUUID(), name: '', isNew: true })}>{messages.new}</Button>}>
        <ManagerList darkMode={darkMode} items={categories.filter((category) => !category.archived)} getItemKey={(category) => category.id}
          emptyText={messages.empty} messages={messages.pagination} renderItem={(category) => {
            const pinned = settings.quickCategoryIds.includes(category.id);
            return <ManagerListRow darkMode={darkMode} title={categoryName(category, messages)} action={<>
              <Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.pin}: ${categoryName(category, messages)}`}
                title={pinned ? messages.unpin : messages.pin} aria-pressed={pinned} disabled={pending || (!pinned && settings.quickCategoryIds.length >= 5)}
                icon={<Pin size={16} fill={pinned ? 'currentColor' : 'none'} />} onClick={() => void command(() => onSettings({ ...settings,
                  quickCategoryIds: pinned ? settings.quickCategoryIds.filter((id) => id !== category.id) : [...settings.quickCategoryIds, category.id],
                }), () => {})} />
              <Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.edit}: ${categoryName(category, messages)}`}
                title={messages.edit} disabled={pending} icon={<PenLine size={16} />} onClick={() => setDraft({ id: category.id, name: categoryName(category, messages), isNew: false })} />
              <Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.archive}: ${categoryName(category, messages)}`}
                title={messages.archive} disabled={pending} icon={<Archive size={16} />} onClick={() => setArchive(category.id)} />
            </>} />;
          }} />
      </ManagerDialogSection>
    </DialogFrame></DialogOverlay>
    {draft ? <CrudEditorDialog zIndex="z-[60]" darkMode={darkMode} title={messages.category} closeLabel={messages.close}
      pending={pending || !draft.name.trim()} saving={pending} saveText={messages.save} savingText={messages.saving}
      onClose={() => { if (!pending) setDraft(null); }} onSubmit={() => void command(() => onCategory(draft), () => setDraft(null))}>
      <FieldLabel darkMode={darkMode} label={messages.name}><TextInput darkMode={darkMode} aria-label={messages.name}
        value={draft.name} maxLength={100} autoFocus disabled={pending} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></FieldLabel>
    </CrudEditorDialog> : null}
    {archive ? <ConfirmDialog darkMode={darkMode} pending={pending} title={messages.deleteTitle} description={messages.deleteDescription}
      closeLabel={messages.close} cancelText={messages.cancel} confirmText={messages.archive}
      onCancel={() => { if (!pending) setArchive(null); }} onConfirm={() => void command(() => onArchive(archive), () => setArchive(null))} /> : null}
  </>;
}
