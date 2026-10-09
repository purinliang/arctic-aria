import type { ReactNode } from 'react';
import { Text } from './text';
import { popoverPaddingClass, bodyStackClass } from './spacing';
import { cx } from './utils';

export function SystemNotice({ text, children }: { text: string; children?: ReactNode }) {
  return <div role="alert" className={cx('justify-items-start rounded-md border border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-hover-bg)]', popoverPaddingClass, bodyStackClass)}>
    <Text as="p" size="sm" tone="secondary">{text}</Text>
    {children}
  </div>;
}
