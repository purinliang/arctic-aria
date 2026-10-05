export type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export function buttonToneClass(tone: ButtonTone, active = false) {
  if (tone === "danger") {
    return "border border-[var(--aa-danger-button-border)] bg-[var(--aa-danger-button-bg)] text-[var(--aa-danger-button-text)] hover:border-[var(--aa-danger-button-hover-border)] hover:bg-[var(--aa-danger-button-hover-bg)] disabled:border-[var(--aa-danger-button-disabled-bg)] disabled:bg-[var(--aa-danger-button-disabled-bg)] disabled:text-[var(--aa-danger-button-disabled-text)] disabled:hover:border-[var(--aa-danger-button-disabled-bg)] disabled:hover:bg-[var(--aa-danger-button-disabled-bg)] disabled:hover:text-[var(--aa-danger-button-disabled-text)]";
  }

  if (tone === "primary" || active) {
    return "border border-[var(--aa-primary-button-hover-bg)] bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)] hover:border-[var(--aa-primary-button-hover-bg)] hover:bg-[var(--aa-primary-button-hover-bg)] hover:text-[var(--aa-primary-button-hover-text)] disabled:border-[var(--aa-primary-button-disabled-bg)] disabled:bg-[var(--aa-primary-button-disabled-bg)] disabled:text-[var(--aa-primary-button-disabled-text)] disabled:hover:border-[var(--aa-primary-button-disabled-bg)] disabled:hover:bg-[var(--aa-primary-button-disabled-bg)] disabled:hover:text-[var(--aa-primary-button-disabled-text)]";
  }

  if (tone === "ghost") {
    return "text-[var(--aa-secondary-button-text)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] disabled:bg-transparent disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:bg-transparent disabled:hover:text-[var(--aa-secondary-button-disabled-text)]";
  }

  return "border border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)] hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] disabled:border-[var(--aa-secondary-button-disabled-border)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:border-[var(--aa-secondary-button-disabled-border)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)] disabled:hover:text-[var(--aa-secondary-button-disabled-text)]";
}
