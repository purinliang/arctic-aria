// Supplies Page - Stock And Travel Rows.
import { Check, ExternalLink, PenLine } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/button';
import { QuantityProgress } from '@/components/quantity-control';
import { StockLevelSlider } from '@/components/stock-level-slider';
import { RecordCard } from '@/components/record-card';
import { Text } from '@/components/text';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import type { SupplyItem, WishItem } from '../types';
import { depletion, needsAttention, stockQuantity } from '../supplies';
import { isLevelStock } from '../stock-level';

export function estimateText(item: SupplyItem,messages: SuppliesMessages,language: string,timezone: string) {
  const estimate = depletion(item);
  if (estimate.state === 'empty') return messages.empty;
  if (estimate.state === 'unknown') return messages.unknown;
  if (estimate.at < new Date()) return messages.update;
  return `${messages.estimated}: ${new Intl.DateTimeFormat(language,{ dateStyle: 'medium',timeZone: timezone }).format(estimate.at)}`;
}
export function SupplyRow({ item,messages,darkMode,language,pending,onLevel,onEdit,onInteractionChange }: {
  item: SupplyItem; messages: SuppliesMessages; darkMode: boolean; language: string; pending: boolean;
  onLevel: (level: number) => void; onEdit: () => void;
  onInteractionChange: (active: boolean) => void;
}) {
  const stock = stockQuantity(item);
  const [preview,setPreview] = useState<{ version: number; level: number } | null>(null);
  const level = preview?.version === item.version ? preview.level : stock.quantity;
  const scaled = isLevelStock(item);
  const number = (value: number) => new Intl.NumberFormat(language,{ maximumFractionDigits: 3 }).format(value);
  const unit = stock.unit === 'unit' ? messages.defaultUnit : stock.unit;
  return <RecordCard density="compact" darkMode={darkMode} title={<Button darkMode={darkMode} tone="ghost" size="text" disabled={pending}
    title={`${item.title} · ${messages.tabs[item.kind]}`} className="min-w-0 max-w-full whitespace-normal break-words text-left" onClick={onEdit}>{item.title}</Button>}
    value={scaled ? `${level}/5` : `${number(stock.quantity)} ${unit}`}
    action={<Button darkMode={darkMode} tone="ghost" size="icon" disabled={pending} title={messages.edit} aria-label={`${messages.edit}: ${item.title}`}
      icon={<PenLine size={16} />} onClick={onEdit} />}>
    {scaled ? <StockLevelSlider value={level} label={`${messages.level}: ${item.title}`} valueText={`${level}/5 · ${messages.levelNames[level]}`} disabled={pending} onInteractionChange={onInteractionChange}
      onPreview={(level) => setPreview({ version: item.version,level })}
      onCommit={(level) => { setPreview(null); onLevel(level); }} />
      : <div title={messages.legacyQuantity} className="py-[var(--aa-space-tag-y)]"><QuantityProgress value={stock.quantity} target={stock.targetQuantity}
        increment={stock.increment} warning={needsAttention(item)} label={`${item.title}: ${number(stock.quantity)} ${unit}`} /></div>}
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
