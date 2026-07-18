// Projects Page - Project Task Editor Dialog.
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/button";
import type { Dispatch, SetStateAction } from "react";
import { DatePickerField } from "@/components/forms/date-picker-field";
import {
  DialogActionRow,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { SelectInput } from "@/components/forms/selection-field";
import { TextArea } from "@/components/forms/text-area-field";
import type {
  ProjectTaskInput,
  ProjectView,
} from "@/features/projects/actions";
import type { FormMessages, ProjectMessages } from "@/messages/app-messages";

export function ProjectTaskEditorDialog({
  darkMode,
  pending,
  saving,
  draft,
  milestones,
  messages,
  formMessages,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: ProjectTaskInput;
  milestones: ProjectView["milestones"];
  messages: ProjectMessages["editor"];
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogOverlay>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={draft.id ? messages.task.edit : messages.task.add}
            closeLabel={messages.task.close}
            onClose={onClose}
          />
          <div className="grid gap-3">
            <TaskBasics
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              messages={messages}
              setDraft={setDraft}
            />
            <TaskMeta
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              milestones={milestones}
              messages={messages}
              formMessages={formMessages}
              setDraft={setDraft}
            />
          </div>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              type="submit"
              disabled={pending}
              icon={<Save size={14} aria-hidden="true" />}
            >
              {saving ? messages.common.saving : messages.common.save}
            </DialogPrimaryButton>
            {onDelete ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
                className="w-full"
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={onDelete}
              >
                {messages.common.delete}
              </Button>
            ) : null}
          </DialogActionRow>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}

function TaskBasics({
  darkMode,
  pending,
  draft,
  messages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  messages: ProjectMessages["editor"];
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
}) {
  return (
    <>
      <FieldLabel darkMode={darkMode} label={messages.common.title}>
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          disabled={pending}
          placeholder={messages.task.titlePlaceholder}
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.common.description} optional>
        <TextArea
          darkMode={darkMode}
          className="min-h-24"
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
    </>
  );
}

function TaskMeta({
  darkMode,
  pending,
  draft,
  milestones,
  messages,
  formMessages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  milestones: ProjectView["milestones"];
  messages: ProjectMessages["editor"];
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
}) {
  return (
    <>
      <FieldLabel darkMode={darkMode} label={messages.task.milestone} optional>
        <SelectInput
          darkMode={darkMode}
          value={draft.milestoneId}
          disabled={pending}
          options={[
            { value: "", label: messages.task.noMilestone },
            ...milestones.map((milestone) => ({
              value: milestone.id,
              label: milestone.title,
            })),
          ]}
          onChange={(milestoneId) =>
            setDraft((current) => ({
              ...current,
              milestoneId,
            }))
          }
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel darkMode={darkMode} label={messages.common.startDate} optional>
          <DatePickerField
            darkMode={darkMode}
            value={draft.startDate}
            placeholder={messages.common.selectStartDate}
            messages={formMessages.datePicker}
            disabled={pending}
            onChange={(startDate) =>
              setDraft((current) => ({
                ...current,
                startDate,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.common.deadline} optional>
          <DatePickerField
            darkMode={darkMode}
            value={draft.deadlineDate}
            placeholder={messages.common.selectDeadline}
            messages={formMessages.datePicker}
            disabled={pending}
            onChange={(deadlineDate) =>
              setDraft((current) => ({
                ...current,
                deadlineDate,
              }))
            }
          />
        </FieldLabel>
      </div>
    </>
  );
}
