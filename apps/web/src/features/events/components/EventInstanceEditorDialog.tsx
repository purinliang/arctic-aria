// Events Page - Event Instance Editor Dialog.
import type { Dispatch, SetStateAction } from "react";
import { CrudEditorDialog } from "@/components/dialog";
import { textAreaMinHeightMdClass } from "@/components/control-layout";
import { DatePickerField } from "@/components/forms/date-picker-field";
import { FormGrid, FormSection } from "@/components/forms/form-layout";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { TimePickerField } from "@/components/forms/time-picker-field";
import type { EventInstanceInput } from "@/features/events/actions";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";

export function EventInstanceEditorDialog({
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
  onCancel,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: EventInstanceInput;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  setDraft: Dispatch<SetStateAction<EventInstanceInput | null>>;
  onClose: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={messages.instances.editTitle}
      closeLabel={messages.instances.closeEditor}
      saveText={messages.instances.save}
      savingText={messages.instances.saving}
      deleteText={messages.instances.cancel}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onCancel}
      layout="sections"
    >
      <FormSection>
        <FormGrid columns={2}>
          <FieldLabel darkMode={darkMode} label={messages.instances.date}>
            <DatePickerField
              darkMode={darkMode}
              placeholder={messages.editor.selectDate}
              messages={formMessages.datePicker}
              value={draft.eventDate}
              disabled={pending}
              onChange={(eventDate) =>
                setDraft((current) =>
                  current ? { ...current, eventDate } : current,
                )
              }
            />
          </FieldLabel>
          <FieldLabel darkMode={darkMode} label={messages.instances.time}>
            <TimePickerField
              darkMode={darkMode}
              placeholder={messages.editor.selectTime}
              messages={formMessages.timePicker}
              timeFormatPreference={timeFormatPreference}
              value={draft.eventTime}
              disabled={pending}
              allowClear={false}
              onChange={(eventTime) =>
                setDraft((current) =>
                  current ? { ...current, eventTime } : current,
                )
              }
            />
          </FieldLabel>
        </FormGrid>
      </FormSection>
      <FormSection>
        <FieldLabel
          darkMode={darkMode}
          label={messages.instances.locationOverride}
          optional
        >
          <TextInput
            darkMode={darkMode}
            value={draft.locationOverride ?? ""}
            maxLength={500}
            placeholder={
              draft.effectiveLocation || messages.editor.locationPlaceholder
            }
            disabled={pending}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? { ...current, locationOverride: event.target.value }
                  : current,
              )
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.instances.reason} optional>
          <TextArea
            darkMode={darkMode}
            className={textAreaMinHeightMdClass}
            value={draft.reason ?? ""}
            maxLength={500}
            disabled={pending}
            onChange={(event) =>
              setDraft((current) =>
                current ? { ...current, reason: event.target.value } : current,
              )
            }
          />
        </FieldLabel>
      </FormSection>
    </CrudEditorDialog>
  );
}
