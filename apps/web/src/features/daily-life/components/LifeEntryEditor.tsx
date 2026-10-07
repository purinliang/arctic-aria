// Daily Page - Entry Editor.
import { useState } from 'react';
import { CrudEditorDialog, ConfirmDialog } from '@/components/dialog';
import { FieldLabel, TextInput } from '@/components/forms/input-field';
import { TextArea } from '@/components/forms/text-area-field';
import { DatePickerField } from '@/components/forms/date-picker-field';
import { TimePickerField } from '@/components/forms/time-picker-field';
import { FormGrid } from '@/components/forms/form-layout';
import { SingleChoiceGroup } from '@/components/forms/choice-group';
import { localDateTimeParts, zonedDateTimeToUtcDate } from '@/features/settings/time-zones';
import type { TimeFormatPreference } from '@/features/settings/preferences';
import type { FormMessages } from '@/messages/app-messages';
import type { DailyLifeMessages } from '@/messages/daily-life-messages';
import { lifeActivities } from '../types';
import type { LifeEntry, LifeInput, LifeActivity } from '../types';
import { ActivityIcon } from './ActivityIcon';

export function LifeEntryEditor({ entry, isNew = false, timezone, darkMode, messages, formMessages, timeFormatPreference, onSave, onDelete, onClose, showErrorNotification }: {
  entry: LifeEntry; timezone: string; darkMode: boolean; messages: DailyLifeMessages;
  isNew?: boolean;
  formMessages: FormMessages; timeFormatPreference: TimeFormatPreference;
  onSave: (input: LifeInput) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>;
  onClose: () => void; showErrorNotification: (message: string, title?: string) => void;
}) {
  const original = localDateTimeParts(new Date(entry.occurredAt), timezone)!;
  const originalTime = `${String(original.hour).padStart(2, '0')}:${String(original.minute).padStart(2, '0')}`;
  const [date, setDate] = useState(original.dateKey);
  const [time, setTime] = useState(originalTime);
  const [note, setNote] = useState(entry.note ?? '');
  const [activity, setActivity] = useState(entry.activity);
  const [duration, setDuration] = useState(isNew ? '' : String(entry.durationMinutes));
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function submit() {
    if (pending) return;
    const durationMinutes = Number(duration);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
      showErrorNotification(messages.results.life_duration_invalid); return;
    }
    const instant = zonedDateTimeToUtcDate({ dateKey: date, time, timeZone: timezone });
    const roundTrip = instant && localDateTimeParts(instant, timezone);
    if (!instant || !roundTrip || roundTrip.dateKey !== date || `${String(roundTrip.hour).padStart(2, '0')}:${String(roundTrip.minute).padStart(2, '0')}` !== time) {
      showErrorNotification(messages.results.life_time_invalid); return;
    }
    setPending(true);
    try {
      const saved = await onSave({ id: isNew ? undefined : entry.id, captureKey: entry.id, activity, note, durationMinutes,
        occurredAt: date === original.dateKey && time === originalTime ? entry.occurredAt : instant.toISOString() });
      if (saved) onClose();
    } finally { setPending(false); }
  }

  async function remove() {
    if (pending) return;
    setPending(true);
    try { if (await onDelete(entry.id)) onClose(); }
    finally { setPending(false); }
  }

  return <>
    <CrudEditorDialog darkMode={darkMode} pending={pending} saving={pending && !confirm}
      title={isNew ? `${messages.addTitle} · ${messages.activities[entry.activity]}` : messages.editorTitle} closeLabel={messages.close} saveText={messages.save}
      savingText={messages.saving} deleteText={messages.delete}
      onClose={() => { if (!pending) onClose(); }} onSubmit={() => void submit()} onDelete={isNew ? undefined : () => setConfirm(true)}>
      {!isNew ? <FieldLabel darkMode={darkMode} label={messages.activity}>
        <SingleChoiceGroup darkMode={darkMode} value={activity} disabled={pending}
          onChange={(value) => setActivity(value as LifeActivity)}
          options={lifeActivities.map((value) => ({ value, label: messages.activities[value], icon: <ActivityIcon activity={value} /> }))} />
      </FieldLabel> : null}
      <FieldLabel darkMode={darkMode} label={messages.duration}>
        <TextInput darkMode={darkMode} type="number" inputMode="numeric" min={1} max={1440} step={1}
          value={duration} aria-label={messages.duration} disabled={pending}
          onChange={(event) => setDuration(event.target.value)} autoFocus={isNew} />
      </FieldLabel>
      <FormGrid columns={2}>
        <FieldLabel darkMode={darkMode} label={messages.date}>
          <DatePickerField darkMode={darkMode} value={date} onChange={setDate} disabled={pending}
            allowClear={false} messages={formMessages.datePicker} />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.time}>
          <TimePickerField darkMode={darkMode} value={time} onChange={setTime} disabled={pending}
            allowClear={false} messages={formMessages.timePicker} timeFormatPreference={timeFormatPreference} />
        </FieldLabel>
      </FormGrid>
      <FieldLabel darkMode={darkMode} label={messages.note}>
        <TextArea darkMode={darkMode} value={note} maxLength={500} disabled={pending} aria-label={messages.note}
          placeholder={messages.notePlaceholder} onChange={(event) => setNote(event.target.value)} />
      </FieldLabel>
    </CrudEditorDialog>
    {confirm ? <ConfirmDialog darkMode={darkMode} pending={pending} title={messages.deleteTitle}
      description={messages.deleteDescription} cancelText={messages.cancel} confirmText={messages.delete}
      pendingConfirmText={messages.deleting} closeLabel={messages.close}
      onCancel={() => { if (!pending) setConfirm(false); }} onConfirm={() => void remove()} /> : null}
  </>;
}
