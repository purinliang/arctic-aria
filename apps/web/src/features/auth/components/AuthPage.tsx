"use client";

// Auth Page.
import { Sparkles } from "lucide-react";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { Panel } from "@/components/panel";
import { VersionStatusSupport } from "@/components/version-status";
import { AuthForm } from "./AuthForm";
import type { AuthFormProps } from "./AuthForm";

export function AuthPage({
  versionStatus,
  ...props
}: AuthFormProps & {
  versionStatus: DatabaseVersionStatus;
}) {
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
          <footer className="mt-3">
            <VersionStatusSupport darkMode={false} status={versionStatus} />
          </footer>
        </div>
      </div>
    </main>
  );
}
