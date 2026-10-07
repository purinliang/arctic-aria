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
      'grid min-w-0 rounded-md border text-left transition disabled:cursor-not-allowed',
      supporting ? 'min-h-28 content-start' : 'min-h-20 content-center',
      cardBodyPaddingClass, bodyStackClass, buttonToneClass('secondary', false), className,
    )}>
      <span className="flex min-w-0 flex-col items-start gap-[var(--aa-space-control-gap)] sm:flex-row sm:items-center">
        <span className="shrink-0">{icon}</span>
        <Text size="lg" weight="semibold" tone="current" className="min-w-0 break-words">{label}</Text>
      </span>
      {supporting ? <Text size="sm" tone="secondary" className="min-w-0" aria-live="polite">{supporting}</Text> : null}
    </button>
  );
}
