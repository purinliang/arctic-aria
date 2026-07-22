"use client";

// Auth Page.
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";
import { Panel } from "@/components/panel";
import { DescriptionText } from "@/components/text";
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
  versionMessages,
  versionStatus,
  ...props
}: AuthFormProps & {
  messages: AuthMessages;
  versionMessages: VersionStatusMessages;
  versionStatus: DatabaseVersionStatus;
}) {
  return (
    <main
      className={`min-h-[100dvh] transition-colors lg:min-h-[110vh] ${appShellClass(darkMode)}`}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[560px] items-center px-4 pb-16 pt-6 sm:px-6 sm:pb-20 lg:min-h-[110vh]">
        <div className="w-full">
          <Panel darkMode={darkMode} className="w-full p-5 shadow-sm sm:p-8">
            <ArcticAriaLogo brandText={messages.brandName} />
            <DescriptionText
              darkMode={darkMode}
              className="mx-auto mb-8 mt-2 max-w-[320px] text-center"
            >
              {messages.brandDescription}
            </DescriptionText>
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
