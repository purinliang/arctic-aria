import Link from "next/link";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--aa-color-page)] px-4 text-[var(--aa-color-text)]">
      <div className="grid justify-items-center gap-4 text-center">
        <ArcticAriaLogo />
        <p className="max-w-[320px] text-sm leading-6 text-[var(--aa-color-muted)]">
          This page could not be found.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--aa-color-primary)] bg-[var(--aa-color-primary)] px-4 text-sm font-semibold text-[var(--aa-color-inverse-text)] transition hover:border-[var(--aa-color-primary-hover)] hover:bg-[var(--aa-color-primary-hover)]"
          href="/"
        >
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
