// Money Page - Fixed And Custom Category Management.
import { useState } from 'react';
import { ArrowDown, ArrowUp, Archive, GripVertical, PenLine, Plus } from 'lucide-react';
import { Button } from '@/components/button';
import { DialogOverlay, DialogFrame, DialogHeader, CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { ManagerDialogSection, ManagerList, ManagerListRow } from '@/components/manager-list';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { moveItem } from '@/components/reorder-list';
import { entryCategories } from '../types';
import type { MoneyCategory } from '../types';
import type { MoneyMessages } from '@/messages/money-messages';
import { categoryName } from './ExpenseEditor';
import { CategoryIcon } from './CategoryIcon';

export function CategoryManager({ categories,messages,darkMode,onCategory,onArchive,onOrder,onClose }: {
  categories: MoneyCategory[]; messages: MoneyMessages; darkMode: boolean;
  onCategory: (input: { id: string; name: string; isNew: boolean }) => Promise<boolean>;
  onArchive: (id: string) => Promise<boolean>; onOrder: (ids: string[]) => Promise<boolean>; onClose: () => void;
}) {
  const [draft,setDraft] = useState<{ id: string; name: string; isNew: boolean } | null>(null);
  const [archive,setArchive] = useState<string | null>(null), [pending,setPending] = useState(false);
  const custom = categories.filter((category) => !category.archived && category.seedKey === null);
  const values = custom.map((item) => item.id);
  async function command(action: () => Promise<boolean>,done = () => {}) {
    if (pending) return;
    setPending(true);
    try { if (await action()) done(); } finally { setPending(false); }
  }
  return <>
    <DialogOverlay zIndex="z-[60]"><DialogFrame darkMode={darkMode}>
      <DialogHeader darkMode={darkMode} title={messages.categories} closeLabel={messages.close} onClose={() => { if (!pending) onClose(); }} />
      <ManagerDialogSection darkMode={darkMode} title={messages.builtIns}>
        <ManagerList darkMode={darkMode} items={entryCategories} getItemKey={(value) => value} emptyText="" messages={messages.pagination}
          renderItem={(seed) => <ManagerListRow darkMode={darkMode} title={messages.defaults[seed]} leading={<CategoryIcon category={seed} />} />} />
      </ManagerDialogSection>
      <ManagerDialogSection darkMode={darkMode} title={messages.customCategories} action={<Button darkMode={darkMode} disabled={pending}
        icon={<Plus size={16} />} onClick={() => setDraft({ id: crypto.randomUUID(),name: '',isNew: true })}>{messages.new}</Button>}>
        <ManagerList darkMode={darkMode} items={custom} getItemKey={(category) => category.id} emptyText={messages.noCategories}
          messages={messages.pagination} renderItem={(category) => {
            const index = values.indexOf(category.id), label = categoryName(category,messages);
            return <div onDragOver={(event) => { if (!pending) event.preventDefault(); }} onDrop={(event) => {
              event.preventDefault(); const source = values.indexOf(event.dataTransfer.getData('text/plain'));
              if (!pending && source >= 0) void command(() => onOrder(moveItem(values,source,index)));
            }}><ManagerListRow darkMode={darkMode} title={label} action={<>
              <Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} draggable={!pending} title={messages.drag}
                aria-label={`${messages.drag}: ${label}`} icon={<GripVertical size={16} />} onDragStart={(event) => event.dataTransfer.setData('text/plain',category.id)} />
              <Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending || index === 0} title={messages.up}
                aria-label={`${messages.up}: ${label}`} icon={<ArrowUp size={16} />} onClick={() => void command(() => onOrder(moveItem(values,index,index - 1)))} />
              <Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending || index === values.length - 1} title={messages.down}
                aria-label={`${messages.down}: ${label}`} icon={<ArrowDown size={16} />} onClick={() => void command(() => onOrder(moveItem(values,index,index + 1)))} />
              <Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} title={messages.edit} aria-label={`${messages.edit}: ${label}`}
                icon={<PenLine size={16} />} onClick={() => setDraft({ id: category.id,name: label,isNew: false })} />
            </>} /></div>;
          }} />
      </ManagerDialogSection>
    </DialogFrame></DialogOverlay>
    {draft ? <CrudEditorDialog zIndex="z-[70]" darkMode={darkMode} title={messages.category} closeLabel={messages.close}
      pending={pending || !draft.name.trim()} saving={pending} saveText={messages.save} savingText={messages.saving}
      onClose={() => { if (!pending) setDraft(null); }} onSubmit={() => void command(() => onCategory(draft),() => setDraft(null))}
      deleteText={messages.archive} onDelete={draft.isNew ? undefined : () => setArchive(draft.id)}>
      <FieldLabel darkMode={darkMode} label={messages.name}><TextInput darkMode={darkMode} aria-label={messages.name} value={draft.name}
        maxLength={100} autoFocus disabled={pending} onChange={(event) => setDraft({ ...draft,name: event.target.value })} /></FieldLabel>
    </CrudEditorDialog> : null}
    {archive ? <ConfirmDialog zIndex="z-[80]" darkMode={darkMode} pending={pending} title={messages.deleteTitle} description={messages.deleteDescription}
      closeLabel={messages.close} cancelText={messages.cancel} confirmText={messages.archive} confirmIcon={<Archive size={16} />}
      onCancel={() => { if (!pending) setArchive(null); }} onConfirm={() => void command(() => onArchive(archive),() => { setArchive(null); setDraft(null); })} /> : null}
  </>;
}
