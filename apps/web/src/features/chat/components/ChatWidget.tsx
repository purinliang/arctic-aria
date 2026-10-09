"use client";

// Workspace - Floating Aria Chat.
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, LoaderCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/button';
import { FloatingDialog } from '@/components/floating-dialog';
import { ChatMessage } from '@/components/chat-message';
import { SystemNotice } from '@/components/system-notice';
import { AutoGrowTextArea } from '@/components/forms/auto-grow-text-area';
import { ScrollArea } from '@/components/scroll-area';
import { Text, SupportingText } from '@/components/text';
import { bodyStackClass, cardBodyPaddingClass, dialogPaddingClass, controlGapClass } from '@/components/spacing';
import type { SupportedLanguage } from '@/messages/languages';
import { chatMessages } from '@/messages/chat-messages';
import { chatErrorAction } from '../chat-state';
import { chatDateSeparator } from '../chat-dates';
import { useChat } from '../use-chat';

export function ChatWidget({ userId, darkMode, language, timeZone, onSettings }: {
  userId: string; darkMode: boolean; language: SupportedLanguage; timeZone: string; onSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const messages = chatMessages(language);
  const chat = useChat(userId, open);
  const end = useRef<HTMLDivElement>(null);
  const previousLast = useRef<string | null>(null);
  const last = chat.entries.at(-1);
  useEffect(() => {
    const key = last ? `${last.id}:${last.status}` : null;
    if (open && key !== previousLast.current) end.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    previousLast.current = key;
  }, [open, last]);
  function settings() { setOpen(false); onSettings(); }
  async function send() {
    const text = draft;
    const retry = last?.status === 'failed' && last.userText === text.trim() ? last : undefined;
    setDraft('');
    if (!(await chat.send(text, retry))) setDraft(current => current || text);
  }
  const pending = chat.sending || chat.entries.some(entry => entry.status === 'pending');
  return <>
    <Button darkMode={darkMode} tone="primary" size="icon" title={messages.open} aria-label={messages.open}
      aria-expanded={open} aria-haspopup="dialog"
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 !h-12 !w-12 !rounded-full shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 ${open ? 'invisible' : ''}`}
      onClick={() => setOpen(true)} icon={<MessageCircle size={22} aria-hidden="true" />} />
    <FloatingDialog open={open} title={messages.title} closeLabel={messages.close} darkMode={darkMode} onClose={() => setOpen(false)}
      icon={<MessageCircle size={17} aria-hidden="true" className="shrink-0 text-[var(--aa-secondary-text)]" />}>
      <ScrollArea className="relative min-h-0 flex-1" viewportClassName="h-full" contentClassName="flex min-h-full flex-col"
        refreshKey={`${chat.entries.length}:${last?.status}`}>
        <div className={`${bodyStackClass} ${cardBodyPaddingClass} !flex flex-1 flex-col`}>
          {chat.hasMore ? <Button darkMode={darkMode} tone="ghost" disabled={chat.loading}
            onClick={() => void chat.refresh(chat.entries[0]?.id)}>{messages.older}</Button> : null}
          {chat.loading && chat.entries.length === 0 ? <div role="status" aria-label={messages.loading} className="grid flex-1 place-items-center">
            <LoaderCircle size={18} aria-hidden="true" className="animate-spin text-[var(--aa-secondary-text)] motion-reduce:animate-none" />
          </div> : chat.entries.length === 0 ? <div className="grid flex-1 place-items-center text-center">
            <Text size="md" tone="secondary">{messages.empty}</Text>
          </div> : null}
          <div role="log" aria-live="polite" aria-relevant="additions text" className={bodyStackClass}>
          {chat.entries.map((entry, index) => {
            const day = chatDateSeparator(chat.entries, index, { timeZone, language, today: messages.today, yesterday: messages.yesterday });
            return <div key={entry.id} className={bodyStackClass}>
            {day ? <SupportingText darkMode={darkMode} className="block text-center">{day}</SupportingText> : null}
            <ChatMessage own text={entry.userText} />
            {entry.assistantText ? <ChatMessage text={entry.assistantText} />
              : entry.status === 'pending' ? <div role="status"><ChatMessage text={messages.processing} /></div>
                : <SystemNotice text={messages.results[entry.errorCode ?? 'chat_internal']}>
                  {chatErrorAction(entry.errorCode ?? 'chat_internal') === 'settings'
                    ? <Button darkMode={darkMode} tone="ghost" size="sm" onClick={settings}>{messages.settingsAction}</Button>
                    : <Button darkMode={darkMode} tone="ghost" size="sm" disabled={pending || !chat.enabled}
                      onClick={async () => {
                        if (await chat.send(entry.userText, entry)) setDraft(current => current.trim() === entry.userText ? '' : current);
                      }}>{messages.retry}</Button>}
                </SystemNotice>}
          </div>;
          })}
          </div>
          {chat.error ? <SystemNotice text={messages.results[chat.error]}>
            {chatErrorAction(chat.error) === 'settings' ? <Button darkMode={darkMode} tone="ghost" onClick={settings}>{messages.settingsAction}</Button>
              : <Button darkMode={darkMode} tone="ghost" disabled={chat.loading} onClick={() => void chat.refresh()}>{messages.retry}</Button>}
          </SystemNotice> : null}
          <div ref={end} />
        </div>
      </ScrollArea>
      <div data-chat-composer className={`${dialogPaddingClass} ${bodyStackClass} shrink-0 border-t border-[var(--aa-list-divider-border)]`}>
        {chat.loaded && !chat.enabled ? <SystemNotice text={messages.results.chat_not_configured}>
          <Button darkMode={darkMode} tone="ghost" onClick={settings}>{messages.settingsAction}</Button>
        </SystemNotice> : null}
        <div className={`flex items-end ${controlGapClass}`}>
          <AutoGrowTextArea darkMode={darkMode} aria-label={messages.input} placeholder={messages.placeholder}
            className="min-w-0 flex-1" maxLength={4000} value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing
              && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
              event.preventDefault(); if (!pending && draft.trim()) void send();
            } }} />
          <Button darkMode={darkMode} tone="primary" size="icon" aria-label={messages.send} title={messages.send}
            className="!h-[var(--aa-form-control-height)] !w-[var(--aa-form-control-height)]"
            disabled={!chat.loaded || !chat.enabled || pending || !draft.trim()} onClick={() => void send()}
            icon={<ArrowUp size={18} aria-hidden="true" />} />
        </div>
      </div>
    </FloatingDialog>
  </>;
}
