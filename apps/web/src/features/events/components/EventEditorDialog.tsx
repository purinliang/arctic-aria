// Events Page - Event Editor Dialog.
import { MoreHorizontal } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { ActionMenu, ActionMenuItem } from "@/components/action-menu";
import { Button } from "@/components/button";
import { CrudEditorDialog } from "@/components/dialog";
import { DatePickerField } from "@/components/forms/date-picker-field";
import { FormGrid, FormSection } from "@/components/forms/form-layout";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { TimePickerField } from "@/components/forms/time-picker-field";
import type { EventInput } from "@/features/events/actions";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";

export function EventEditorDialog({
  darkMode,
  pending,
  saving,
  draft,
  messages,
  formMessages,
  timeFormatPreference,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
  onTemplate,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: EventInput;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  setDraft: Dispatch<SetStateAction<EventInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  onTemplate?: () => void;
}) {
  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={draft.id ? messages.editor.edit : messages.editor.add}
      closeLabel={messages.editor.close}
      saveText={messages.editor.save}
      savingText={messages.editor.saving}
      deleteText={draft.id && !onTemplate ? messages.editor.delete : undefined}
      headerActions={
        onTemplate || onDelete ? (
          <EventEditorMenu
            darkMode={darkMode}
            disabled={pending}
            messages={messages.editor}
            onTemplate={onTemplate}
            onDelete={onDelete}
          />
        ) : undefined
      }
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={draft.id ? onDelete : undefined}
      layout="sections"
    >
      <EventTextFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        messages={messages.editor}
        setDraft={setDraft}
      />
      <EventScheduleFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        messages={messages.editor}
        formMessages={formMessages}
        timeFormatPreference={timeFormatPreference}
        setDraft={setDraft}
      />
      <EventMetadataFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        messages={messages.editor}
        setDraft={setDraft}
      />
    </CrudEditorDialog>
  );
}

function EventEditorMenu({
  darkMode,
  disabled,
  messages,
  onTemplate,
  onDelete,
}: {
  darkMode: boolean;
  disabled: boolean;
  messages: EventMessages["editor"];
  onTemplate?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        disabled={disabled}
        aria-label={messages.template.menuAriaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        icon={<MoreHorizontal size={16} aria-hidden="true" />}
        onClick={() => setOpen((current) => !current)}
      />
      {open ? (
        <ActionMenu
          label={messages.template.menuAriaLabel}
          closeLabel={messages.template.close}
          onDismiss={() => setOpen(false)}
        >
          {onTemplate ? (
            <ActionMenuItem
              darkMode={darkMode}
              onClick={() => {
                setOpen(false);
                onTemplate();
              }}
            >
              {messages.template.menuLabel}
            </ActionMenuItem>
          ) : null}
          {onDelete ? (
            <ActionMenuItem
              darkMode={darkMode}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              {messages.delete}
            </ActionMenuItem>
          ) : null}
        </ActionMenu>
      ) : null}
    </div>
  );
}

function EventTextFields({
  darkMode,
  pending,
  draft,
  messages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: EventInput;
  messages: EventMessages["editor"];
  setDraft: Dispatch<SetStateAction<EventInput>>;
}) {
  return (
    <FormSection>
      <FieldLabel darkMode={darkMode} label={messages.title}>
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          placeholder={messages.titlePlaceholder}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.description} optional>
        <TextArea
          darkMode={darkMode}
          value={draft.description}
          maxLength={2000}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </FormSection>
  );
}

function EventScheduleFields({
  darkMode,
  pending,
  draft,
  messages,
  formMessages,
  timeFormatPreference,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: EventInput;
  messages: EventMessages["editor"];
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  setDraft: Dispatch<SetStateAction<EventInput>>;
}) {
  return (
    <FormSection>
      <FormGrid columns={2}>
        <FieldLabel darkMode={darkMode} label={messages.date}>
          <DatePickerField
            darkMode={darkMode}
            placeholder={messages.selectDate}
            messages={formMessages.datePicker}
            value={draft.eventDate}
            disabled={pending}
            onChange={(eventDate) =>
              setDraft((current) => ({ ...current, eventDate }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.time}>
          <TimePickerField
            darkMode={darkMode}
            placeholder={messages.selectTime}
            messages={formMessages.timePicker}
            timeFormatPreference={timeFormatPreference}
            value={draft.eventTime}
            disabled={pending}
            allowClear={false}
            onChange={(eventTime) =>
              setDraft((current) => ({ ...current, eventTime }))
            }
          />
        </FieldLabel>
      </FormGrid>
    </FormSection>
  );
}

function EventMetadataFields({
  darkMode,
  pending,
  draft,
  messages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: EventInput;
  messages: EventMessages["editor"];
  setDraft: Dispatch<SetStateAction<EventInput>>;
}) {
  return (
    <FormSection>
      <FormGrid columns={2}>
        <FieldLabel
          darkMode={darkMode}
          label={messages.estimatedDuration}
          optional
        >
          <TextInput
            darkMode={darkMode}
            value={draft.estimatedDurationHours ?? ""}
            inputMode="decimal"
            disabled={pending}
            placeholder={messages.estimatedDurationPlaceholder}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                estimatedDurationHours: event.target.value,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.location} optional>
          <TextInput
            darkMode={darkMode}
            value={draft.location}
            maxLength={500}
            placeholder={messages.locationPlaceholder}
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                location: event.target.value,
              }))
            }
          />
        </FieldLabel>
      </FormGrid>
    </FormSection>
  );
}
