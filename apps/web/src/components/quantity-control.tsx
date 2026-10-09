import { Minus, Plus } from 'lucide-react';
import { Button } from './button';
import { Text } from './text';
import { cx } from './utils';

export function QuantityControl({ darkMode,value,disabled,decreaseDisabled,increaseDisabled,label,decreaseLabel,increaseLabel,onChange }: {
  darkMode: boolean; value: string; disabled: boolean; decreaseDisabled: boolean; increaseDisabled: boolean;
  label: string; decreaseLabel: string; increaseLabel: string; onChange: (direction: -1 | 1) => void;
}) {
  return <div role="group" aria-label={label} className="inline-flex shrink-0 items-center gap-[var(--aa-space-control-gap)]">
    <Button darkMode={darkMode} tone="secondary" size="icon" disabled={disabled || decreaseDisabled}
      title={decreaseLabel} aria-label={decreaseLabel} icon={<Minus size={16} />} onClick={() => onChange(-1)} />
    <Text weight="medium" className="min-w-10 text-center tabular-nums" aria-live="polite">{value}</Text>
    <Button darkMode={darkMode} tone="secondary" size="icon" disabled={disabled || increaseDisabled}
      title={increaseLabel} aria-label={increaseLabel} icon={<Plus size={16} />} onClick={() => onChange(1)} />
  </div>;
}

export function QuantityProgress({ value,target,increment,warning,label }: {
  value: number; target: number; increment: number; warning: boolean; label: string;
}) {
  const steps = target / increment;
  const segmented = Number.isInteger(steps) && steps >= 2 && steps <= 20 && Number.isInteger(value / increment);
  const fill = warning ? 'bg-amber-500' : 'bg-[var(--blue-9)]';
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Math.max(target,value)} aria-valuenow={value}
    aria-valuetext={label} className={cx('flex h-2.5 w-full overflow-hidden rounded-sm',segmented ? 'gap-1' : 'bg-[var(--aa-secondary-button-bg)]')}>
    {segmented ? Array.from({ length: steps },(_,index) => <span key={index} className={cx('h-full min-w-0 flex-1 rounded-sm',
      index < value / increment ? fill : 'bg-[var(--aa-secondary-button-bg)]')} />)
      : <span className={cx('h-full transition-[width]',fill)} style={{ width: `${Math.min(100,value / target * 100)}%` }} />}
  </div>;
}
