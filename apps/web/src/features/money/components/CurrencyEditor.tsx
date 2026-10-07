// Money Page - Currency Preferences.
import { useState } from 'react';
import { CrudEditorDialog } from '@/components/dialog';
import { MultipleChoiceGroup } from '@/components/forms/choice-group';
import { ReorderList } from '@/components/reorder-list';
import { FieldLabel } from '@/components/forms/input-field';
import { currencies } from '../types';
import type { Currency, MoneySettings } from '../types';
import type { MoneyMessages } from '@/messages/money-messages';

export function CurrencyEditor({ settings, messages, darkMode, onSave, onClose }: {
  settings: MoneySettings; messages: MoneyMessages; darkMode: boolean;
  onSave: (settings: MoneySettings) => Promise<boolean>; onClose: () => void;
}) {
  const [preferred, setPreferred] = useState<Currency[]>(settings.preferredCurrencies), [pending, setPending] = useState(false);
  return <CrudEditorDialog zIndex="z-[60]" darkMode={darkMode} title={messages.currencies} closeLabel={messages.close}
    pending={pending || preferred.length === 0} saving={pending} saveText={messages.save} savingText={messages.saving}
    onClose={() => { if (!pending) onClose(); }} onSubmit={() => {
      if (!preferred.length || pending) return;
      setPending(true); void onSave({ ...settings, preferredCurrencies: preferred }).then((saved) => { if (saved) onClose(); }).finally(() => setPending(false));
    }}>
    <FieldLabel darkMode={darkMode} label={messages.preferred}><MultipleChoiceGroup darkMode={darkMode} disabled={pending}
      options={currencies.map((value) => ({ value, label: value }))} values={preferred} onChange={(values) => setPreferred(values as Currency[])} /></FieldLabel>
    <ReorderList darkMode={darkMode} values={preferred} disabled={pending} messages={messages.pagination}
      label={(value) => value === preferred[0] ? `${value} · ${messages.defaultCurrency}` : value}
      upLabel={messages.up} downLabel={messages.down} dragLabel={messages.drag} onChange={(values) => setPreferred(values as Currency[])} />
  </CrudEditorDialog>;
}
