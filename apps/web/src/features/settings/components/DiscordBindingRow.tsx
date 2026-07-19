// Settings Page - Discord Binding Row.
import type { ReactNode } from "react";

export function DiscordBindingRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-2">
      {children}
    </div>
  );
}
