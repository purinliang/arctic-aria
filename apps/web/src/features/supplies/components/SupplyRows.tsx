// Supplies Page - Stock And Travel Rows.
import { Check, ExternalLink, PenLine } from 'lucide-react';
import { Button } from '@/components/button';
import { QuantityControl, QuantityProgress } from '@/components/quantity-control';
import { RecordCard } from '@/components/record-card';
import { Text } from '@/components/text';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import type { SupplyItem, WishItem } from '../types';
import { depletion, needsAttention, stockQuantity, adjustedQuantity } from '../supplies';

export function estimateText(item: SupplyItem,messages: SuppliesMessages,language: string,timezone: string) {
  const estimate = depletion(item);
  if (estimate.state === 'empty') return messages.empty;
  if (estimate.state === 'unknown') return messages.unknown;
  if (estimate.at < new Date()) return messages.update;
  return `${messages.estimated}: ${new Intl.DateTimeFormat(language,{ dateStyle: 'medium',timeZone: timezone }).format(estimate.at)}`;
}
export function SupplyRow({ item,messages,darkMode,language,pending,onAdjust,onEdit }: {
  item: SupplyItem; messages: SuppliesMessages; darkMode: boolean; language: string; pending: boolean;
  onAdjust: (direction: -1 | 1) => void; onEdit: () => void;
}) {
  const attention = needsAttention(item);
  const stock = stockQuantity(item);
  const number = (value: number) => new Intl.NumberFormat(language,{ maximumFractionDigits: 3 }).format(value);
  const unit = stock.unit === 'unit' ? messages.defaultUnit : stock.unit;
  const remaining = `${number(stock.quantity)} ${unit} · ${messages.remaining}`;
  return <RecordCard darkMode={darkMode} title={<Button darkMode={darkMode} tone="ghost" size="text" disabled={pending}
    className="min-w-0 max-w-full whitespace-normal break-words text-left" onClick={onEdit}>{item.title}</Button>}
    value={attention ? <span className={darkMode ? 'text-amber-400' : 'text-amber-700'}>{messages.restock}</span> : `${number(stock.quantity)} / ${number(stock.targetQuantity)} ${unit}`}
    action={<Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} title={messages.edit} aria-label={`${messages.edit}: ${item.title}`}
      icon={<PenLine size={16} />} onClick={onEdit} />}>
    <QuantityProgress value={stock.quantity} target={stock.targetQuantity} increment={stock.increment} warning={attention} label={`${item.title}: ${remaining}`} />
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--aa-space-control-gap)]">
      <Text size="sm" tone="secondary" className="min-w-0 break-words">{remaining}</Text>
      <QuantityControl darkMode={darkMode} value={number(stock.quantity)} label={`${messages.quantity}: ${item.title}`}
        disabled={pending} decreaseDisabled={stock.quantity === 0} increaseDisabled={adjustedQuantity(stock,1) > 999999.999}
        decreaseLabel={`${messages.decrease}: ${item.title}`} increaseLabel={`${messages.increase}: ${item.title}`} onChange={onAdjust} />
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
      {linked ? <Text as="span" size="sm" tone="secondary" truncate>{linked.title} · {stockQuantity(linked).quantity} {stockQuantity(linked).unit}</Text>
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
