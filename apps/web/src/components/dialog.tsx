import type { ReactNode } from "react";
import { Save, Trash2, X } from "lucide-react";
import { Button } from "./button";
import { panelColorClass } from "./color";
import { PendingText } from "./loading";
import { ScrollArea } from "./scroll-area";
import { cx } from "./utils";

export function DialogOverlay({
  zIndex = "z-50",
  children,
}: {
  zIndex?: "z-50" | "z-[60]";
  children: ReactNode;
}) {
  return (
    <ScrollArea
      className={cx(
        "fixed inset-0 bg-black/65",
        zIndex,
      )}
      viewportClassName="h-full px-4 py-8 sm:py-10"
      contentClassName="grid min-h-full place-items-center"
    >
      {children}
    </ScrollArea>
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
      style={{
        backgroundColor: "var(--aa-panel-bg)",
      }}
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
    "bg-[var(--aa-panel-bg)]",
    padding === "md" ? "p-4" : "",
    size === "sm"
      ? "w-[min(calc(100vw-2rem),28rem)]"
      : "w-[min(calc(100vw-2rem),46rem)]",
    panelColorClass,
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
      <h3 className="text-lg font-semibold leading-7">{title}</h3>
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

export function CrudEditorDialog({
  darkMode,
  pending,
  saving,
  title,
  closeLabel,
  saveText,
  savingText,
  deleteText,
  zIndex,
  children,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  title: string;
  closeLabel: string;
  saveText: string;
  savingText: string;
  deleteText?: string;
  zIndex?: "z-50" | "z-[60]";
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogOverlay zIndex={zIndex}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={title}
            closeLabel={closeLabel}
            onClose={onClose}
          />
          <div className="grid gap-3">{children}</div>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              type="submit"
              disabled={pending}
              icon={<Save size={14} aria-hidden="true" />}
            >
              <PendingText
                active={saving}
                idleText={saveText}
                pendingText={savingText}
              />
            </DialogPrimaryButton>
            {onDelete && deleteText ? (
              <Button
                darkMode={darkMode}
                size="md"
                disabled={pending}
                className="w-full"
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={onDelete}
              >
                {deleteText}
              </Button>
            ) : null}
          </DialogActionRow>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}

export function ConfirmDialog({
  darkMode,
  pending,
  title,
  description,
  confirmText = "Delete",
  pendingConfirmText,
  cancelText = "Cancel",
  closeLabel = "Close confirmation",
  confirmIcon,
  onCancel,
  onConfirm,
}: {
  darkMode: boolean;
  pending: boolean;
  title: string;
  description: string;
  confirmText?: string;
  pendingConfirmText?: string;
  cancelText?: string;
  closeLabel?: string;
  confirmIcon?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogFrame darkMode={darkMode} size="sm">
        <DialogHeader
          darkMode={darkMode}
          title={title}
          closeLabel={closeLabel}
          onClose={onCancel}
        />
        <p
          className={
            "text-sm leading-6 text-[var(--aa-secondary-text)]"
          }
        >
          {description}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button darkMode={darkMode} disabled={pending} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            darkMode={darkMode}
            tone="primary"
            disabled={pending}
            icon={confirmIcon}
            onClick={onConfirm}
          >
            {pending ? pendingConfirmText ?? confirmText : confirmText}
          </Button>
        </div>
      </DialogFrame>
    </DialogOverlay>
  );
}
