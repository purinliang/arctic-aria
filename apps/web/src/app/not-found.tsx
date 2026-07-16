import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef2f5] px-4 text-slate-950">
      <div className="grid justify-items-center gap-4 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-950">
          <Sparkles size={22} aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-normal">Arctic Aria</h1>
        </div>
        <p className="max-w-[320px] text-sm leading-6 text-slate-500">
          This page could not be found.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/"
        >
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
