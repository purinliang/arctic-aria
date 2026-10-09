// Money Page - Category Tiles And Inline Creation.
import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { IconChoiceGrid } from '@/components/forms/choice-group';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import type { MoneyMessages } from '@/messages/money-messages';
import { entryCategories } from '../types';
import type { MoneyCategory } from '../types';
import { CategoryIcon } from './CategoryIcon';

export function categoryName(category: MoneyCategory,messages: MoneyMessages) { return category.seedKey ? messages.defaults[category.seedKey] : category.name ?? ''; }
export function ExpenseCategories({ value,originalCategoryId,categories,messages,darkMode,disabled,onChange,onCreate,onCreating }: {
  value: string; originalCategoryId: string; categories: MoneyCategory[]; messages: MoneyMessages; darkMode: boolean; disabled: boolean;
  onChange: (id: string) => void; onCreate: (input: { id: string; name: string; isNew: boolean }) => Promise<boolean>; onCreating: (pending: boolean) => void;
}) {
  const selected = categories.find((item) => item.id === value);
  const primary = categories.filter((item) => item.seedKey && entryCategories.includes(item.seedKey as typeof entryCategories[number]));
  const [expanded,setExpanded] = useState(!primary.some((item) => item.id === value));
  const [draft,setDraft] = useState<{ id: string; name: string } | null>(null), [creating,setCreating] = useState(false), [error,setError] = useState('');
  const additional = categories.filter((item) => !primary.includes(item) && (!item.archived || item.id === originalCategoryId)
    && (item.seedKey !== 'other' || item.id === originalCategoryId));
  async function create() {
    if (!draft || creating || disabled) return;
    if (!draft.name.trim() || Array.from(draft.name.trim()).length > 100) { setError(messages.categoryNameInvalid); return; }
    setCreating(true); onCreating(true);
    try {
      if (await onCreate({ ...draft,isNew: true })) { onChange(draft.id); setDraft(null); setError(''); }
    } finally { setCreating(false); onCreating(false); }
  }
  const choice = (category: MoneyCategory) => ({ value: category.id,label: categoryName(category,messages),icon: <CategoryIcon category={category.seedKey} /> });
  return <>
    <IconChoiceGrid darkMode={darkMode} label={messages.category} disabled={disabled || creating} value={value}
      options={[...primary.map(choice),{ value: 'more',label: messages.more,icon: <MoreHorizontal size={20} />,action: true,expanded }]}
      onChange={(id) => { if (id === 'more') setExpanded(!expanded); else onChange(id); }} />
    {expanded ? <IconChoiceGrid darkMode={darkMode} label={messages.customCategories} disabled={disabled || creating} value={value}
      options={[...additional.map(choice),{ value: 'create',label: '',ariaLabel: messages.newCategory,icon: <Plus size={20} />,action: true }]}
      onChange={(id) => { if (id === 'create') { setDraft({ id: crypto.randomUUID(),name: '' }); setError(''); } else onChange(id); }} /> : null}
    {draft && expanded ? <div className="grid gap-[var(--aa-space-control-gap)]">
      <FieldLabel darkMode={darkMode} label={messages.name}><TextInput darkMode={darkMode} aria-label={messages.name} autoFocus maxLength={100}
        value={draft.name} disabled={disabled || creating} onChange={(event) => { setDraft({ ...draft,name: event.target.value }); setError(''); }}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void create(); } }} /></FieldLabel>
      {error ? <Text size="sm" className="text-red-500">{error}</Text> : null}
      <div className="flex gap-[var(--aa-space-control-gap)]"><Button darkMode={darkMode} disabled={disabled || creating} onClick={() => void create()}>{messages.create}</Button>
        <Button darkMode={darkMode} tone="ghost" disabled={disabled || creating} onClick={() => { setDraft(null); setError(''); }}>{messages.cancel}</Button></div>
    </div> : null}
    {selected?.archived ? <Text size="sm" tone="secondary">{messages.archived}</Text> : null}
  </>;
}
