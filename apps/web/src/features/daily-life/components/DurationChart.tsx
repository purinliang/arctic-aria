import { Card, CardHeader } from '@/components/card';
import { LoadingLine } from '@/components/loading';
import { Text } from '@/components/text';
import { cardBodyPaddingClass } from '@/components/spacing';
import { cx } from '@/components/utils';
import type { DailyLifeMessages } from '@/messages/daily-life-messages';
import type { SupportedLanguage } from '@/messages/languages';
import { durationWeek } from '../life-calendar';
import { lifeActivities } from '../types';
import type { LifeEntry } from '../types';

const fills = { work: 'bg-[var(--blue-9)]', study: 'bg-amber-500', exercise: 'bg-emerald-500' };

export function shortDay(day: string, language: SupportedLanguage) {
  return new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}

export function DurationChart({ entries, days, timezone, language, darkMode, messages, selectedDay, onSelectDay, loading }: {
  entries: LifeEntry[]; days: string[]; timezone: string; language: SupportedLanguage;
  darkMode: boolean; messages: DailyLifeMessages; selectedDay: string;
  onSelectDay: (day: string) => void; loading: boolean;
}) {
  const week = durationWeek(entries, days, timezone);
  const maximum = Math.max(60, ...week.map((day) => day.total));
  return <Card darkMode={darkMode} className="min-w-0">
    <CardHeader darkMode={darkMode} title={messages.title} meta={messages.minuteUnit} />
    <div className={cx(cardBodyPaddingClass, 'grid gap-[var(--aa-space-body-gap)]')}>
      <div className="flex flex-wrap gap-[var(--aa-space-inline-gap)]">
        {lifeActivities.map((activity) => <span key={activity} className="inline-flex items-center gap-[var(--aa-space-icon-gap)]">
          <span className={cx('h-2 w-2 rounded-sm', fills[activity])} aria-hidden="true" />
          <Text size="sm" tone="secondary">{messages.activities[activity]}</Text>
        </span>)}
      </div>
      {loading ? <LoadingLine darkMode={darkMode} text={messages.loading} /> : null}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-[var(--aa-space-control-gap)]">
        <div className="flex h-32 flex-col justify-between self-center" aria-hidden="true">
          {[maximum,maximum / 2,0].map((value) => <Text key={value} size="xs" tone="secondary">{Math.round(value)}</Text>)}
        </div>
        <div className="grid grid-cols-7 gap-[var(--aa-space-control-gap)]" role="group" aria-label={messages.title}>
        {week.map(({ day, totals, total }) => {
          const label = day === days[0] ? messages.today : shortDay(day, language);
          const summary = lifeActivities.map((activity) => `${messages.activities[activity]}: ${messages.minutes(totals[activity])}`).join(', ');
          return <button key={day} type="button" aria-label={`${label}: ${summary}`} aria-pressed={day === selectedDay}
            disabled={loading} onClick={() => onSelectDay(day)}
            className="grid min-w-0 gap-[var(--aa-space-control-gap)] rounded-sm py-[var(--aa-space-tag-y)] transition-colors hover:bg-[var(--aa-secondary-button-hover-bg)] focus-visible:outline-2 focus-visible:outline-[var(--blue-9)] disabled:cursor-wait">
            <Text size="sm" tone="secondary" className="text-center">{total}</Text>
            <span className="flex h-32 w-full items-end justify-center border-b border-[var(--aa-secondary-button-border)]" aria-hidden="true">
              <span className="flex h-full w-full max-w-10 flex-col justify-end">
                {lifeActivities.map((activity) => <span key={activity} className={cx('block w-full', fills[activity])}
                  style={{ height: `${totals[activity] / maximum * 100}%` }} />)}
              </span>
            </span>
            <Text size="sm" weight={day === selectedDay ? 'semibold' : 'normal'} tone={day === selectedDay ? 'primary' : 'secondary'} className="text-center">{label}</Text>
          </button>;
        })}
        </div>
      </div>
    </div>
  </Card>;
}
