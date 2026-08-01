// Events Page.
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Panel } from "@/components/panel";
import {
  splitPanelClass,
  splitPanelColumnClass,
} from "@/components/spacing";
import type {
  EventDefinition,
  EventGroupOption,
  ScheduledEvent,
} from "@/features/dashboard/types";
import {
  filterInstancesByDate,
  type InstanceDateFilter,
} from "@/features/instance-date-filters";
import type {
  EventGroupInput,
  EventInstanceInput,
  EventInput,
  EventTemplateParseData,
} from "@/features/events/actions";
import { localScheduledDateKey } from "@/features/settings/time-zones";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";
import { EventEditorDialog } from "./EventEditorDialog";
import { EventFiltersPanel } from "./EventFiltersPanel";
import { EventGroupManagerDialog } from "./EventGroupManagerDialog";
import { EventGroupsPanel } from "./EventGroupsPanel";
import { EventInstanceEditorDialog } from "./EventInstanceEditorDialog";
import { EventInstancesList } from "./EventInstancesList";
import { EventTemplateEditorDialog } from "./EventTemplateEditorDialog";
import { EventsList } from "./EventsList";
import {
  emptyEventDraft,
  filterEventsByGroup,
  sortEventGroups,
  toEventDraft,
  type EventGroupFilter,
} from "./event-page-helpers";

type EventResult = Promise<boolean>;
type EventGroupResult = Promise<boolean>;
type ConfirmationTarget = {
  type: "event" | "group" | "instance";
  id: string;
  title: string;
  reason?: string | null;
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

const emptyGroupDraft: EventGroupInput = {
  name: "",
  description: "",
};

export function EventsPage({
  darkMode,
  events,
  eventInstances,
  eventGroups,
  loading,
  pending,
  messages,
  formMessages,
  timeFormatPreference,
  resolvedTimeZone,
  onEventSave,
  onEventDelete,
  onEventGroupSave,
  onEventGroupDelete,
  onEventInstanceSave,
  onEventInstanceCancel,
  onEventTemplateParse,
  onEventTemplateApply,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  events: EventDefinition[];
  eventInstances: ScheduledEvent[];
  eventGroups: EventGroupOption[];
  loading: boolean;
  pending: boolean;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  resolvedTimeZone: string;
  onEventSave: (input: EventInput) => EventResult;
  onEventDelete: (eventId: string) => EventResult;
  onEventGroupSave: (input: EventGroupInput) => EventGroupResult;
  onEventGroupDelete: (groupId: string) => EventGroupResult;
  onEventInstanceSave: (input: EventInstanceInput) => EventResult;
  onEventInstanceCancel: (
    input: Pick<EventInstanceInput, "id" | "reason">,
  ) => EventResult;
  onEventTemplateParse: (
    eventId: string | null,
    source: string,
  ) => Promise<EventTemplateParseData | null>;
  onEventTemplateApply: (eventId: string | null, source: string) => EventResult;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const sortedGroups = useMemo(
    () => sortEventGroups(eventGroups),
    [eventGroups],
  );
  const [groupFilter, setGroupFilter] = useState<EventGroupFilter>("All");
  const [instanceFilter, setInstanceFilter] =
    useState<InstanceDateFilter>("recent");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<EventInput>(() =>
    emptyEventDraft(resolvedTimeZone),
  );
  const [groupManagerOpen, setGroupManagerOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [groupDraft, setGroupDraft] =
    useState<EventGroupInput>(emptyGroupDraft);
  const [instanceDraft, setInstanceDraft] =
    useState<EventInstanceInput | null>(null);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
  const [templateTarget, setTemplateTarget] =
    useState<EventTemplateTarget | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const activeGroupFilter =
    groupFilter === "All" ||
    groupFilter === "none" ||
    sortedGroups.some((group) => group.id === groupFilter)
      ? groupFilter
      : "All";
  const visibleEvents = filterEventsByGroup(events, activeGroupFilter);
  const visibleEventIds = new Set(visibleEvents.map((event) => event.id));
  const groupFilteredEventInstances =
    activeGroupFilter === "All"
      ? eventInstances
      : eventInstances.filter((instance) =>
          visibleEventIds.has(instance.eventId),
        );
  const referenceDate = localScheduledDateKey({
    date: new Date(),
    timeZone: resolvedTimeZone,
  });
  const visibleInstances = filterInstancesByDate(
    groupFilteredEventInstances.map((event) => ({
      ...event,
      scheduledDate: event.eventDate,
    })),
    instanceFilter,
    referenceDate,
  );
  const templateEvent =
    templateTarget?.mode === "update"
      ? events.find((event) => event.id === templateTarget.eventId) ?? null
      : null;

  function selectedGroupId() {
    return sortedGroups.some((group) => group.id === activeGroupFilter)
      ? activeGroupFilter
      : null;
  }

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

  function closeInstanceEditor() {
    if (!pending && dialogAction === null) {
      setInstanceDraft(null);
    }
  }

  function openNewEditor() {
    setDraft({
      ...emptyEventDraft(resolvedTimeZone),
      groupId: selectedGroupId(),
    });
    setEditorOpen(true);
  }

  function openEditor(event: EventDefinition) {
    setDraft(toEventDraft(event));
    setEditorOpen(true);
  }

  function openInstanceEditor(instance: ScheduledEvent) {
    setInstanceDraft({
      id: instance.id,
      title: instance.title,
      eventDate: instance.eventDate,
      eventTime: instance.eventTime,
      locationOverride: instance.locationOverride ?? "",
      effectiveLocation: instance.location,
      reason: "",
    });
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

  async function submitEventInstance() {
    if (!instanceDraft) {
      return;
    }

    setDialogAction("save");

    try {
      const saved = await onEventInstanceSave(instanceDraft);

      if (saved) {
        setInstanceDraft(null);
      }
    } finally {
      setDialogAction(null);
    }
  }

  function closeGroupManager() {
    if (!pending && dialogAction === null) {
      setGroupManagerOpen(false);
      setGroupFormOpen(false);
      setGroupDraft(emptyGroupDraft);
    }
  }

  function closeGroupForm() {
    if (!pending && dialogAction === null) {
      setGroupFormOpen(false);
      setGroupDraft(emptyGroupDraft);
    }
  }

  function openNewGroupEditor() {
    setGroupDraft(emptyGroupDraft);
    setGroupFormOpen(true);
  }

  function openGroupEditor(group: EventGroupOption) {
    setGroupDraft({
      id: group.id,
      name: group.name,
      description: group.description ?? "",
    });
    setGroupFormOpen(true);
  }

  async function submitGroup() {
    setDialogAction("save");

    try {
      const saved = await onEventGroupSave(groupDraft);

      if (saved) {
        setGroupDraft(emptyGroupDraft);
        setGroupFormOpen(false);
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
      const deleted =
        confirmationTarget.type === "event"
          ? await onEventDelete(confirmationTarget.id)
          : confirmationTarget.type === "group"
            ? await onEventGroupDelete(confirmationTarget.id)
            : await onEventInstanceCancel({
                id: confirmationTarget.id,
                reason: confirmationTarget.reason ?? null,
              });

      if (deleted) {
        setConfirmationTarget(null);
        if (confirmationTarget.type === "event") {
          setEditorOpen(false);
          setDraft(emptyEventDraft(resolvedTimeZone));
        } else if (confirmationTarget.type === "group") {
          setGroupFilter((current) =>
            current === confirmationTarget.id ? "All" : current,
          );
          setGroupFormOpen(false);
          setGroupDraft(emptyGroupDraft);
        } else {
          setInstanceDraft(null);
        }
      }
    } finally {
      setDialogAction(null);
    }
  }

  function openEventDeleteConfirmation() {
    if (!draft.id) {
      return;
    }

    setConfirmationTarget({
      type: "event",
      id: draft.id,
      title: draft.title || messages.confirm.fallback,
    });
  }

  function openInstanceCancelConfirmation() {
    if (!instanceDraft) {
      return;
    }

    setConfirmationTarget({
      type: "instance",
      id: instanceDraft.id,
      title: instanceDraft.title || messages.instances.cancelFallback,
      reason: instanceDraft.reason ?? null,
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
        <div className={splitPanelClass}>
          <div className={splitPanelColumnClass}>
            <Panel darkMode={darkMode}>
              <EventsPageHeader
                darkMode={darkMode}
                pending={pending}
                messages={messages.page}
                onAdd={openNewEditor}
              />
              <EventsList
                darkMode={darkMode}
                events={visibleEvents}
                loading={loading}
                pending={pending}
                paginationKey={activeGroupFilter}
                messages={messages}
                formMessages={formMessages}
                timeFormatPreference={timeFormatPreference}
                onEdit={openEditor}
              />
            </Panel>

            <Panel darkMode={darkMode}>
              <CardHeader
                darkMode={darkMode}
                icon={<CalendarDays size={18} aria-hidden="true" />}
                title={messages.instances.title}
                description={messages.instances.description}
              />
              <EventInstancesList
                darkMode={darkMode}
                instances={visibleInstances}
                loading={loading}
                messages={messages}
                formMessages={formMessages}
                timeFormatPreference={timeFormatPreference}
                pending={pending}
                paginationKey={`${activeGroupFilter}-${instanceFilter}`}
                onEdit={openInstanceEditor}
              />
            </Panel>
          </div>

          <aside className={splitPanelColumnClass}>
            <EventFiltersPanel
              darkMode={darkMode}
              disabled={pending}
              filter={instanceFilter}
              messages={messages.filters}
              onFilterChange={setInstanceFilter}
            />
            <EventGroupsPanel
              darkMode={darkMode}
              filter={activeGroupFilter}
              groups={sortedGroups}
              pending={pending}
              messages={messages.groups}
              onFilterChange={setGroupFilter}
              onManage={() => setGroupManagerOpen(true)}
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
          groups={sortedGroups}
          setDraft={setDraft}
          messages={messages}
          formMessages={formMessages}
          timeFormatPreference={timeFormatPreference}
          onClose={closeEditor}
          onSubmit={() => void submitEvent()}
          onDelete={draft.id ? openEventDeleteConfirmation : undefined}
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

      {instanceDraft ? (
        <EventInstanceEditorDialog
          darkMode={darkMode}
          pending={pending || dialogAction !== null}
          saving={dialogAction === "save"}
          draft={instanceDraft}
          messages={messages}
          formMessages={formMessages}
          timeFormatPreference={timeFormatPreference}
          setDraft={setInstanceDraft}
          onClose={closeInstanceEditor}
          onSubmit={() => void submitEventInstance()}
          onCancel={openInstanceCancelConfirmation}
        />
      ) : null}

      {groupManagerOpen ? (
        <EventGroupManagerDialog
          darkMode={darkMode}
          pending={pending || dialogAction !== null}
          saving={dialogAction === "save"}
          groups={sortedGroups}
          groupDraft={groupDraft}
          groupFormOpen={groupFormOpen}
          messages={messages.groups}
          setGroupDraft={setGroupDraft}
          onCloseEditor={closeGroupManager}
          onCloseForm={closeGroupForm}
          onOpenNew={openNewGroupEditor}
          onOpenEdit={openGroupEditor}
          onSubmit={() => void submitGroup()}
          onDelete={(group) =>
            setConfirmationTarget({
              type: "group",
              id: group.id,
              title: group.name || messages.groups.confirmFallback,
            })
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending || dialogAction === "delete"}
          title={
            confirmationTarget.type === "event"
              ? messages.confirm.title
              : confirmationTarget.type === "group"
                ? messages.groups.confirmTitle
                : messages.instances.cancelTitle
          }
          description={
            confirmationTarget.type === "event"
              ? messages.confirm.description(confirmationTarget.title)
              : confirmationTarget.type === "group"
                ? messages.groups.confirmDescription(confirmationTarget.title)
                : messages.instances.cancelDescription(confirmationTarget.title)
          }
          cancelText={messages.confirm.cancel}
          confirmText={
            confirmationTarget.type === "instance"
              ? messages.instances.cancel
              : messages.confirm.confirm
          }
          pendingConfirmText={
            confirmationTarget.type === "instance"
              ? messages.instances.canceling
              : messages.confirm.deleting
          }
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
