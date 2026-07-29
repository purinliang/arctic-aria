// Routines Page - Routine Template Editor Dialog.
import { useMemo } from "react";
import { toneClass } from "@/components/color";
import type { Tone } from "@/components/color";
import { List, ListItem, ListItemTitle } from "@/components/list";
import { ScrollArea } from "@/components/scroll-area";
import { SupportingText } from "@/components/text";
import { TemplateEditorDialog } from "@/components/template-editor-dialog";
import { cx } from "@/components/utils";
import type {
  RoutineDefinition,
  RoutineGroupOption,
} from "@/features/dashboard/types";
import type {
  RoutineInput,
  RoutineTemplateParseData,
} from "@/features/routines/actions";
import {
  routineTemplateForNewRoutine,
  routineTemplateForRoutine,
} from "@/features/routines/routine-template-serializer";
import type { RoutineMessages } from "@/messages/app-messages";

type TemplateMode = "create" | "update";

export function RoutineTemplateEditorDialog({
  darkMode,
  pending,
  mode,
  routine,
  draft,
  groups,
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
  routine: RoutineDefinition | null;
  draft: RoutineInput | null;
  groups: RoutineGroupOption[];
  messages: RoutineMessages["editor"]["template"];
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  onClose: () => void;
  onParse: (
    routineId: string | null,
    source: string,
  ) => Promise<RoutineTemplateParseData | null>;
  onApply: (routineId: string | null, source: string) => Promise<boolean>;
}) {
  const template = useMemo(
    () =>
      mode === "create"
        ? routineTemplateForNewRoutine({
            draft: draft ?? emptyRoutineTemplateDraft,
            groups,
          })
        : routine
          ? routineTemplateForRoutine({ routine, groups })
          : "",
    [draft, groups, mode, routine],
  );
  const routineId = mode === "update" ? routine?.id ?? null : null;

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
        const result = await onParse(routineId, source);

        return result?.preview ?? null;
      }}
      onApply={(source) => onApply(routineId, source)}
      renderPreview={(preview) => (
        <RoutineTemplatePreview
          darkMode={darkMode}
          messages={messages}
          preview={preview}
        />
      )}
    />
  );
}

const emptyRoutineTemplateDraft: RoutineInput = {
  groupId: null,
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  estimatedDurationMinutes: "",
  ruleType: "once",
  recurrenceOption: "once",
  intervalValue: null,
  weekdays: null,
  dayOfMonth: null,
  preferredTime: "",
  timezone: "",
};

function RoutineTemplatePreview({
  darkMode,
  messages,
  preview,
}: {
  darkMode: boolean;
  messages: RoutineMessages["editor"]["template"];
  preview: RoutineTemplateParseData["preview"];
}) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[var(--aa-field-group-gap)] overflow-hidden">
      <SupportingText darkMode={darkMode}>
        {messages.previewCounts(
          previewCount(preview.counts.create),
          previewCount(preview.counts.update),
          previewCount(preview.counts.delete),
          previewCount(preview.counts.preserve),
        )}
      </SupportingText>
      <ScrollArea
        className="relative h-full min-h-0 overflow-hidden"
        viewportClassName="h-full overflow-x-hidden"
        contentClassName="min-w-0"
        refreshKey={`${preview.items.length}-${preview.ignoredFieldCount}`}
      >
        <List darkMode={darkMode}>
          {preview.items.map((item, index) => (
            <ListItem
              darkMode={darkMode}
              key={`${item.title}-${index}`}
              className="min-w-0 items-center py-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-sm font-semibold leading-5 text-[var(--aa-secondary-text)]">
                  {messages.subject}:
                </span>
                <ListItemTitle className="min-w-0 flex-1" size="compact" truncate>
                  {item.title}
                </ListItemTitle>
                <OperationBadge
                  darkMode={darkMode}
                  operation={item.operation}
                  text={messages.operationBadges[item.operation]}
                />
              </div>
            </ListItem>
          ))}
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
  text,
}: {
  darkMode: boolean;
  operation: RoutineTemplateParseData["preview"]["items"][number]["operation"];
  text: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded border px-1.5 text-[11px] font-semibold",
        toneClass(darkMode, operationTone(operation)),
      )}
      aria-label={text}
    >
      {text}
    </span>
  );
}

function operationTone(
  operation: RoutineTemplateParseData["preview"]["items"][number]["operation"],
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
