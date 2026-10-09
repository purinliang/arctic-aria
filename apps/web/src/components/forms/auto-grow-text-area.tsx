"use client";

import { useEffect, useRef } from 'react';
import { TextArea } from './text-area-field';
import type { TextareaHTMLAttributes } from 'react';

export function AutoGrowTextArea({ value, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { darkMode: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    function resize() {
      if (!input) return;
      const style = getComputedStyle(input);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      input.style.height = 'auto';
      const minimum = parseFloat(style.getPropertyValue('--aa-form-control-height')) || parseFloat(style.lineHeight) + padding + border;
      input.style.height = `${Math.max(minimum, Math.min(input.scrollHeight + border, parseFloat(style.lineHeight) * 5 + padding + border))}px`;
    }
    resize();
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) { width = input.clientWidth; resize(); }
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [value]);
  return <TextArea {...props} ref={ref} value={value} rows={1}
    style={{ ...props.style, lineHeight: 'var(--aa-line-height-md)',
      paddingBlock: 'calc((var(--aa-form-control-height) - var(--aa-line-height-md) - 2px) / 2)' }}
    className={`!min-h-0 !resize-none !text-[length:var(--aa-font-size-lg)] sm:!text-[length:var(--aa-font-size-md)] overflow-y-auto ${className}`} />;
}
