"use client";

// Daily Page.
import { useEffect, useState } from 'react';
import { PenLine, RefreshCw } from 'lucide-react';
import { ActionCard } from '@/components/action-card';
import { Button } from '@/components/button';
import { ContentSection, ContentSubsection } from '@/components/content-section';
import { PagedList } from '@/components/paged-list';
import { ListItem, ListItemContent, ListItemTitle, ListItemSupportingText } from '@/components/list';
import { PendingText } from '@/components/loading';
import { DescriptionText } from '@/components/text';
import { sectionStackClass } from '@/components/spacing';
import { formatDateKey } from '@/components/forms/date-format';
import type { FormMessages } from '@/messages/app-messages';
import type { SupportedLanguage } from '@/messages/languages';
import type { TimeFormatPreference } from '@/features/settings/preferences';
import { lifeActivities } from '../types';
import type { LifeEntry } from '../types';
import { entriesForDay, lifeWeek } from '../life-calendar';
import { useDailyLife } from '../hooks/useDailyLife';
import type { LifeActionOptions } from '../hooks/useLifeAction';
import { ActivityIcon } from './ActivityIcon';
import { LifeEntryEditor } from './LifeEntryEditor';
import { LifeChatPanel } from './LifeChatPanel';

export function DailyLifePage({ darkMode, timezone, language, formMessages, timeFormatPreference, ...options }: LifeActionOptions & {
  darkMode: boolean; timezone: string; language: SupportedLanguage;
  formMessages: FormMessages; timeFormatPreference: TimeFormatPreference;
}) {
  const { messages } = options;
  const [now, setNow] = useState(() => new Date());
  const [draft, setDraft] = useState<LifeEntry | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const days = lifeWeek(now, timezone);
  const life = useDailyLife({ ...options, dayKey: days[0], timezone });
  const today = entriesForDay(life.entries, days[0], timezone);
  const timeFormatter = new Intl.DateTimeFormat(language, { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: timeFormatPreference === '12h' });
  const formatTime = (value: string) => timeFormatter.format(new Date(value));
  const formatTimestamp = (value: string) => new Intl.DateTimeFormat(language, { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short', hour12: timeFormatPreference === '12h' }).format(new Date(value));

  return (
    <div className={sectionStackClass}>
      <ContentSection darkMode={darkMode} title={messages.record}>
        <div className="grid grid-cols-2 gap-[var(--aa-space-control-gap)] sm:grid-cols-4">
          {lifeActivities.map((activity) => {
            const entries = today.filter((entry) => entry.activity === activity);
            const pending = life.pendingKinds.includes(activity);
            return <ActionCard key={activity} label={messages.activities[activity]}
              aria-label={messages.activities[activity]} icon={<ActivityIcon activity={activity} size={22} />}
              disabled={pending || life.loading} onClick={() => void life.capture(activity)}
              supporting={<PendingText active={pending} pendingText={messages.recording}
                idleText={`${messages.countToday(entries.length)}${entries[0] ? ` · ${formatTime(entries[0].occurredAt)}` : ''}`} />} />;
          })}
        </div>
      </ContentSection>

      <LifeChatPanel key={timezone} darkMode={darkMode} {...options} formatTimestamp={formatTimestamp} />

      <ContentSection darkMode={darkMode} title={messages.title} description={messages.description}
        action={<Button darkMode={darkMode} tone="ghost" size="icon" aria-label={messages.retry} title={messages.retry}
          disabled={life.loading || life.pendingKinds.length > 0} icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={() => void life.refresh()} />}>
        {days.map((day, index) => <ContentSubsection key={day} darkMode={darkMode}
          title={index === 0 ? messages.today : index === 1 ? messages.yesterday : formatDateKey(day, formMessages.datePicker, day)}
          description={index < 2 ? formatDateKey(day, formMessages.datePicker, day) : undefined}>
          <PagedList darkMode={darkMode} items={entriesForDay(life.entries, day, timezone)} pageSize={6}
            resetKey={entriesForDay(life.entries, day, timezone)[0]?.id}
            loading={life.loading && index === 0} loadingText={messages.loading} emptyText={messages.empty}
            messages={messages.pagination} ariaLabel={`${messages.pagination.ariaLabel}: ${day}`}
            renderItem={(entry) => <ListItem key={entry.id} darkMode={darkMode}>
              <ListItemContent title={<div className="flex items-center gap-[var(--aa-space-control-gap)]">
                <ActivityIcon activity={entry.activity} /><ListItemTitle>{messages.activities[entry.activity]}</ListItemTitle>
              </div>} main={entry.note ? <DescriptionText darkMode={darkMode} className="break-words [overflow-wrap:anywhere]">{entry.note}</DescriptionText> : undefined}
                support={<ListItemSupportingText>{formatTime(entry.occurredAt)}</ListItemSupportingText>} />
              <Button darkMode={darkMode} tone="ghost" size="icon" aria-label={`${messages.edit}: ${messages.activities[entry.activity]}`}
                title={messages.edit} disabled={entry.id.startsWith('pending-')}
                icon={<PenLine size={16} aria-hidden="true" />} onClick={() => setDraft(entry)} />
            </ListItem>} />
        </ContentSubsection>)}
      </ContentSection>

      {draft ? <LifeEntryEditor key={`${draft.id}:${timezone}`} entry={draft} darkMode={darkMode}
        timezone={timezone} messages={messages} formMessages={formMessages} timeFormatPreference={timeFormatPreference}
        onSave={life.save} onDelete={life.remove} onClose={() => setDraft(null)}
        showErrorNotification={options.showErrorNotification} /> : null}
    </div>
  );
}
