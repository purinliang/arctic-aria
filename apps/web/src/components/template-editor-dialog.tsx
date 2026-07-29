import { ClipboardCopy, FileText, Save } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "./button";
import {
  DialogActionRow,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "./dialog";
import { FormSection, FormSections } from "./forms/form-layout";
import { formControlClass } from "./forms/form-control-style";
import { PendingText } from "./loading";
import { ScrollArea } from "./scroll-area";
import { SupportingText } from "./text";
import { cx } from "./utils";

export type TemplateEditorDialogMessages = {
  title: string;
  close: string;
  editTab: string;
  previewTab: string;
  copyTemplate: string;
  copied: string;
  copyFailed: string;
  inputPlaceholder: string;
  parse: string;
  parsing: string;
  apply: string;
  applying: string;
  previewEmpty: string;
};

type TemplateAction = "parse" | "apply";
type TemplateTab = "edit" | "preview";

export function TemplateEditorDialog<TPreview>({
  darkMode,
  pending,
  initialSource,
  messages,
  showErrorNotification,
  showSuccessNotification,
  renderPreview,
  onClose,
  onParse,
  onApply,
}: {
  darkMode: boolean;
  pending: boolean;
  initialSource: string;
  messages: TemplateEditorDialogMessages;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  renderPreview: (preview: TPreview) => ReactNode;
  onClose: () => void;
  onParse: (source: string) => Promise<TPreview | null>;
  onApply: (source: string) => Promise<boolean>;
}) {
  const [source, setSource] = useState(initialSource);
  const [parsedSource, setParsedSource] = useState("");
  const [preview, setPreview] = useState<TPreview | null>(null);
  const [action, setAction] = useState<TemplateAction | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateTab>("edit");
  const busy = pending || action !== null;
  const hasFreshPreview = Boolean(preview && parsedSource === source);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(initialSource);
      showSuccessNotification(messages.copied);
    } catch {
      showErrorNotification(messages.copyFailed);
    }
  }

  async function parseTemplate() {
    if (action) {
      return;
    }

    setAction("parse");

    try {
      const result = await onParse(source);

      if (!result) {
        setParsedSource("");
        setPreview(null);
        return;
      }

      setParsedSource(source);
      setPreview(result);
      setActiveTab("preview");
    } finally {
      setAction(null);
    }
  }

  async function applyTemplate() {
    if (action || !hasFreshPreview) {
      return;
    }

    setAction("apply");

    try {
      await onApply(source);
    } finally {
      setAction(null);
    }
  }

  async function openPreview() {
    if (action) {
      return;
    }

    if (hasFreshPreview) {
      setActiveTab("preview");
      return;
    }

    await parseTemplate();
  }

  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogFrame darkMode={darkMode} size="lg" className={templateDialogClass}>
        <DialogHeader
          darkMode={darkMode}
          title={messages.title}
          closeLabel={messages.close}
          onClose={onClose}
        />
        <TemplateTabs
          darkMode={darkMode}
          activeTab={activeTab}
          disabled={busy}
          parsing={action === "parse"}
          messages={messages}
          onEdit={() => setActiveTab("edit")}
          onPreview={() => void openPreview()}
        />
        <FormSections className={templateBodyClass}>
          {activeTab === "edit" ? (
            <FormSection className={templateEditSectionClass}>
              <TemplateSourceEditor
                darkMode={darkMode}
                disabled={busy}
                label={messages.editTab}
                placeholder={messages.inputPlaceholder}
                source={source}
                onChange={(value) => {
                  setSource(value);
                  setPreview(null);
                  setParsedSource("");
                  setActiveTab("edit");
                }}
              />
            </FormSection>
          ) : (
            <FormSection className={templatePreviewSectionClass}>
              {preview ? (
                renderPreview(preview)
              ) : (
                <ScrollArea
                  className="relative h-full min-h-0 overflow-hidden"
                  viewportClassName="h-full overflow-x-hidden"
                  contentClassName="min-w-0"
                >
                  <SupportingText darkMode={darkMode}>
                    {messages.previewEmpty}
                  </SupportingText>
                </ScrollArea>
              )}
            </FormSection>
          )}
        </FormSections>
        {activeTab === "edit" ? (
          <DialogActionRow className="grid-cols-2">
            <Button
              darkMode={darkMode}
              size="md"
              disabled={busy}
              className="w-full"
              icon={<ClipboardCopy size={14} aria-hidden="true" />}
              onClick={() => void copyTemplate()}
            >
              {messages.copyTemplate}
            </Button>
            <DialogPrimaryButton
              darkMode={darkMode}
              size="md"
              disabled={busy}
              className="w-full"
              icon={<FileText size={14} aria-hidden="true" />}
              onClick={() => void parseTemplate()}
            >
              {action === "parse" ? messages.parsing : messages.parse}
            </DialogPrimaryButton>
          </DialogActionRow>
        ) : (
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              disabled={busy || !hasFreshPreview}
              icon={<Save size={14} aria-hidden="true" />}
              onClick={() => void applyTemplate()}
            >
              <PendingText
                active={action === "apply"}
                idleText={messages.apply}
                pendingText={messages.applying}
              />
            </DialogPrimaryButton>
          </DialogActionRow>
        )}
      </DialogFrame>
    </DialogOverlay>
  );
}

const templateDialogClass =
  "flex h-[34rem] min-h-[24rem] flex-col overflow-hidden";
const templateBodyClass =
  "h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden";
const templateEditSectionClass =
  "h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden";
const templatePreviewSectionClass = "h-full min-h-0 overflow-hidden";
const templatePanelFillClass = "h-full min-h-0";

function TemplateSourceEditor({
  darkMode,
  disabled,
  label,
  placeholder,
  source,
  onChange,
}: {
  darkMode: boolean;
  disabled: boolean;
  label: string;
  placeholder: string;
  source: string;
  onChange: (source: string) => void;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textArea = textAreaRef.current;

    if (!textArea) {
      return;
    }

    textArea.style.height = "auto";
    textArea.style.height = `${textArea.scrollHeight}px`;
  }, [source]);

  return (
    <ScrollArea
      className={cx(
        templatePanelFillClass,
        "relative overflow-hidden",
        formControlClass(
          darkMode,
          false,
          cx(
            "!h-full !min-h-0 !px-0 focus-within:shadow-[inset_0_0_0_1px_var(--aa-text-input-focus-border)]",
            "focus-within:border-[var(--aa-text-input-focus-border)] focus-within:bg-[var(--aa-text-input-focus-bg)] focus-within:text-[var(--aa-text-input-focus-text)]",
            "focus-within:hover:border-[var(--aa-text-input-hover-border)] focus-within:hover:bg-[var(--aa-text-input-hover-bg)] focus-within:hover:text-[var(--aa-text-input-hover-text)]",
            disabled
              ? "border-[var(--aa-text-input-disabled-border)] bg-[var(--aa-text-input-disabled-bg)] hover:border-[var(--aa-text-input-disabled-border)] hover:bg-[var(--aa-text-input-disabled-bg)]"
              : null,
          ),
        ),
      )}
      viewportClassName="h-full overflow-x-hidden"
      contentClassName="min-h-full"
      refreshKey={source.length}
    >
      <textarea
        ref={textAreaRef}
        aria-label={label}
        className={cx(
          "block min-h-full w-full cursor-text resize-none overflow-hidden border-0 bg-transparent px-3 py-2 font-mono text-sm leading-6 outline-none",
          "text-[var(--aa-text-input-text)] caret-[var(--aa-text-input-text)] placeholder:text-[var(--aa-text-input-placeholder-text)]",
          "disabled:cursor-not-allowed disabled:text-[var(--aa-text-input-disabled-text)] disabled:placeholder:text-[var(--aa-text-input-disabled-text)]",
        )}
        value={source}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </ScrollArea>
  );
}

function TemplateTabs({
  darkMode,
  activeTab,
  disabled,
  parsing,
  messages,
  onEdit,
  onPreview,
}: {
  darkMode: boolean;
  activeTab: TemplateTab;
  disabled: boolean;
  parsing: boolean;
  messages: TemplateEditorDialogMessages;
  onEdit: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className="mb-4 grid grid-cols-2 gap-2"
      role="tablist"
      aria-label={messages.title}
    >
      <Button
        darkMode={darkMode}
        active={activeTab === "edit"}
        size="md"
        role="tab"
        aria-selected={activeTab === "edit"}
        disabled={disabled}
        onClick={onEdit}
      >
        {messages.editTab}
      </Button>
      <Button
        darkMode={darkMode}
        active={activeTab === "preview"}
        size="md"
        role="tab"
        aria-selected={activeTab === "preview"}
        aria-busy={parsing || undefined}
        disabled={disabled}
        onClick={onPreview}
      >
        {parsing ? messages.parsing : messages.previewTab}
      </Button>
    </div>
  );
}
