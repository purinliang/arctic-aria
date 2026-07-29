// Projects Page - Project Tree Template Dialog.
import { ClipboardCopy, FileText, Save } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/button";
import { toneClass } from "@/components/color";
import type { Tone } from "@/components/color";
import {
  DialogActionRow,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { FormSection, FormSections } from "@/components/forms/form-layout";
import { formControlClass } from "@/components/forms/form-control-style";
import {
  List,
  ListItem,
  ListItemTitle,
} from "@/components/list";
import { ScrollArea } from "@/components/scroll-area";
import { SupportingText } from "@/components/text";
import { PendingText } from "@/components/loading";
import { cx } from "@/components/utils";
import type {
  ProjectInput,
  ProjectTreeTemplateParseData,
  ProjectView,
} from "@/features/projects/actions";
import {
  projectTreeTemplateForNewProject,
  projectTreeTemplateForProject,
} from "@/features/projects/project-tree-template-serializer";
import type { ProjectMessages } from "@/messages/app-messages";

type TemplateAction = "parse" | "apply";
type TemplateMode = "create" | "update";
type TemplateTab = "edit" | "preview";

export function ProjectTreeTemplateDialog({
  darkMode,
  pending,
  mode,
  project,
  draft,
  messages,
  showErrorNotification,
  showSuccessNotification,
  onClose,
  onParse,
  onApply,
}: {
  darkMode: boolean;
  pending: boolean;
  mode: TemplateMode;
  project: ProjectView | null;
  draft: ProjectInput | null;
  messages: ProjectMessages["editor"]["template"];
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  onClose: () => void;
  onParse: (
    projectId: string | null,
    source: string,
  ) => Promise<ProjectTreeTemplateParseData | null>;
  onApply: (projectId: string | null, source: string) => Promise<boolean>;
}) {
  const template = useMemo(
    () =>
      mode === "create"
        ? projectTreeTemplateForNewProject(draft ?? emptyProjectTemplateDraft)
        : project
          ? projectTreeTemplateForProject(project)
          : "",
    [draft, mode, project],
  );
  const projectId = mode === "update" ? project?.id ?? null : null;
  const [source, setSource] = useState(template);
  const [parsedSource, setParsedSource] = useState("");
  const [preview, setPreview] =
    useState<ProjectTreeTemplateParseData["preview"] | null>(null);
  const [action, setAction] = useState<TemplateAction | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateTab>("edit");
  const busy = pending || action !== null;
  const hasFreshPreview = Boolean(preview && parsedSource === source);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(template);
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
      const result = await onParse(projectId, source);

      if (!result) {
        setParsedSource("");
        setPreview(null);
        return;
      }

      setParsedSource(source);
      setPreview(result.preview);
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
      await onApply(projectId, source);
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
            <TemplatePreview
              darkMode={darkMode}
              messages={messages}
              preview={preview}
            />
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

const emptyProjectTemplateDraft: ProjectInput = {
  title: "",
  description: "",
  startDate: "",
  timelineType: "duration",
  deadlineDate: "",
  durationRange: "3_6_months",
};
const templateDialogClass =
  "flex h-[46rem] min-h-[34rem] flex-col overflow-hidden";
const templateBodyClass =
  "h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden";
const templateEditSectionClass =
  "h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden";
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
          "block min-h-full w-full resize-none overflow-hidden border-0 bg-transparent px-3 py-2 font-mono text-sm leading-6 outline-none",
          "text-[var(--aa-text-input-text)] placeholder:text-[var(--aa-text-input-placeholder-text)]",
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
  messages: ProjectMessages["editor"]["template"];
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

function TemplatePreview({
  darkMode,
  messages,
  preview,
}: {
  darkMode: boolean;
  messages: ProjectMessages["editor"]["template"];
  preview: ProjectTreeTemplateParseData["preview"] | null;
}) {
  if (!preview) {
    return (
      <FormSection className={templatePreviewSectionClass}>
        <ScrollArea
          className="relative h-full min-h-0 overflow-hidden"
          viewportClassName="h-full overflow-x-hidden"
          contentClassName="min-w-0"
        >
          <SupportingText darkMode={darkMode}>
            {messages.previewEmpty}
          </SupportingText>
        </ScrollArea>
      </FormSection>
    );
  }

  return (
    <FormSection
      className={cx(
        templatePreviewSectionClass,
        "grid-rows-[auto_minmax(0,1fr)] overflow-hidden",
      )}
    >
      <div className="grid min-w-0 gap-1">
        <SupportingText darkMode={darkMode}>
          {messages.previewCounts(
            previewCount(preview.counts.create),
            previewCount(preview.counts.update),
            previewCount(preview.counts.delete),
            previewCount(preview.counts.preserve),
          )}
        </SupportingText>
        {preview.ignoredFieldCount > 0 ? (
          <SupportingText darkMode={darkMode}>
            {messages.ignoredFields(preview.ignoredFieldCount)}
          </SupportingText>
        ) : null}
      </div>
      <ScrollArea
        className="relative h-full min-h-0 overflow-hidden"
        viewportClassName="h-full overflow-x-hidden"
        contentClassName="min-w-0"
        refreshKey={`${preview.items.length}-${preview.ignoredFieldCount}`}
      >
        <List darkMode={darkMode}>
          {preview.items.map((item, index) => {
            const depth = previewItemDepth(item);

            return (
              <ListItem
                darkMode={darkMode}
                key={`${item.subject}-${index}`}
                className="min-w-0 items-center py-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={cx("block shrink-0", previewIndentClass(depth))}
                    aria-hidden="true"
                  />
                  <span className="shrink-0 text-sm font-semibold leading-5 text-[var(--aa-secondary-text)]">
                    {messages.subjects[item.subject]}:
                  </span>
                  <ListItemTitle
                    className="min-w-0 flex-1"
                    size="compact"
                    truncate
                  >
                    {item.title}
                  </ListItemTitle>
                  <OperationBadge
                    darkMode={darkMode}
                    operation={item.operation}
                    label={messages.operations[item.operation]}
                    text={messages.operationBadges[item.operation]}
                  />
                </div>
              </ListItem>
            );
          })}
        </List>
      </ScrollArea>
    </FormSection>
  );
}

const templatePreviewSectionClass = "h-full min-h-0 overflow-hidden";

function previewCount(value: number | undefined) {
  return value ?? 0;
}

function OperationBadge({
  darkMode,
  operation,
  label,
  text,
}: {
  darkMode: boolean;
  operation: ProjectTreeTemplateParseData["preview"]["items"][number]["operation"];
  label: string;
  text: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded border px-1.5 text-[11px] font-semibold",
        toneClass(darkMode, operationTone(operation)),
      )}
      aria-label={label}
    >
      {text}
    </span>
  );
}

function operationTone(
  operation: ProjectTreeTemplateParseData["preview"]["items"][number]["operation"],
): Tone {
  if (operation === "create") {
    return "emerald";
  }

  if (operation === "delete") {
    return "red";
  }

  if (operation === "preserve") {
    return "neutral";
  }

  return "blue";
}

function previewItemDepth(
  item: ProjectTreeTemplateParseData["preview"]["items"][number],
) {
  if (item.subject === "project") {
    return 0;
  }

  if (item.subject === "milestone") {
    return 1;
  }

  return item.location && item.location !== "No milestone" ? 2 : 1;
}

function previewIndentClass(depth: number) {
  if (depth >= 2) {
    return "w-12";
  }

  if (depth === 1) {
    return "w-6";
  }

  return "w-0";
}
