"use client";
import { useRef, useState } from 'react';
import { cx } from './utils';

export function StockLevelSlider({ value,label,valueText,disabled = false,onPreview,onCommit,onInteractionChange }: {
  value: number; label: string; valueText?: string; disabled?: boolean;
  onPreview: (value: number) => void; onCommit: (value: number) => void;
  onInteractionChange?: (active: boolean) => void;
}) {
  const dirty = useRef(false), dragging = useRef(false);
  const [pointerFocus,setPointerFocus] = useState(false);
  const initial = useRef(value);
  const fill = value <= 1 ? 'bg-red-500' : value === 2 ? 'bg-amber-500' : 'bg-[var(--blue-9)]';
  function commit(next: number) {
    if (!dirty.current || disabled) return;
    dirty.current = false;
    onCommit(next);
  }
  return <div className={cx('relative h-8 min-w-0 w-full select-none rounded-sm',
    !pointerFocus && 'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--blue-9)]')}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-3 h-2 overflow-hidden rounded-sm bg-[var(--aa-secondary-button-bg)]">
      <div className={cx('h-full',fill)} style={{ width: `${Math.max(2,value * 20)}%` }} />
      <div className="absolute inset-0 grid grid-cols-5">
        {Array.from({ length: 5 },(_,index) => <span key={index} className="border-r-2 border-[var(--aa-panel-bg)] last:border-r-0" />)}
      </div>
    </div>
    <input type="range" min={0} max={5} step={1} value={value} disabled={disabled}
      aria-label={label} aria-valuetext={valueText ?? `${value}/5`}
      className="absolute inset-0 m-0 h-full w-full appearance-none touch-pan-y select-none cursor-grab opacity-0 outline-none active:cursor-grabbing disabled:cursor-not-allowed"
      onChange={(event) => { dirty.current = true; onPreview(Number(event.target.value)); }}
      onPointerDown={(event) => { setPointerFocus(true); initial.current = value; dragging.current = true; onInteractionChange?.(true); event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerUp={(event) => { dragging.current = false; commit(Number(event.currentTarget.value)); onInteractionChange?.(false); }}
      onPointerCancel={() => { dragging.current = false; dirty.current = false; onPreview(initial.current); onInteractionChange?.(false); }}
      onKeyDown={(event) => { setPointerFocus(false); if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) onInteractionChange?.(true); }}
      onKeyUp={(event) => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) { commit(Number(event.currentTarget.value)); onInteractionChange?.(false); } }}
      onBlur={(event) => { setPointerFocus(false); if (!dragging.current) { commit(Number(event.currentTarget.value)); onInteractionChange?.(false); } }} />
  </div>;
}
