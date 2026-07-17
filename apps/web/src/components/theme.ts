import { useEffect } from "react";

export const appThemeColors = {
  light: {
    background: "#eef2f5",
    foreground: "#000000",
    mutedForeground: "#555555",
  },
  dark: {
    background: "#000000",
    foreground: "#ffffff",
    mutedForeground: "#a3a3a3",
  },
} as const;

export function appShellClass(darkMode: boolean) {
  return darkMode
    ? "bg-[var(--aa-grey-0)] text-[var(--aa-grey-15)]"
    : "bg-[var(--aa-grey-13)] text-[var(--aa-grey-0)]";
}

export function useDocumentTheme(darkMode: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const theme = darkMode ? appThemeColors.dark : appThemeColors.light;

    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--foreground", theme.foreground);
    root.style.setProperty("--muted-foreground", theme.mutedForeground);

    return () => {
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--muted-foreground");
    };
  }, [darkMode]);
}
