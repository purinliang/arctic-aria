import { Text } from './text';
import { listRowPaddingClass } from './spacing';
import { cx } from './utils';

export function ChatMessage({ own, text }: {
  own?: boolean; text: string;
}) {
  return <div className={cx('flex min-w-0', own ? 'justify-end' : 'justify-start')}>
    <div className={cx('max-w-[75%] min-w-0 rounded-md [overflow-wrap:anywhere]', listRowPaddingClass,
      own ? 'bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)]'
        : 'bg-[var(--aa-chat-assistant-bg)] text-[var(--aa-chat-assistant-text)]')}>
      <Text as="p" size="lg" tone="current" className="whitespace-pre-wrap">{text}</Text>
    </div>
  </div>;
}
