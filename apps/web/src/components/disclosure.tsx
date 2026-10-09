import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Text } from './text';
import { bodyStackClass } from './spacing';

export function Disclosure({ title,children,initiallyOpen = false }: { title: string; children: ReactNode; initiallyOpen?: boolean }) {
  return <details open={initiallyOpen || undefined} className="group min-w-0">
    <summary className="flex cursor-pointer list-none items-center gap-[var(--aa-space-icon-gap)] rounded-sm py-[var(--aa-space-tag-y)] focus-visible:outline-2 focus-visible:outline-[var(--blue-9)] [&::-webkit-details-marker]:hidden">
      <ChevronDown size={16} aria-hidden="true" className="shrink-0 -rotate-90 transition-transform group-open:rotate-0" />
      <Text weight="medium" tone="secondary">{title}</Text>
    </summary>
    <div className={`${bodyStackClass} mt-[var(--aa-space-body-gap)]`}>{children}</div>
  </details>;
}
