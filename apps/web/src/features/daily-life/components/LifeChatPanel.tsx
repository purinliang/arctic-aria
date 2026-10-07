// Daily Page - Chat Panel.
import { useState } from 'react';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import { Panel } from '@/components/panel';
import { CardHeader } from '@/components/card';
import { Button } from '@/components/button';
import { TextArea } from '@/components/forms/text-area-field';
import { PagedList } from '@/components/paged-list';
import { ScrollArea } from '@/components/scroll-area';
import { ListItem } from '@/components/list';
import { Text, DescriptionText, SupportingText } from '@/components/text';
import { PendingText } from '@/components/loading';
import { cardBodyPaddingClass, bodyStackClass } from '@/components/spacing';
import { useLifeChat } from '../hooks/useLifeChat';
import type { LifeActionOptions } from '../hooks/useLifeAction';

export function LifeChatPanel({ darkMode, formatTimestamp, ...options }: LifeActionOptions & {
  darkMode: boolean; formatTimestamp: (value: string) => string;
}) {
  const { messages } = options;
  const chat = useLifeChat(options);
  const [message, setMessage] = useState('');
  async function submit() {
    if (!message.trim() || chat.pending) return;
    if (await chat.send(message)) setMessage('');
  }
  return (
    <Panel darkMode={darkMode}>
      <CardHeader darkMode={darkMode} title={messages.chat.title} description={messages.chat.description}
        icon={<MessageSquare size={18} aria-hidden="true" />}
        action={<Button darkMode={darkMode} tone="ghost" size="icon" aria-label={messages.retry}
          title={messages.retry} disabled={chat.loading || chat.pending} icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={() => void chat.refresh()} />} />
      <ScrollArea key={chat.turns[0]?.id} role="log" aria-label={messages.chat.pagination.ariaLabel}
        viewportStyle={{ maxHeight: '18rem' }} refreshKey={chat.turns.length}>
      <PagedList darkMode={darkMode} items={chat.turns} loading={chat.loading} loadingText={messages.chat.loading}
        resetKey={chat.turns[0]?.id}
        emptyText={messages.chat.empty} pageSize={6} messages={messages.chat.pagination} ariaLabel={messages.chat.pagination.ariaLabel}
        renderItem={(turn) => <ListItem key={turn.id} darkMode={darkMode} layout="block">
          <div className={bodyStackClass}>
            <SupportingText darkMode={darkMode}>{messages.chat.you} · {formatTimestamp(turn.createdAt)}</SupportingText>
            <Text as="p" className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{turn.message}</Text>
            <DescriptionText darkMode={darkMode}>{messages.chat.reply}</DescriptionText>
          </div>
        </ListItem>} />
      </ScrollArea>
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className={`${cardBodyPaddingClass} ${bodyStackClass}`}>
        <TextArea darkMode={darkMode} value={message} maxLength={2000} disabled={chat.pending}
          aria-label={messages.chat.aria} placeholder={messages.chat.placeholder}
          onChange={(event) => setMessage(event.target.value)} />
        <div className="flex justify-end">
          <Button darkMode={darkMode} tone="primary" size="md" type="submit"
            disabled={chat.pending || chat.loading || !message.trim()} icon={<Send size={16} aria-hidden="true" />}>
            <PendingText active={chat.pending} idleText={messages.chat.send} pendingText={messages.chat.sending} />
          </Button>
        </div>
      </form>
    </Panel>
  );
}
