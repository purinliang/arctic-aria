// Supplies Page - Stock And Travel Rows.
import { Check, ExternalLink, History, PenLine, RotateCcw } from 'lucide-react';
import { Button } from '@/components/button';
import { StockLevelControl } from '@/components/stock-level-control';
import { RecordCard } from '@/components/record-card';
import { Text } from '@/components/text';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import type { SupplyItem, WishItem } from '../types';
import { depletion, needsAttention } from '../supplies';

export function estimateText(item: SupplyItem,messages: SuppliesMessages,language: string,timezone: string) {
  const estimate = depletion(item);
  if (estimate.state === 'empty') return messages.empty;
  if (estimate.state === 'unknown') return messages.unknown;
  if (estimate.at < new Date()) return messages.update;
  return `${messages.estimated}: ${new Intl.DateTimeFormat(language,{ dateStyle: 'medium',timeZone: timezone }).format(estimate.at)}`;
}
export function SupplyRow({ item,messages,darkMode,language,timezone,pending,onLevel,onEdit,onHistory,onReplace }: {
  item: SupplyItem; messages: SuppliesMessages; darkMode: boolean; language: string; timezone: string; pending: boolean;
  onLevel: (level: number) => void; onEdit: () => void; onHistory: () => void; onReplace: () => void;
}) {
  const attention = needsAttention(item);
  const action = attention ? item.spares > 0 ? item.level === 0 ? messages.replace : messages.spareAvailable : item.level === 0 ? messages.buy : messages.buySoon : '';
  const estimate = depletion(item).state === 'unknown' ? '' : estimateText(item,messages,language,timezone);
  return <RecordCard darkMode={darkMode} title={`${item.title}${item.spares ? ` · +${item.spares}` : ''}`}
    description={item.note ?? undefined} support={[estimate,action].filter(Boolean).join(' · ') || undefined}
    action={<Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} title={messages.edit} aria-label={`${messages.edit}: ${item.title}`}
      icon={<PenLine size={16} />} onClick={onEdit} />}>
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--aa-space-control-gap)]">
      <StockLevelControl darkMode={darkMode} value={item.level} disabled={pending} label={`${messages.level}: ${item.title}`} onChange={onLevel} />
      <div className="flex gap-[var(--aa-space-control-gap)]">
        <Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} title={messages.replace} aria-label={`${messages.replace}: ${item.title}`}
          icon={<RotateCcw size={16} />} onClick={onReplace} />
        <Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} title={messages.history} aria-label={`${messages.history}: ${item.title}`}
          icon={<History size={16} />} onClick={onHistory} />
      </div>
    </div>
  </RecordCard>;
}
export function WishRow({ item,linked,messages,darkMode,language,timezone,pending,onToggle,onEdit }: {
  item: WishItem; linked?: SupplyItem; messages: SuppliesMessages; darkMode: boolean; language: string; timezone: string; pending: boolean;
  onToggle: () => void; onEdit: () => void;
}) {
  void language; void timezone;
  return <RecordCard darkMode={darkMode} title={item.title} description={item.note ?? undefined}
    support={<>
      <Text as="span" size="sm" tone="secondary" truncate>{[item.country,item.shop,item.status === 'purchased' ? messages.purchased : ''].filter(Boolean).join(' · ')}</Text>
      {linked ? <Text as="span" size="sm" tone="secondary" truncate>{linked.title} · {linked.level}/5{linked.spares ? ` · +${linked.spares}` : ''}</Text>
        : item.linkedSupplyId ? <Text as="span" size="sm" tone="secondary" truncate>{item.linkedTitle} · {messages.archived}</Text> : null}
    </>}
    action={<>
      <Button darkMode={darkMode} tone="ghost" size="icon" aria-pressed={item.status === 'purchased'} disabled={pending}
        title={item.status === 'planned' ? messages.markPurchased : messages.markPlanned} aria-label={`${item.status === 'planned' ? messages.markPurchased : messages.markPlanned}: ${item.title}`}
        icon={<Check size={16} />} onClick={onToggle} />
      {item.url ? <Button darkMode={darkMode} tone="ghost" size="icon" title={messages.openLink} aria-label={`${messages.openLink}: ${item.title}`}
        icon={<ExternalLink size={16} />} onClick={() => window.open(item.url!, '_blank','noopener,noreferrer')} /> : null}
      <Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} title={messages.edit} aria-label={`${messages.edit}: ${item.title}`}
        icon={<PenLine size={16} />} onClick={onEdit} />
    </>} />;
}
