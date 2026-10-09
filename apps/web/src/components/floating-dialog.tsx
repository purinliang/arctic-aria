"use client";

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { panelColorClass } from './color';
import { cardHeaderPaddingClass, controlGapClass } from './spacing';
import { Text } from './text';
import { cx } from './utils';

// Non-modal surface: the rest of the workspace remains operable.
export function FloatingDialog({ open, title, closeLabel, darkMode, onClose, icon, children }: {
  open: boolean; title: string; closeLabel: string; darkMode: boolean; onClose: () => void; icon?: ReactNode; children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement;
    ref.current?.focus();
    return () => { if (restore.current?.isConnected) restore.current.focus(); };
  }, [open]);
  useEffect(() => {
    const viewport = window.visualViewport;
    function resize() {
      if (!ref.current || !viewport) return;
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      ref.current.style.bottom = `calc(max(1rem, env(safe-area-inset-bottom)) + ${inset}px)`;
      ref.current.style.maxHeight = `${Math.max(0, viewport.height - 32)}px`;
    }
    resize();
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    return () => { viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); };
  }, []);
  return <section ref={ref} role="dialog" aria-label={title} aria-modal={false} tabIndex={-1}
    aria-hidden={!open} inert={!open}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}
    className={cx('fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex h-[min(38rem,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border shadow-2xl outline-none transition-[opacity,visibility] duration-200 motion-reduce:transition-none', panelColorClass,
      open ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0')}>
    <header className={cx('flex shrink-0 items-center justify-between border-b border-[var(--aa-list-divider-border)]', cardHeaderPaddingClass, controlGapClass)}>
      <div className={cx('flex min-w-0 items-center', controlGapClass)}>
        {icon}
        <Text as="h2" size="lg" weight="semibold">{title}</Text>
      </div>
      <Button darkMode={darkMode} tone="ghost" size="icon" title={closeLabel} aria-label={closeLabel}
        onClick={onClose} icon={<X size={16} aria-hidden="true" />} />
    </header>
    {children}
  </section>;
}
