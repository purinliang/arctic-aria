import Link from "next/link";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--aa-page-bg)] px-4 text-[var(--aa-primary-text)]">
      <div className="grid justify-items-center gap-4 text-center">
        <ArcticAriaLogo />
        <p className="max-w-[320px] text-sm leading-6 text-[var(--aa-secondary-text)]">
          This page could not be found.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--aa-primary-button-bg)] bg-[var(--aa-primary-button-bg)] px-4 text-sm font-semibold text-[var(--aa-primary-button-text)] transition hover:border-[var(--aa-primary-button-hover-bg)] hover:bg-[var(--aa-primary-button-hover-bg)]"
          href="/"
        >
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
