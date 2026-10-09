import { Plus } from 'lucide-react';
import { Button } from './button';
import { Text } from './text';
import { compactListItemPaddingClass } from './spacing';
import { cx } from './utils';

export function CreateCard({ darkMode,label,disabled,onClick }: {
  darkMode: boolean; label: string; disabled?: boolean; onClick: () => void;
}) {
  return <Button darkMode={darkMode} tone="ghost" disabled={disabled} onClick={onClick}
    className={cx('h-full min-h-20 w-full flex-col border border-dashed border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-bg)]',compactListItemPaddingClass)}>
    <Plus size={20} aria-hidden="true" />
    <Text size="sm" tone="current">{label}</Text>
  </Button>;
}
