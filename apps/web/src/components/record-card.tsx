import type { ReactNode } from 'react';
import { Card } from './card';
import { TextStack } from './text';
import { bodyStackClass, cardBodyPaddingClass, inlineGapClass } from './spacing';
import { cx } from './utils';

export function RecordCard({ darkMode,title,description,support,action,children }: {
  darkMode: boolean; title: ReactNode; description?: ReactNode; support?: ReactNode;
  action?: ReactNode; children?: ReactNode;
}) {
  return <Card darkMode={darkMode} className={cx('min-w-0 transition-colors hover:bg-[var(--aa-panel-hover-bg)]',cardBodyPaddingClass,bodyStackClass)}>
    <div className={cx('grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start',inlineGapClass)}>
      <TextStack title={title} titleProps={{ size: 'md',weight: 'semibold' }}
        description={description} descriptionProps={{ size: 'md',className: 'line-clamp-2 break-words [overflow-wrap:anywhere]' }}
        support={support} supportProps={{ size: 'sm',truncate: true }} />
      {action ? <div className="flex shrink-0 items-center gap-[var(--aa-space-control-gap)]">{action}</div> : null}
    </div>
    {children}
  </Card>;
}
