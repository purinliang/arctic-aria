import { useEffect } from "react";

export const appThemeColors = {
  light: {
    background: "var(--aa-color-page)",
    foreground: "var(--aa-color-text)",
    mutedForeground: "var(--aa-color-muted)",
  },
  dark: {
    background: "var(--aa-color-page)",
    foreground: "var(--aa-color-text)",
    mutedForeground: "var(--aa-color-muted)",
  },
} as const;

export function appShellClass(_darkMode: boolean) {
  return "bg-[var(--aa-color-page)] text-[var(--aa-color-text)]";
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
