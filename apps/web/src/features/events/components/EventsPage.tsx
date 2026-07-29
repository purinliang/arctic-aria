// Events Page.
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Panel } from "@/components/panel";
import type { ScheduledEvent } from "@/features/dashboard/types";
import type {
  EventInput,
  EventTemplateParseData,
} from "@/features/events/actions";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";
import { EventEditorDialog } from "./EventEditorDialog";
import { EventFiltersPanel } from "./EventFiltersPanel";
import { EventTemplateEditorDialog } from "./EventTemplateEditorDialog";
import { EventsList } from "./EventsList";
import {
  emptyEventDraft,
  filterEventGroups,
  splitEventsByCurrentTime,
  toEventDraft,
  type EventTimeFilter,
} from "./event-page-helpers";

type EventResult = Promise<boolean>;
type ConfirmationTarget = {
  id: string;
  title: string;
};
type DialogAction = "save" | "delete" | null;
type EventTemplateTarget =
  | {
      mode: "create";
      draft: EventInput;
    }
  | {
      mode: "update";
      eventId: string;
    };

export function EventsPage({
  darkMode,
  events,
  loading,
  pending,
  messages,
  formMessages,
  timeFormatPreference,
  resolvedTimeZone,
  onEventSave,
  onEventDelete,
  onEventTemplateParse,
  onEventTemplateApply,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  events: ScheduledEvent[];
  loading: boolean;
  pending: boolean;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  resolvedTimeZone: string;
  onEventSave: (input: EventInput) => EventResult;
  onEventDelete: (eventId: string) => EventResult;
  onEventTemplateParse: (
    eventId: string | null,
    source: string,
  ) => Promise<EventTemplateParseData | null>;
  onEventTemplateApply: (eventId: string | null, source: string) => EventResult;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<EventInput>(() =>
    emptyEventDraft(resolvedTimeZone),
  );
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
  const [templateTarget, setTemplateTarget] =
    useState<EventTemplateTarget | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [eventFilter, setEventFilter] =
    useState<EventTimeFilter>("upcoming");
  const groupedEvents = useMemo(
    () =>
      splitEventsByCurrentTime({
        events,
        timeZone: resolvedTimeZone,
      }),
    [events, resolvedTimeZone],
  );
  const visibleEventGroups = useMemo(
    () => filterEventGroups(groupedEvents, eventFilter),
    [eventFilter, groupedEvents],
  );
  const templateEvent =
    templateTarget?.mode === "update"
      ? events.find((event) => event.id === templateTarget.eventId) ?? null
      : null;

  function closeEditor() {
    if (!pending && dialogAction === null) {
      setEditorOpen(false);
      setTemplateTarget(null);
      setDraft(emptyEventDraft(resolvedTimeZone));
    }
  }

  function closeEventTemplate() {
    if (!pending && dialogAction === null) {
      setTemplateTarget(null);
    }
  }

  function openNewEditor() {
    setDraft(emptyEventDraft(resolvedTimeZone));
    setEditorOpen(true);
  }

  function openEditor(event: ScheduledEvent) {
    setDraft(toEventDraft(event));
    setEditorOpen(true);
  }

  async function submitEvent() {
    setDialogAction("save");

    try {
      const saved = await onEventSave(draft);

      if (saved) {
        setEditorOpen(false);
        setDraft(emptyEventDraft(resolvedTimeZone));
      }
    } finally {
      setDialogAction(null);
    }
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    setDialogAction("delete");

    try {
      const deleted = await onEventDelete(confirmationTarget.id);

      if (deleted) {
        setConfirmationTarget(null);
        setEditorOpen(false);
        setDraft(emptyEventDraft(resolvedTimeZone));
      }
    } finally {
      setDialogAction(null);
    }
  }

  function openDeleteConfirmation() {
    if (!draft.id) {
      return;
    }

    setConfirmationTarget({
      id: draft.id,
      title: draft.title || messages.confirm.fallback,
    });
  }

  async function applyEventTemplate(eventId: string | null, source: string) {
    const applied = await onEventTemplateApply(eventId, source);

    if (applied) {
      setTemplateTarget(null);
      setEditorOpen(false);
      setDraft(emptyEventDraft(resolvedTimeZone));
    }

    return applied;
  }

  return (
    <>
      <section className="aa-split-container">
        <div className="aa-split-panel gap-4">
          <div className="grid min-w-0 content-start gap-4">
            <Panel darkMode={darkMode}>
              <EventsPageHeader
                darkMode={darkMode}
                pending={pending}
                messages={messages.page}
                onAdd={openNewEditor}
              />
              <EventsList
                darkMode={darkMode}
                upcomingEvents={visibleEventGroups.upcoming}
                pastEvents={visibleEventGroups.past}
                loading={loading}
                pending={pending}
                filter={eventFilter}
                messages={messages}
                formMessages={formMessages}
                timeFormatPreference={timeFormatPreference}
                onEdit={openEditor}
              />
            </Panel>
          </div>

          <aside className="grid content-start gap-4">
            <EventFiltersPanel
              darkMode={darkMode}
              disabled={pending}
              filter={eventFilter}
              messages={messages.filters}
              onFilterChange={setEventFilter}
            />
          </aside>
        </div>
      </section>

      {editorOpen ? (
        <EventEditorDialog
          darkMode={darkMode}
          pending={pending || dialogAction !== null}
          saving={dialogAction === "save"}
          draft={draft}
          setDraft={setDraft}
          messages={messages}
          formMessages={formMessages}
          timeFormatPreference={timeFormatPreference}
          onClose={closeEditor}
          onSubmit={() => void submitEvent()}
          onDelete={draft.id ? openDeleteConfirmation : undefined}
          onTemplate={() =>
            setTemplateTarget(
              draft.id
                ? { mode: "update", eventId: draft.id }
                : { mode: "create", draft },
            )
          }
        />
      ) : null}

      {templateTarget && (templateTarget.mode === "create" || templateEvent) ? (
        <EventTemplateEditorDialog
          key={
            templateTarget.mode === "update"
              ? templateTarget.eventId
              : "create"
          }
          darkMode={darkMode}
          pending={pending}
          mode={templateTarget.mode}
          event={templateTarget.mode === "update" ? templateEvent : null}
          draft={templateTarget.mode === "create" ? templateTarget.draft : null}
          messages={messages.editor.template}
          showErrorNotification={showErrorNotification}
          showSuccessNotification={showSuccessNotification}
          onClose={closeEventTemplate}
          onParse={onEventTemplateParse}
          onApply={applyEventTemplate}
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending || dialogAction === "delete"}
          title={messages.confirm.title}
          description={messages.confirm.description(confirmationTarget.title)}
          cancelText={messages.confirm.cancel}
          confirmText={messages.confirm.confirm}
          pendingConfirmText={messages.confirm.deleting}
          closeLabel={messages.confirm.close}
          confirmIcon={<Trash2 size={14} aria-hidden="true" />}
          onCancel={() => {
            if (!pending && dialogAction === null) {
              setConfirmationTarget(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}

function EventsPageHeader({
  darkMode,
  pending,
  messages,
  onAdd,
}: {
  darkMode: boolean;
  pending: boolean;
  messages: EventMessages["page"];
  onAdd: () => void;
}) {
  return (
    <CardHeader
      darkMode={darkMode}
      icon={<CalendarDays size={18} aria-hidden="true" />}
      title={messages.title}
      description={messages.description}
      action={
        <Button
          darkMode={darkMode}
          disabled={pending}
          icon={<Plus size={15} aria-hidden="true" />}
          onClick={onAdd}
        >
          {messages.new}
        </Button>
      }
    />
  );
}
