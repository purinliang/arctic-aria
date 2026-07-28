import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";

export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[var(--aa-page-bg)] px-4 text-[var(--aa-primary-text)] transition-colors sm:min-h-screen">
      <section className="grid w-full max-w-[520px] justify-items-center gap-6 py-10 text-center">
        <div className="grid justify-items-center gap-2">
          <ArcticAriaLogo
            brandText="Arctic Aria"
            className="aa-language-block aa-language-option-en"
          />
          <ArcticAriaLogo
            brandText="北极阿莉雅"
            className="aa-language-block aa-language-option-zh"
          />
        </div>

        <div className="grid justify-items-center gap-3">
          <p className="text-6xl font-semibold leading-none tracking-normal sm:text-7xl">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
            <span className="aa-language-inline aa-language-option-en">
              Page not found
            </span>
            <span className="aa-language-inline aa-language-option-zh">
              页面不存在
            </span>
          </h1>
          <p className="max-w-[360px] text-sm leading-6 text-[var(--aa-secondary-text)]">
            <span className="aa-language-inline aa-language-option-en">
              This path is not available in your workspace.
            </span>
            <span className="aa-language-inline aa-language-option-zh">
              这个路径不在你的工作区中。
            </span>
          </p>
        </div>

        <Link
          className="inline-flex h-[var(--aa-button-height-sm)] items-center justify-center rounded-md border border-[var(--aa-primary-button-bg)] bg-[var(--aa-primary-button-bg)] px-3 text-sm font-semibold text-[var(--aa-primary-button-text)] transition hover:border-[var(--aa-primary-button-hover-bg)] hover:bg-[var(--aa-primary-button-hover-bg)]"
          href="/"
        >
          <ArrowLeft className="mr-2" size={17} aria-hidden="true" />
          <span className="aa-language-inline aa-language-option-en">
            Return to workspace
          </span>
          <span className="aa-language-inline aa-language-option-zh">
            返回工作区
          </span>
        </Link>
      </section>
    </main>
  );
}
