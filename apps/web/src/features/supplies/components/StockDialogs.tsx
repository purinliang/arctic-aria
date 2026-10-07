// Supplies Page - Replacement And History Dialogs.
import { useEffect, useState } from 'react';
import { CrudEditorDialog, DialogOverlay, DialogFrame, DialogHeader } from '@/components/dialog';
import { CheckboxField } from '@/components/forms/selection-field';
import { DescriptionText } from '@/components/text';
import { ManagerList, ManagerListRow } from '@/components/manager-list';
import { LoadingLine } from '@/components/loading';
import type { SuppliesMessages } from '@/messages/supplies-messages';
import type { Observation, SupplyItem } from '../types';

export function ReplaceDialog({ item,messages,darkMode,onReplace,onClose }: {
  item: SupplyItem; messages: SuppliesMessages; darkMode: boolean; onReplace: (useSpare: boolean) => Promise<boolean>; onClose: () => void;
}) {
  const [useSpare,setUseSpare] = useState(item.spares > 0), [pending,setPending] = useState(false);
  return <CrudEditorDialog darkMode={darkMode} title={messages.replaceTitle} closeLabel={messages.close} pending={pending} saving={pending}
    saveText={messages.replace} savingText={messages.saving} onClose={() => { if (!pending) onClose(); }} onSubmit={() => {
      if (pending) return;
      setPending(true); void onReplace(useSpare).then((saved) => { if (saved) onClose(); }).finally(() => setPending(false));
    }}>
    <DescriptionText darkMode={darkMode}>{messages.replaceDescription}</DescriptionText>
    {item.spares > 0 ? <CheckboxField darkMode={darkMode} label={`${messages.useSpare} (+${item.spares})`} checked={useSpare}
      disabled={pending} onChange={(event) => setUseSpare(event.target.checked)} /> : null}
  </CrudEditorDialog>;
}
export function HistoryDialog({ item,messages,darkMode,language,timezone,onLoad,onClose }: {
  item: SupplyItem; messages: SuppliesMessages; darkMode: boolean; language: string; timezone: string;
  onLoad: (id: string) => Promise<Observation[] | null>; onClose: () => void;
}) {
  const [history,setHistory] = useState<Observation[] | null>(null);
  useEffect(() => {
    let active = true;
    void onLoad(item.id).then((rows) => { if (active) setHistory(rows ?? []); });
    return () => { active = false; };
  },[item.id,onLoad]);
  const formatter = new Intl.DateTimeFormat(language,{ dateStyle: 'medium',timeStyle: 'short',timeZone: timezone });
  return <DialogOverlay><DialogFrame darkMode={darkMode}><DialogHeader darkMode={darkMode} title={`${messages.history} · ${item.title}`}
    closeLabel={messages.close} onClose={onClose} />
    {history === null ? <LoadingLine darkMode={darkMode} text={messages.loading} /> : <ManagerList darkMode={darkMode} items={history}
      getItemKey={(point) => point.id} messages={messages.pagination} emptyText={messages.noItems}
      renderItem={(point) => <ManagerListRow darkMode={darkMode} title={`${point.level}/5 · ${formatter.format(new Date(point.recordedAt))}`}
        support={point.cycleId === item.cycleId ? messages.currentCycle : messages.previousCycle} />} />}
  </DialogFrame></DialogOverlay>;
}
