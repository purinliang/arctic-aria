import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Text } from './text';
import { buttonToneClass } from './button-tone';
import { cardBodyPaddingClass, bodyStackClass } from './spacing';
import { cx } from './utils';

export function ActionCard({ icon, label, supporting, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode; label: string; supporting: ReactNode;
}) {
  return (
    <button type="button" {...props} className={cx(
      'grid min-h-28 min-w-0 content-start rounded-md border text-left transition disabled:cursor-not-allowed',
      cardBodyPaddingClass, bodyStackClass, buttonToneClass('secondary', false), className,
    )}>
      <span className="flex min-w-0 items-center gap-[var(--aa-space-control-gap)]">
        <span className="shrink-0">{icon}</span>
        <Text size="lg" weight="semibold" tone="current">{label}</Text>
      </span>
      <Text size="sm" tone="secondary" className="min-w-0" aria-live="polite">{supporting}</Text>
    </button>
  );
}
