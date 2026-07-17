import { useEffect } from "react";

export const appThemeColors = {
  light: {
    background: "#eef2f5",
    foreground: "#0f172a",
    mutedForeground: "#64748b",
  },
  dark: {
    background: "#000000",
    foreground: "#ffffff",
    mutedForeground: "#a3a3a3",
  },
} as const;

export function appShellClass(darkMode: boolean) {
  return darkMode ? "bg-black text-white" : "bg-[#eef2f5] text-slate-950";
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
