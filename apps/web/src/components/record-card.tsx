import type { ReactNode } from 'react';
import { Card } from './card';
import { Text, TextStack } from './text';
import { bodyStackClass, cardBodyPaddingClass, compactListItemPaddingClass, inlineGapClass } from './spacing';
import { cx } from './utils';

export function RecordCard({ darkMode,title,description,support,value,action,children,density = 'normal' }: {
  darkMode: boolean; title: ReactNode; description?: ReactNode; support?: ReactNode;
  value?: ReactNode; action?: ReactNode; children?: ReactNode;
  density?: 'normal' | 'compact';
}) {
  return <Card darkMode={darkMode} className={cx('min-w-0 transition-colors hover:bg-[var(--aa-panel-hover-bg)]',density === 'compact' ? compactListItemPaddingClass : cardBodyPaddingClass, density === 'compact' ? 'grid gap-[var(--aa-space-control-gap)]' : bodyStackClass)}>
    <div className={cx('flex min-w-0 items-start justify-between',inlineGapClass)}>
      <TextStack className="flex-1" title={title} titleProps={{ size: 'md',weight: 'semibold' }}
        description={description} descriptionProps={{ size: 'md',className: 'line-clamp-2 break-words [overflow-wrap:anywhere]' }}
        support={support} supportProps={{ size: 'sm',truncate: true }} />
      {action || value ? <div className="flex min-w-0 max-w-[50%] shrink-0 flex-wrap items-center justify-end gap-[var(--aa-space-control-gap)]">
        {value ? <Text weight="semibold" className="min-w-0 max-w-full break-words tabular-nums text-right [overflow-wrap:anywhere]">{value}</Text> : null}{action}
      </div> : null}
    </div>
    {children}
  </Card>;
}
