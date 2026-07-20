// Auth Page - Loading Screen.
import { LoaderCircle } from "lucide-react";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";
import { getAppMessages } from "@/messages/app-messages";

const englishAuthMessages = getAppMessages("en").auth;
const simplifiedChineseAuthMessages = getAppMessages("zh-CN").auth;

export function AuthLoadingScreen() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[var(--aa-page-bg)] px-4 text-[var(--aa-primary-text)] transition-colors sm:min-h-screen">
      <div
        className="grid justify-items-center gap-4 text-center"
        role="status"
        aria-live="polite"
      >
        <ArcticAriaLogo
          brandText={englishAuthMessages.brandName}
          className="aa-language-block aa-language-option-en"
        />
        <ArcticAriaLogo
          brandText={simplifiedChineseAuthMessages.brandName}
          className="aa-language-block aa-language-option-zh"
        />
        <div className="flex items-center justify-center gap-2">
          <LoaderCircle
            size={18}
            className="animate-spin text-[var(--aa-secondary-text)]"
            aria-hidden="true"
          />
          <span className="aa-language-inline aa-language-option-en text-xs font-medium leading-5 text-[var(--aa-secondary-text)]">
            {englishAuthMessages.loading.openingWorkspace}
          </span>
          <span className="aa-language-inline aa-language-option-zh text-xs font-medium leading-5 text-[var(--aa-secondary-text)]">
            {simplifiedChineseAuthMessages.loading.openingWorkspace}
          </span>
        </div>
      </div>
    </main>
  );
}
