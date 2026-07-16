"use client";

// Auth Page.
import { Moon, Sparkles, Sun } from "lucide-react";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { Panel } from "@/components/panel";
import { appShellClass } from "@/components/theme";
import { VersionStatusSupport } from "@/components/version-status";
import type {
  AuthMessages,
  VersionStatusMessages,
} from "@/messages/app-messages";
import { AuthForm } from "./AuthForm";
import type { AuthFormProps } from "./AuthForm";

export function AuthPage({
  darkMode,
  messages,
  onThemeToggle,
  versionMessages,
  versionStatus,
  ...props
}: AuthFormProps & {
  messages: AuthMessages;
  onThemeToggle: () => void;
  versionMessages: VersionStatusMessages;
  versionStatus: DatabaseVersionStatus;
}) {
  return (
    <main
      className={`min-h-[110vh] transition-colors ${appShellClass(darkMode)}`}
    >
      <div className="mx-auto flex min-h-[110vh] w-full max-w-[560px] items-center px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
        <div className="w-full">
          <div className="mb-3 flex justify-end">
            <Button
              darkMode={darkMode}
              tone="ghost"
              size="sm"
              icon={
                darkMode ? (
                  <Sun size={15} aria-hidden="true" />
                ) : (
                  <Moon size={15} aria-hidden="true" />
                )
              }
              onClick={onThemeToggle}
            >
              {darkMode ? messages.themeToggle.light : messages.themeToggle.dark}
            </Button>
          </div>
          <Panel darkMode={darkMode} className="w-full p-5 shadow-sm sm:p-8">
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={22} aria-hidden="true" />
              <h1 className="text-2xl font-semibold tracking-normal">
                Arctic Aria
              </h1>
            </div>
            <p
              className={`mx-auto mb-8 mt-2 max-w-[320px] text-center text-sm leading-6 ${mutedTextClass(darkMode)}`}
            >
              {messages.brandDescription}
            </p>
            <AuthForm darkMode={darkMode} messages={messages} {...props} />
          </Panel>
          <footer className="mt-3">
            <VersionStatusSupport
              darkMode={darkMode}
              messages={versionMessages}
              status={versionStatus}
            />
          </footer>
        </div>
      </div>
    </main>
  );
}
