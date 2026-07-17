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
    root.style.setProperty("--background", "var(--aa-page-bg)");
    root.style.setProperty("--foreground", "var(--aa-primary-text)");
    root.style.setProperty("--muted-foreground", "var(--aa-secondary-text)");
  } catch {
    // Keep the CSS :root light fallback if browser storage is unavailable.
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
      </head>
      <body>{children}</body>
    </html>
  );
}
