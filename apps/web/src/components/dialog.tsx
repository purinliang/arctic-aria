import type { ReactNode } from "react";
import { LoaderCircle, X } from "lucide-react";
import { Button } from "./button";
import { surfaceClass } from "./color";
import { cx } from "./utils";

export function DialogOverlay({
  zIndex = "z-50",
  children,
}: {
  zIndex?: "z-50" | "z-[60]";
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "fixed inset-0 grid place-items-center overflow-y-auto bg-black/65 px-4 py-6",
        zIndex,
      )}
    >
      {children}
    </div>
  );
}

export function DialogBackdrop({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="absolute inset-0 cursor-default"
      type="button"
      aria-label={label}
      onClick={onClick}
    />
  );
}

export function DialogFrame({
  darkMode,
  size = "md",
  padding = "md",
  className,
  children,
}: {
  darkMode: boolean;
  size?: "md" | "sm";
  padding?: "md" | "none";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx(dialogFrameClass(darkMode, size, padding), className)}
    >
      {children}
    </section>
  );
}

export function dialogFrameClass(
  darkMode: boolean,
  size: "md" | "sm" = "md",
  padding: "md" | "none" = "md",
) {
  return cx(
    "relative rounded-md border shadow-2xl",
    padding === "md" ? "p-4" : "",
    size === "sm"
      ? "w-[min(calc(100vw-2rem),28rem)]"
      : "w-[min(calc(100vw-2rem),42rem)]",
    surfaceClass(darkMode),
  );
}

export function DialogHeader({
  darkMode,
  title,
  closeLabel,
  onClose,
}: {
  darkMode: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-base font-semibold">{title}</h3>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon-sm"
        aria-label={closeLabel}
        icon={<X size={16} aria-hidden="true" />}
        onClick={onClose}
      />
    </div>
  );
}

export function DialogActionRow({ children }: { children: ReactNode }) {
  return <div className="mt-5 grid gap-2">{children}</div>;
}

export function DialogPrimaryButton({
  className,
  ...props
}: Parameters<typeof Button>[0]) {
  return (
    <Button
      {...props}
      tone="primary"
      size="md"
      className={cx("w-full", className)}
    />
  );
}

export function ConfirmDialog({
  darkMode,
  pending,
  title,
  description,
  confirmText = "Delete",
  confirmIcon,
  loadingIcon,
  onCancel,
  onConfirm,
}: {
  darkMode: boolean;
  pending: boolean;
  title: string;
  description: string;
  confirmText?: string;
  confirmIcon?: ReactNode;
  loadingIcon?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogBackdrop label="Close confirmation" onClick={onCancel} />
      <DialogFrame darkMode={darkMode} size="sm">
        <DialogHeader
          darkMode={darkMode}
          title={title}
          closeLabel="Close confirmation"
          onClose={onCancel}
        />
        <p className={darkMode ? "text-sm leading-6 text-neutral-400" : "text-sm leading-6 text-slate-500"}>
          {description}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button darkMode={darkMode} disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            darkMode={darkMode}
            tone="primary"
            loading={pending}
            icon={confirmIcon}
            loadingIcon={
              loadingIcon ?? (
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              )
            }
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </DialogFrame>
    </DialogOverlay>
  );
}
