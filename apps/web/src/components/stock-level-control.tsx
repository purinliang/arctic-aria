import { Circle, CircleOff } from 'lucide-react';
import { Button } from './button';
import { controlGapClass } from './spacing';
import { cx } from './utils';

export function StockLevelControl({ value, onChange, disabled, darkMode, label }: {
  value: number; onChange: (level: number) => void; disabled: boolean; darkMode: boolean; label: string;
}) {
  return <div className={cx('flex shrink-0',controlGapClass)} role="radiogroup" aria-label={label}>
    {Array.from({ length: 6 },(_,level) => <Button key={level} darkMode={darkMode} tone="ghost" size="icon" role="radio"
      aria-checked={level === value} aria-label={`${label}: ${level}/5`} title={`${level}/5`} disabled={disabled}
      onClick={() => onChange(level)} icon={level === 0 ? <CircleOff size={16} /> : <Circle size={16} fill={level <= value ? 'currentColor' : 'none'} />} />)}
  </div>;
}
