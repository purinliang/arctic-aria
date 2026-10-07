"use client";
// Supplies Page - Household Replenishment And Travel Wishes.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/button';
import { ContentSection } from '@/components/content-section';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { SelectInput } from '@/components/forms/selection-field';
import { PagedList } from '@/components/paged-list';
import { Text } from '@/components/text';
import { sectionStackClass } from '@/components/spacing';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import { archiveSupply, saveSupply, saveWish } from '../actions';
import { needsAttention, stockQuantity } from '../supplies';
import { useSupplies } from '../hooks/useSupplies';
import type { SupplyInput, SupplyKind, WishInput } from '../types';
import { SupplyEditor } from './SupplyEditor';
import { WishEditor } from './WishEditor';
import { SupplyRow, WishRow } from './SupplyRows';

export function SuppliesPage({ userId,messages,darkMode,language,timezone,...options }: Omit<FeatureActionOptions,'resultMessages'> & {
  userId: string; messages: SuppliesMessages; darkMode: boolean; language: string; timezone: string;
}) {
  const [category,setCategory] = useState<SupplyKind | 'travel' | 'all'>('all'), [attention,setAttention] = useState(false);
  const [supply,setSupply] = useState<SupplyInput | null>(null), [wish,setWish] = useState<WishInput | null>(null);
  const state = useSupplies(userId,{ ...options,resultMessages: messages.results });
  const filtered = state.data.items.filter((item) => category === 'all' || item.kind === category);
  const count = filtered.filter(needsAttention).length;
  const total = state.data.items.filter(needsAttention).length;
  const items = filtered.filter((item) => !attention || needsAttention(item))
    .sort((a,b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  function create() {
    if (category === 'travel') setWish({ id: crypto.randomUUID(),isNew: true,title: '',country: null,shop: null,url: null,note: null,linkedSupplyId: null,status: 'planned',version: 1 });
    else setSupply({ id: crypto.randomUUID(),isNew: true,kind: category === 'household' ? 'household' : 'food',title: '',note: '',level: 5,spares: 0,version: 1,
      quantity: 5,unit: 'unit',increment: 1,targetQuantity: 5,lowStockThreshold: 1 });
  }
  return <div className={sectionStackClass}>
    <div className="flex items-center justify-between gap-[var(--aa-space-inline-gap)]">
      <Text weight="semibold">{messages.restock} · {state.loading ? '…' : total}</Text>
      <Button darkMode={darkMode} disabled={state.loading} icon={<Plus size={16} />} onClick={create}>{messages.new}</Button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-[var(--aa-space-control-gap)]">
      {category !== 'travel' ? <SingleChoiceGroup darkMode={darkMode} value={attention ? 'attention' : 'all'}
        options={[{ value: 'all',label: messages.allSupplies },{ value: 'attention',label: `${messages.restock} (${count})` }]}
        onChange={(value) => setAttention(value === 'attention')} /> : null}
      <div className="w-full sm:w-48"><SelectInput darkMode={darkMode} aria-label={messages.kind} value={category} onChange={(value) => setCategory(value as typeof category)}
        options={[{ value: 'all',label: messages.all },...Object.entries(messages.tabs).map(([value,label]) => ({ value,label }))]} /></div>
    </div>
    <ContentSection darkMode={darkMode} title={category === 'all' ? messages.allSupplies : messages.tabs[category]}>
      {category === 'travel' ? <PagedList darkMode={darkMode} layout="rows" className="grid gap-[var(--aa-space-control-gap)]" items={state.data.wishlist} pageSize={6} loading={state.loading}
        resetKey="travel" messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} emptyText={messages.noItems} loadingText={messages.loading}
        renderItem={(item) => <WishRow key={item.id} item={item} linked={state.data.items.find((row) => row.id === item.linkedSupplyId)}
          messages={messages} darkMode={darkMode} language={language} timezone={timezone} pending={state.pending.includes(item.id)}
          onEdit={() => setWish({ ...item,isNew: false })} onToggle={() => void state.toggleWish(item)} />} />
        : <PagedList darkMode={darkMode} layout="rows" className="grid gap-[var(--aa-space-control-gap)]" items={items} pageSize={6} resetKey={`${category}:${attention}`} loading={state.loading}
          messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} emptyText={messages.noItems} loadingText={messages.loading}
          renderItem={(item) => <SupplyRow key={item.id} item={item} messages={messages} darkMode={darkMode} language={language} pending={state.pending.includes(item.id)}
            onEdit={() => setSupply({ ...item,...stockQuantity(item),note: item.note ?? '',isNew: false })}
            onAdjust={(direction) => void state.adjust(item,direction)} />} />}
    </ContentSection>
    {supply ? <SupplyEditor key={supply.id} input={supply} messages={messages} darkMode={darkMode} onError={options.showErrorNotification}
      onClose={() => setSupply(null)} onSave={(input) => state.mutate(() => saveSupply(input))}
      onArchive={() => state.mutate(() => archiveSupply({ id: supply.id,version: supply.version,wishlist: false }))} /> : null}
    {wish ? <WishEditor key={wish.id} input={wish} items={state.data.items} messages={messages} darkMode={darkMode} onError={options.showErrorNotification}
      onClose={() => setWish(null)} onSave={(input) => state.mutate(() => saveWish(input))}
      onArchive={() => state.mutate(() => archiveSupply({ id: wish.id,version: wish.version,wishlist: true }))} /> : null}
  </div>;
}
