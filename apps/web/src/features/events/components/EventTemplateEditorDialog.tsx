// Events Page - Event Template Editor Dialog.
import { useMemo } from "react";
import { toneClass } from "@/components/color";
import type { Tone } from "@/components/color";
import { List, ListItem, ListItemTitle } from "@/components/list";
import { ScrollArea } from "@/components/scroll-area";
import { SupportingText } from "@/components/text";
import { TemplateEditorDialog } from "@/components/template-editor-dialog";
import { cx } from "@/components/utils";
import type { EventDefinition } from "@/features/dashboard/types";
import type {
  EventInput,
  EventTemplateParseData,
} from "@/features/events/actions";
import {
  eventTemplateForEvent,
  eventTemplateForNewEvent,
} from "@/features/events/event-template-serializer";
import type { EventMessages } from "@/messages/app-messages";

type TemplateMode = "create" | "update";

export function EventTemplateEditorDialog({
  darkMode,
  pending,
  mode,
  event,
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
  event: EventDefinition | null;
  draft: EventInput | null;
  messages: EventMessages["editor"]["template"];
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  onClose: () => void;
  onParse: (
    eventId: string | null,
    source: string,
  ) => Promise<EventTemplateParseData | null>;
  onApply: (eventId: string | null, source: string) => Promise<boolean>;
}) {
  const template = useMemo(
    () =>
      mode === "create"
        ? eventTemplateForNewEvent(draft ?? emptyEventTemplateDraft)
        : event
          ? eventTemplateForEvent(event)
          : "",
    [draft, event, mode],
  );
  const eventId = mode === "update" ? event?.id ?? null : null;

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
        const result = await onParse(eventId, source);

        return result?.preview ?? null;
      }}
      onApply={(source) => onApply(eventId, source)}
      renderPreview={(preview) => (
        <EventTemplatePreview
          darkMode={darkMode}
          messages={messages}
          preview={preview}
        />
      )}
    />
  );
}

const emptyEventTemplateDraft: EventInput = {
  groupId: null,
  title: "",
  description: "",
  eventDate: "",
  endDate: "",
  eventTime: "",
  ruleType: "once",
  estimatedDurationHours: "",
  location: "",
  timezone: "UTC",
};

function EventTemplatePreview({
  darkMode,
  messages,
  preview,
}: {
  darkMode: boolean;
  messages: EventMessages["editor"]["template"];
  preview: EventTemplateParseData["preview"];
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
  operation: EventTemplateParseData["preview"]["items"][number]["operation"];
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
  operation: EventTemplateParseData["preview"]["items"][number]["operation"],
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
