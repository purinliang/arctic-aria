"use client";

import { useEffect, useState } from 'react';
import { PenLine } from 'lucide-react';
import { ActionCard } from '@/components/action-card';
import { Button } from '@/components/button';
import { ContentSection } from '@/components/content-section';
import { PagedList } from '@/components/paged-list';
import { RecordCard } from '@/components/record-card';
import { sectionStackClass } from '@/components/spacing';
import type { FormMessages } from '@/messages/app-messages';
import type { SupportedLanguage } from '@/messages/languages';
import type { TimeFormatPreference } from '@/features/settings/preferences';
import { lifeActivities } from '../types';
import type { LifeActivity, LifeEntry } from '../types';
import { entriesForDay, lifeWeek } from '../life-calendar';
import { useDailyLife } from '../hooks/useDailyLife';
import type { LifeActionOptions } from '../hooks/useLifeAction';
import { ActivityIcon } from './ActivityIcon';
import { LifeEntryEditor } from './LifeEntryEditor';
import { DurationChart, shortDay } from './DurationChart';

export function DailyLifePage({ userId, darkMode, timezone, language, formMessages, timeFormatPreference, ...options }: LifeActionOptions & {
  userId: string; darkMode: boolean; timezone: string; language: SupportedLanguage;
  formMessages: FormMessages; timeFormatPreference: TimeFormatPreference;
}) {
  const { messages } = options;
  const [now, setNow] = useState(() => new Date());
  const [draft, setDraft] = useState<{ entry: LifeEntry; isNew: boolean } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const days = lifeWeek(now, timezone);
  const selectedDay = selected && days.includes(selected) ? selected : days[0];
  const life = useDailyLife({ ...options, userId, dayKey: days[0], timezone });
  const records = entriesForDay(life.entries, selectedDay, timezone);
  const timeFormatter = new Intl.DateTimeFormat(language, { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: timeFormatPreference === '12h' });

  function startRecord(activity: LifeActivity) {
    setDraft({ isNew: true, entry: { id: crypto.randomUUID(), activity, occurredAt: new Date().toISOString(), note: null, durationMinutes: 0 } });
  }

  return <div className={sectionStackClass}>
    <ContentSection darkMode={darkMode} title={messages.record}>
      <div className="grid grid-cols-3 gap-[var(--aa-space-control-gap)]">
        {lifeActivities.map((activity) => <ActionCard key={activity} label={messages.activities[activity]}
          aria-label={messages.activities[activity]} icon={<ActivityIcon activity={activity} size={22} />}
          supporting={null} disabled={life.loading} onClick={() => startRecord(activity)} />)}
      </div>
    </ContentSection>

    <DurationChart entries={life.entries} days={days} timezone={timezone} language={language} darkMode={darkMode}
      messages={messages} selectedDay={selectedDay} onSelectDay={setSelected} loading={life.loading} />

    <ContentSection darkMode={darkMode} title={`${messages.entries} · ${selectedDay === days[0] ? messages.today : shortDay(selectedDay, language)}`}>
      <PagedList darkMode={darkMode} items={records} pageSize={6} resetKey={`${selectedDay}:${records[0]?.id}`}
        layout="cards" loading={life.loading} loadingText={messages.loading} emptyText={messages.empty}
        messages={messages.pagination} ariaLabel={messages.pagination.ariaLabel}
        renderItem={(entry) => <RecordCard key={entry.id} darkMode={darkMode} title={messages.activities[entry.activity]}
          description={entry.note ?? undefined} support={`${messages.minutes(entry.durationMinutes)} · ${timeFormatter.format(new Date(entry.occurredAt))}`}
          action={<Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.edit}: ${messages.activities[entry.activity]}`}
            title={messages.edit} icon={<PenLine size={16} aria-hidden="true" />}
            onClick={() => setDraft({ entry, isNew: false })} />} />} />
    </ContentSection>

    {draft ? <LifeEntryEditor key={`${draft.entry.id}:${timezone}`} entry={draft.entry} isNew={draft.isNew} darkMode={darkMode}
      timezone={timezone} messages={messages} formMessages={formMessages} timeFormatPreference={timeFormatPreference}
      onSave={async (input) => {
        const saved = await life.save(input);
        if (saved && draft.isNew) setSelected(null);
        return saved;
      }} onDelete={life.remove} onClose={() => setDraft(null)}
      showErrorNotification={options.showErrorNotification} /> : null}
  </div>;
}
