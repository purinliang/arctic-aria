import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arctic Aria",
  description: "A personal planning workspace prototype.",
};

const themeBootScript = `
(() => {
  try {
    const preference = window.localStorage.getItem("arctic-aria.theme-preference");
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const darkMode = preference === "dark" || (preference !== "light" && systemDark);
    const root = document.documentElement;

    root.dataset.aaTheme = darkMode ? "dark" : "light";
    root.style.colorScheme = darkMode ? "dark" : "light";
  } catch {
    // Keep the CSS :root light fallback if browser storage is unavailable.
  }
})();
`;

const languageBootScript = `
(() => {
  try {
    const preference = window.localStorage.getItem("arctic-aria.language-preference");
    const browserLanguages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || "en"];
    const browserLanguage = Array.from(browserLanguages).some((language) =>
      String(language).toLowerCase().startsWith("zh")
    )
      ? "zh-CN"
      : "en";
    const language =
      preference === "zh-CN" || preference === "en"
        ? preference
        : preference === "system"
          ? browserLanguage
          : "en";
    const root = document.documentElement;

    root.dataset.aaLanguage = language;
    root.lang = language;
  } catch {
    // Keep the HTML English fallback if browser storage is unavailable.
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
