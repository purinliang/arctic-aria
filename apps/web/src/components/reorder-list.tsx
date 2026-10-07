import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { Button } from './button';
import { ManagerList, ManagerListRow } from './manager-list';
import type { ManagerListMessages } from './manager-list';

export function moveItem(values: string[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= values.length || to >= values.length) return values;
  const next = [...values];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
export function ReorderList({ values, label, onChange, darkMode, disabled, messages, upLabel, downLabel, dragLabel }: {
  values: string[]; label: (value: string) => string; onChange: (values: string[]) => void;
  darkMode: boolean; disabled: boolean; messages: ManagerListMessages;
  upLabel: string; downLabel: string; dragLabel: string;
}) {
  return <ManagerList darkMode={darkMode} items={values} getItemKey={(value) => value} emptyText="" messages={messages}
    renderItem={(value) => {
      const index = values.indexOf(value);
      return <div onDragOver={(event) => { if (!disabled) event.preventDefault(); }}
        onDrop={(event) => {
          event.preventDefault();
          const source = values.indexOf(event.dataTransfer.getData('text/plain'));
          if (!disabled) onChange(moveItem(values, source, index));
        }}>
        <ManagerListRow darkMode={darkMode} title={label(value)} action={<>
          <Button darkMode={darkMode} tone="ghost" size="icon" disabled={disabled} draggable={!disabled}
            aria-label={`${dragLabel}: ${label(value)}`} title={dragLabel} icon={<GripVertical size={16} />}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', value)} />
          <Button darkMode={darkMode} tone="ghost" size="icon" disabled={disabled || index === 0}
            aria-label={`${upLabel}: ${label(value)}`} title={upLabel} icon={<ArrowUp size={16} />}
            onClick={() => onChange(moveItem(values, index, index - 1))} />
          <Button darkMode={darkMode} tone="ghost" size="icon" disabled={disabled || index === values.length - 1}
            aria-label={`${downLabel}: ${label(value)}`} title={downLabel} icon={<ArrowDown size={16} />}
            onClick={() => onChange(moveItem(values, index, index + 1))} />
        </>} />
      </div>;
    }} />;
}
