"use client";
// Supplies Page - Prioritized Stock And Secondary Travel Wishes.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/button';
import { CreateCard } from '@/components/create-card';
import { Disclosure } from '@/components/disclosure';
import { PagedList } from '@/components/paged-list';
import { sectionStackClass } from '@/components/spacing';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import { archiveSupply, saveSupply, saveWish } from '../actions';
import { stockQuantity } from '../supplies';
import { compareStock } from '../stock-level';
import { showTravelShopping } from '../visibility';
import { useSupplies } from '../hooks/useSupplies';
import type { SupplyInput, WishInput } from '../types';
import { SupplyEditor } from './SupplyEditor';
import { WishEditor } from './WishEditor';
import { SupplyRow, WishRow } from './SupplyRows';

export function SuppliesPage({ userId,messages,darkMode,language,timezone,...options }: Omit<FeatureActionOptions,'resultMessages'> & {
  userId: string; messages: SuppliesMessages; darkMode: boolean; language: string; timezone: string;
}) {
  const [supply,setSupply] = useState<SupplyInput | null>(null), [wish,setWish] = useState<WishInput | null>(null);
  const state = useSupplies(userId,{ ...options,resultMessages: messages.results });
  const [interaction,setInteraction] = useState<{ ids: string[]; order: string[] } | null>(null);
  const items = [...state.data.items].sort(compareStock);
  if (interaction) items.sort((a,b) => interaction.order.indexOf(a.id) - interaction.order.indexOf(b.id));
  function interactionChanged(id: string,active: boolean) {
    setInteraction((current) => {
      const ids = [...new Set([...(current?.ids ?? []).filter((item) => item !== id),...(active ? [id] : [])])];
      return ids.length ? { ids,order: current?.order ?? items.map((item) => item.id) } : null;
    });
  }
  function create() {
    setSupply({ id: crypto.randomUUID(),isNew: true,kind: 'food',title: '',note: '',level: 5,spares: 0,version: 1,
      quantity: 5,unit: 'unit',increment: 1,targetQuantity: 5,lowStockThreshold: 1 });
  }
  return <div className={sectionStackClass}>
    <PagedList darkMode={darkMode} layout="cards" className="lg:grid-cols-3 gap-[var(--aa-space-control-gap)]" items={items} pageSize={11} resetKey="stock" loading={state.loading}
      leadingItem={<CreateCard darkMode={darkMode} disabled={state.loading} label={messages.newSupply} onClick={create} />}
      messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} emptyText={messages.noItems} loadingText={messages.loading}
      renderItem={(item) => <SupplyRow key={item.id} item={item} messages={messages} darkMode={darkMode} language={language} pending={state.pending.includes(item.id)}
        onEdit={() => setSupply({ ...item,...stockQuantity(item),note: item.note ?? '',isNew: false })}
        onLevel={(level) => void state.setLevel(item,level)} onInteractionChange={(active) => interactionChanged(item.id,active)} />} />
    {showTravelShopping && <Disclosure title={messages.tabs.travel}>
      <div className="flex justify-end"><Button darkMode={darkMode} disabled={state.loading} icon={<Plus size={16} />}
        onClick={() => setWish({ id: crypto.randomUUID(),isNew: true,title: '',country: null,shop: null,url: null,note: null,linkedSupplyId: null,status: 'planned',version: 1 })}>{messages.new}</Button></div>
      <PagedList darkMode={darkMode} layout="rows" className="grid gap-[var(--aa-space-control-gap)]" items={state.data.wishlist} pageSize={6} loading={state.loading}
        resetKey="travel" messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} emptyText={messages.noItems} loadingText={messages.loading}
        renderItem={(item) => <WishRow key={item.id} item={item} linked={state.data.items.find((row) => row.id === item.linkedSupplyId)}
          messages={messages} darkMode={darkMode} language={language} timezone={timezone} pending={state.pending.includes(item.id)}
          onEdit={() => setWish({ ...item,isNew: false })} onToggle={() => void state.toggleWish(item)} />} />
    </Disclosure>}
    {supply ? <SupplyEditor key={supply.id} input={supply} messages={messages} darkMode={darkMode} onError={options.showErrorNotification}
      onClose={() => setSupply(null)} onSave={(input) => state.mutate(() => saveSupply(input))}
      onArchive={() => state.mutate(() => archiveSupply({ id: supply.id,version: supply.version,wishlist: false }))} /> : null}
    {wish ? <WishEditor key={wish.id} input={wish} items={state.data.items} messages={messages} darkMode={darkMode} onError={options.showErrorNotification}
      onClose={() => setWish(null)} onSave={(input) => state.mutate(() => saveWish(input))}
      onArchive={() => state.mutate(() => archiveSupply({ id: wish.id,version: wish.version,wishlist: true }))} /> : null}
  </div>;
}
