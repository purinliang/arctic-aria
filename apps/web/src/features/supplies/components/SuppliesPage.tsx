"use client";
// Supplies Page.
import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/button';
import { ContentSection } from '@/components/content-section';
import { Tabs } from '@/components/tabs';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { PagedList } from '@/components/paged-list';
import { sectionStackClass } from '@/components/spacing';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import { archiveSupply, getSupplyHistory, saveSupply, saveWish } from '../actions';
import { needsAttention } from '../supplies';
import { useSupplies } from '../hooks/useSupplies';
import type { SupplyInput, SupplyItem, SupplyKind, WishInput } from '../types';
import { SupplyEditor } from './SupplyEditor';
import { WishEditor } from './WishEditor';
import { ReplaceDialog, HistoryDialog } from './StockDialogs';
import { SupplyRow, WishRow } from './SupplyRows';

export function SuppliesPage({ messages,darkMode,language,timezone,...options }: Omit<FeatureActionOptions,'resultMessages'> & {
  messages: SuppliesMessages; darkMode: boolean; language: string; timezone: string;
}) {
  const [tab,setTab] = useState<SupplyKind | 'travel'>('food'), [attention,setAttention] = useState(false);
  const [supply,setSupply] = useState<SupplyInput | null>(null), [wish,setWish] = useState<WishInput | null>(null);
  const [replace,setReplace] = useState<SupplyItem | null>(null), [history,setHistory] = useState<SupplyItem | null>(null);
  const state = useSupplies({ ...options,resultMessages: messages.results });
  const { invoke } = state;
  const loadHistory = useCallback((id: string) => invoke(() => getSupplyHistory(id)),[invoke]);
  function create() {
    if (tab === 'travel') setWish({ id: crypto.randomUUID(),isNew: true,title: '',country: null,shop: null,url: null,note: null,linkedSupplyId: null,status: 'planned',version: 1 });
    else setSupply({ id: crypto.randomUUID(),isNew: true,kind: tab,title: '',note: '',level: 5,spares: 0,version: 1 });
  }
  return <div className={sectionStackClass}>
    <ContentSection darkMode={darkMode} title={messages.tabs[tab]} action={<Button darkMode={darkMode} disabled={state.loading}
      icon={<Plus size={16} />} onClick={create}>{messages.new}</Button>}>
      <Tabs darkMode={darkMode} className="flex-wrap" ariaLabel={messages.item} value={tab} onChange={(value) => setTab(value as typeof tab)}
        options={Object.entries(messages.tabs).map(([value,label]) => ({ value,label }))} />
      {tab !== 'travel' ? <SingleChoiceGroup darkMode={darkMode} value={attention ? 'attention' : 'all'}
        options={[{ value: 'all',label: messages.all },{ value: 'attention',label: messages.attention }]}
        onChange={(value) => setAttention(value === 'attention')} /> : null}
      {tab === 'travel' ? <PagedList darkMode={darkMode} layout="cards" items={state.data.wishlist} pageSize={6} loading={state.loading}
        resetKey="travel" messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel} emptyText={messages.noItems} loadingText={messages.loading}
        renderItem={(item) => <WishRow key={item.id} item={item} linked={state.data.items.find((row) => row.id === item.linkedSupplyId)}
          messages={messages} darkMode={darkMode} language={language} timezone={timezone} pending={state.pending.includes(item.id)}
          onEdit={() => setWish({ ...item,isNew: false })} onToggle={() => void state.toggleWish(item)} />} />
        : <PagedList darkMode={darkMode} layout="cards" items={state.data.items.filter((item) => item.kind === tab && (!attention || needsAttention(item)))}
          pageSize={6} resetKey={`${tab}:${attention}`} loading={state.loading} messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel}
          emptyText={messages.noItems} loadingText={messages.loading} renderItem={(item) => <SupplyRow key={item.id} item={item}
            messages={messages} darkMode={darkMode} language={language} timezone={timezone} pending={state.pending.includes(item.id)}
            onEdit={() => setSupply({ ...item,note: item.note ?? '',isNew: false })} onHistory={() => setHistory(item)} onReplace={() => setReplace(item)}
            onLevel={(level) => {
              if (level > item.level) options.showErrorNotification(messages.results.level_increase);
              else void state.stock(item,{ operation: 'observe',level,useSpare: false });
            }} />} />}
    </ContentSection>
    {supply ? <SupplyEditor key={supply.id} input={supply} messages={messages} darkMode={darkMode} onError={options.showErrorNotification}
      onClose={() => setSupply(null)} onSave={(input) => state.mutate(() => saveSupply(input))}
      onArchive={() => state.mutate(() => archiveSupply({ id: supply.id,version: supply.version,wishlist: false }))} /> : null}
    {wish ? <WishEditor key={wish.id} input={wish} items={state.data.items} messages={messages} darkMode={darkMode} onError={options.showErrorNotification}
      onClose={() => setWish(null)} onSave={(input) => state.mutate(() => saveWish(input))}
      onArchive={() => state.mutate(() => archiveSupply({ id: wish.id,version: wish.version,wishlist: true }))} /> : null}
    {replace ? <ReplaceDialog item={replace} messages={messages} darkMode={darkMode} onClose={() => setReplace(null)}
      onReplace={(useSpare) => state.stock(replace,{ operation: 'replace',level: 5,useSpare })} /> : null}
    {history ? <HistoryDialog item={history} messages={messages} darkMode={darkMode} language={language} timezone={timezone}
      onLoad={loadHistory} onClose={() => setHistory(null)} /> : null}
  </div>;
}
