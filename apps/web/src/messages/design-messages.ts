import { englishDesignMessages } from "./design-messages-en";
import { simplifiedChineseDesignMessages } from "./design-messages-zh";
import type { SupportedLanguage } from "./languages";
import type { DesignMessages } from "./design-message-types";

export type { DesignMessages } from "./design-message-types";

export function getDesignMessages(language: SupportedLanguage): DesignMessages {
  return language === "zh-CN"
    ? simplifiedChineseDesignMessages
    : englishDesignMessages;
}
