import { useEffect } from "react";

export function appShellClass(darkMode: boolean) {
  void darkMode;
  return "bg-[var(--aa-page-bg)] text-[var(--aa-primary-text)]";
}

export function useDocumentTheme(darkMode: boolean) {
  useEffect(() => {
    const root = document.documentElement;

    root.dataset.aaTheme = darkMode ? "dark" : "light";
    root.style.colorScheme = darkMode ? "dark" : "light";

    return () => {
      delete root.dataset.aaTheme;
      root.style.removeProperty("color-scheme");
    };
  }, [darkMode]);
}
