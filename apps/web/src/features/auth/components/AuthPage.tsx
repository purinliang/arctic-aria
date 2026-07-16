"use client";

// Auth Page.
import { Sparkles } from "lucide-react";
import { appMetadataLabel, getAppMetadata } from "@/components/app-metadata";
import { Panel } from "@/components/panel";
import { AuthForm } from "./AuthForm";
import type { AuthFormProps } from "./AuthForm";

export function AuthPage(props: AuthFormProps) {
  const metadataLabel = appMetadataLabel(getAppMetadata());

  return (
    <main className="min-h-[110vh] bg-[#eef2f5] text-slate-950">
      <div className="mx-auto flex min-h-[110vh] w-full max-w-[560px] items-center px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
        <div className="w-full">
          <Panel darkMode={false} className="w-full p-5 shadow-sm sm:p-8">
            <div className="flex items-center justify-center gap-2 text-slate-950">
              <Sparkles size={22} aria-hidden="true" />
              <h1 className="text-2xl font-semibold tracking-normal">
                Arctic Aria
              </h1>
            </div>
            <p className="mx-auto mb-8 mt-2 max-w-[320px] text-center text-sm leading-6 text-slate-500">
              Your personal life assistant under the aurora.
            </p>
            <AuthForm {...props} />
          </Panel>
          {metadataLabel ? (
            <footer className="mt-3 text-center text-[10px] leading-4 text-[#d7e0e8] tabular-nums">
              {metadataLabel}
            </footer>
          ) : null}
        </div>
      </div>
    </main>
  );
}
