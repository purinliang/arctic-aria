// Projects Page - Project Tree Template Dialog.
import { useMemo } from "react";
import { toneClass } from "@/components/color";
import type { Tone } from "@/components/color";
import {
  List,
  ListItem,
  ListItemTitle,
} from "@/components/list";
import { ScrollArea } from "@/components/scroll-area";
import { SupportingText } from "@/components/text";
import { TemplateEditorDialog } from "@/components/template-editor-dialog";
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

type TemplateMode = "create" | "update";

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

  return (
    <TemplateEditorDialog
      darkMode={darkMode}
      pending={pending}
      initialSource={template}
      messages={messages}
      showErrorNotification={showErrorNotification}
      showSuccessNotification={showSuccessNotification}
      onClose={onClose}
      onParse={async (source) => {
        const result = await onParse(projectId, source);

        return result?.preview ?? null;
      }}
      onApply={(source) => onApply(projectId, source)}
      renderPreview={(preview) => (
        <ProjectTreeTemplatePreview
          darkMode={darkMode}
          messages={messages}
          preview={preview}
        />
      )}
    />
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

function ProjectTreeTemplatePreview({
  darkMode,
  messages,
  preview,
}: {
  darkMode: boolean;
  messages: ProjectMessages["editor"]["template"];
  preview: ProjectTreeTemplateParseData["preview"];
}) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[var(--aa-field-group-gap)] overflow-hidden">
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
    </div>
  );
}

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
