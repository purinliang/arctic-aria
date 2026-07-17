import { useEffect } from "react";

export const appThemeColors = {
  light: {
    background: "var(--aa-page-bg)",
    foreground: "var(--aa-primary-text)",
    mutedForeground: "var(--aa-secondary-text)",
  },
  dark: {
    background: "var(--aa-page-bg)",
    foreground: "var(--aa-primary-text)",
    mutedForeground: "var(--aa-secondary-text)",
  },
} as const;

export function appShellClass(darkMode: boolean) {
  void darkMode;
  return "bg-[var(--aa-page-bg)] text-[var(--aa-primary-text)]";
}

export function useDocumentTheme(darkMode: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const theme = darkMode ? appThemeColors.dark : appThemeColors.light;

    root.dataset.aaTheme = darkMode ? "dark" : "light";
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--foreground", theme.foreground);
    root.style.setProperty("--muted-foreground", theme.mutedForeground);

    return () => {
      delete root.dataset.aaTheme;
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--muted-foreground");
    };
  }, [darkMode]);
}
