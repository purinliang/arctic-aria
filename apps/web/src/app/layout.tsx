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

    root.dataset.theme = darkMode ? "dark" : "light";
    root.style.colorScheme = darkMode ? "dark" : "light";
    root.style.setProperty("--background", darkMode ? "#000000" : "#eef2f5");
    root.style.setProperty("--foreground", darkMode ? "#ffffff" : "#0f172a");
    root.style.setProperty("--muted-foreground", darkMode ? "#a3a3a3" : "#64748b");
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
