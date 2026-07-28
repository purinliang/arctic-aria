// Routines Page - Routine Editor Dialog.
import type { Dispatch, SetStateAction } from "react";
import { useDefaultDescriptionPlaceholder } from "@/components/default-description-placeholder";
import { CrudEditorDialog } from "@/components/dialog";
import { formFieldClass } from "@/components/control-layout";
import { DatePickerField } from "@/components/forms/date-picker-field";
import {
  FormFieldStack,
  FormGrid,
  FormSection,
} from "@/components/forms/form-layout";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { TextArea } from "@/components/forms/text-area-field";
import { TimePickerField } from "@/components/forms/time-picker-field";
import { SelectInput } from "@/components/forms/selection-field";
import type { RoutineGroupOption } from "@/features/dashboard/types";
import type { RoutineInput } from "@/features/routines/actions";
import { normalizeRoutineRecurrenceDraft } from "@/features/routines/routine-recurrence";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import {
  formatTimeZoneOffset,
  selectableTimeZones,
} from "@/features/settings/time-zones";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";
import { LabelText, SupportingText } from "@/components/text";
import { RoutineRecurrenceFields } from "./RoutineRecurrenceFields";

export function RoutineEditorDialog({
  darkMode,
  pending,
  saving,
  draft,
  groups,
  messages,
  formMessages,
  timeFormatPreference,
  multipleTimezonesEnabled,
  resolvedTimeZone,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: RoutineInput;
  groups: RoutineGroupOption[];
  messages: RoutineMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  multipleTimezonesEnabled: boolean;
  resolvedTimeZone: string;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  const descriptionPlaceholder = useDefaultDescriptionPlaceholder(
    messages.defaultDescriptions,
    draft.title,
  );

  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={draft.id ? messages.editor.edit : messages.editor.add}
      closeLabel={messages.editor.close}
      saveText={messages.editor.save}
      savingText={messages.editor.saving}
      deleteText={draft.id ? messages.editor.delete : undefined}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={draft.id ? onDelete : undefined}
      layout="sections"
    >
      <RoutineTextFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        messages={messages.editor}
        descriptionPlaceholder={descriptionPlaceholder}
        setDraft={setDraft}
      />
      <RoutineGroupField
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        groups={groups}
        messages={messages}
        setDraft={setDraft}
      />
      <RoutineScheduleFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        messages={messages.editor}
        formMessages={formMessages}
        timeFormatPreference={timeFormatPreference}
        multipleTimezonesEnabled={multipleTimezonesEnabled}
        resolvedTimeZone={resolvedTimeZone}
        setDraft={setDraft}
      />
      <RecurrenceFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        messages={messages}
        formMessages={formMessages}
        setDraft={setDraft}
      />
    </CrudEditorDialog>
  );
}

function RoutineGroupField({
  darkMode,
  pending,
  draft,
  groups,
  messages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  groups: RoutineGroupOption[];
  messages: RoutineMessages;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <div className={formFieldClass}>
      <LabelText darkMode={darkMode}>{messages.editor.group}</LabelText>
      <SingleChoiceGroup
        darkMode={darkMode}
        value={draft.groupId || "none"}
        disabled={pending}
        options={[
          {
            value: "none",
            label: messages.groups.noGroup,
          },
          ...groups.map((group) => ({
            value: group.id,
            label: group.name,
          })),
        ]}
        onChange={(groupId) =>
          setDraft((current) => ({
            ...current,
            groupId: groupId === "none" ? null : groupId,
          }))
        }
      />
    </div>
  );
}

function RoutineTextFields({
  darkMode,
  pending,
  draft,
  messages,
  descriptionPlaceholder,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages["editor"];
  descriptionPlaceholder: string;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
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
          placeholder={descriptionPlaceholder}
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

function RecurrenceFields({
  darkMode,
  pending,
  draft,
  messages,
  formMessages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages;
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <RoutineRecurrenceFields
      darkMode={darkMode}
      pending={pending}
      draft={draft}
      messages={messages}
      formMessages={formMessages}
      setDraft={setDraft}
    />
  );
}

function RoutineScheduleFields({
  darkMode,
  pending,
  draft,
  messages,
  formMessages,
  timeFormatPreference,
  multipleTimezonesEnabled,
  resolvedTimeZone,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages["editor"];
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  multipleTimezonesEnabled: boolean;
  resolvedTimeZone: string;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  const timezoneOptions = selectableTimeZones([
    resolvedTimeZone,
    draft.timezone ?? "",
  ]).map((timezone) => ({
    value: timezone,
    label: timezone,
    description: formatTimeZoneOffset(timezone),
  }));

  return (
    <FormSection>
      <FormGrid columns={3}>
        <FieldLabel darkMode={darkMode} label={messages.firstStartDate}>
          <DatePickerField
            darkMode={darkMode}
            placeholder={messages.selectFirstDate}
            messages={formMessages.datePicker}
            value={draft.firstStartDate}
            disabled={pending}
            onChange={(firstStartDate) =>
              setDraft((current) =>
                normalizeRoutineRecurrenceDraft({
                  ...current,
                  firstStartDate,
                }),
              )
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.endDate}>
          <DatePickerField
            darkMode={darkMode}
            placeholder={messages.selectEndDate}
            messages={formMessages.datePicker}
            value={draft.endDate ?? ""}
            disabled={pending}
            onChange={(endDate) =>
              setDraft((current) => ({ ...current, endDate }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.preferredTime}>
          <TimePickerField
            darkMode={darkMode}
            placeholder={messages.selectTime}
            messages={formMessages.timePicker}
            timeFormatPreference={timeFormatPreference}
            value={draft.preferredTime ?? ""}
            disabled={pending}
            onChange={(preferredTime) =>
              setDraft((current) => ({
                ...current,
                preferredTime,
              }))
            }
          />
        </FieldLabel>
      </FormGrid>
      {multipleTimezonesEnabled ? (
        <FormFieldStack>
          <FieldLabel darkMode={darkMode} label={messages.timezone}>
            <SelectInput
              darkMode={darkMode}
              value={draft.timezone || resolvedTimeZone}
              options={timezoneOptions}
              disabled={pending}
              onChange={(timezone) =>
                setDraft((current) => ({
                  ...current,
                  timezone,
                }))
              }
            />
          </FieldLabel>
          <SupportingText darkMode={darkMode}>
            {messages.timezoneHint}
          </SupportingText>
        </FormFieldStack>
      ) : null}
    </FormSection>
  );
}
