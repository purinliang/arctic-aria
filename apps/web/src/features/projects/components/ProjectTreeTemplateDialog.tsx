// Projects Page - Project Tree Template Dialog.
import { ClipboardCopy, FileText, Save } from "lucide-react";
import { useMemo, useState } from "react";
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
import { templateInputMinHeightClass } from "@/components/control-layout";
import { FormSection, FormSections } from "@/components/forms/form-layout";
import { FieldLabel } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import {
  List,
  ListItem,
  ListItemTitle,
} from "@/components/list";
import { LabelText, SupportingText } from "@/components/text";
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
  const [copyStatus, setCopyStatus] = useState("");
  const [action, setAction] = useState<TemplateAction | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateTab>("edit");
  const busy = pending || action !== null;
  const hasFreshPreview = Boolean(preview && parsedSource === source);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(template);
      setCopyStatus(messages.copied);
    } catch {
      setCopyStatus(messages.copyFailed);
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

  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogFrame darkMode={darkMode} size="lg">
        <DialogHeader
          darkMode={darkMode}
          title={messages.title}
          closeLabel={messages.close}
          onClose={onClose}
        />
        <TemplateTabs
          darkMode={darkMode}
          activeTab={activeTab}
          messages={messages}
          onChange={setActiveTab}
        />
        <FormSections>
          {activeTab === "edit" ? (
            <FormSection>
              <FieldLabel darkMode={darkMode} label={messages.inputLabel}>
                <TextArea
                  darkMode={darkMode}
                  className={`${templateInputMinHeightClass} font-mono text-sm leading-6`}
                  value={source}
                  disabled={busy}
                  placeholder={messages.inputPlaceholder}
                  spellCheck={false}
                  onChange={(event) => {
                    setSource(event.target.value);
                    setPreview(null);
                    setParsedSource("");
                    setActiveTab("edit");
                  }}
                />
              </FieldLabel>
              {copyStatus ? (
                <SupportingText darkMode={darkMode}>{copyStatus}</SupportingText>
              ) : null}
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
          <DialogActionRow>
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
            <Button
              darkMode={darkMode}
              size="md"
              disabled={busy}
              className="w-full"
              icon={<FileText size={14} aria-hidden="true" />}
              onClick={() => void parseTemplate()}
            >
              {action === "parse" ? messages.parsing : messages.parse}
            </Button>
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

function TemplateTabs({
  darkMode,
  activeTab,
  messages,
  onChange,
}: {
  darkMode: boolean;
  activeTab: TemplateTab;
  messages: ProjectMessages["editor"]["template"];
  onChange: (tab: TemplateTab) => void;
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
        onClick={() => onChange("edit")}
      >
        {messages.editTab}
      </Button>
      <Button
        darkMode={darkMode}
        active={activeTab === "preview"}
        size="md"
        role="tab"
        aria-selected={activeTab === "preview"}
        onClick={() => onChange("preview")}
      >
        {messages.previewTab}
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
      <FormSection>
        <LabelText darkMode={darkMode}>{messages.previewTitle}</LabelText>
        <SupportingText darkMode={darkMode}>
          {messages.previewEmpty}
        </SupportingText>
      </FormSection>
    );
  }

  return (
    <FormSection>
      <div className="grid min-w-0 gap-1">
        <LabelText darkMode={darkMode}>{messages.previewTitle}</LabelText>
        <SupportingText darkMode={darkMode}>
          {messages.previewCounts(
            preview.counts.create,
            preview.counts.update,
            preview.counts.delete,
          )}
        </SupportingText>
        {preview.ignoredFieldCount > 0 ? (
          <SupportingText darkMode={darkMode}>
            {messages.ignoredFields(preview.ignoredFieldCount)}
          </SupportingText>
        ) : null}
      </div>
      <List darkMode={darkMode} className="max-h-[28rem] overflow-auto">
        {preview.items.map((item, index) => {
          const depth = previewItemDepth(item);

          return (
            <ListItem
              darkMode={darkMode}
              key={`${item.subject}-${index}`}
              className={cx(
                "min-w-0 items-center py-2",
                previewIndentClass(depth),
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <OperationBadge
                  darkMode={darkMode}
                  operation={item.operation}
                  label={messages.operations[item.operation]}
                  text={messages.operationBadges[item.operation]}
                />
                <ListItemTitle className="min-w-0" size="compact" truncate>
                  {item.title}
                </ListItemTitle>
              </div>
            </ListItem>
          );
        })}
      </List>
    </FormSection>
  );
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
    return "pl-12";
  }

  if (depth === 1) {
    return "pl-8";
  }

  return "";
}
