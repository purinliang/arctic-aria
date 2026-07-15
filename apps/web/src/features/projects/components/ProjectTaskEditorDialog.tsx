import { LoaderCircle, Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { DatePickerField } from "@/components/forms/date-picker-field";
import {
  DialogActionRow,
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { CheckboxField, SelectInput } from "@/components/forms/selection-field";
import { TextArea } from "@/components/forms/text-area-field";
import type {
  ProjectTaskInput,
  ProjectView,
} from "@/features/projects/actions";

export function ProjectTaskEditorDialog({
  darkMode,
  pending,
  draft,
  milestones,
  setDraft,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  milestones: ProjectView["milestones"];
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogOverlay>
      <DialogBackdrop label="Close task editor" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={draft.id ? "Edit task" : "Add task"}
            closeLabel="Close task editor"
            onClose={onClose}
          />
          <div className="grid gap-3">
            <TaskBasics
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              setDraft={setDraft}
            />
            <TaskMeta
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              milestones={milestones}
              setDraft={setDraft}
            />
          </div>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              type="submit"
              loading={pending}
              icon={<Save size={14} aria-hidden="true" />}
              loadingIcon={
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              }
            >
              Save
            </DialogPrimaryButton>
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
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
}) {
  return (
    <>
      <FieldLabel darkMode={darkMode} label="Title">
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          disabled={pending}
          placeholder="Task title"
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Description" optional>
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
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  milestones: ProjectView["milestones"];
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
}) {
  return (
    <>
      <FieldLabel darkMode={darkMode} label="Milestone">
        <SelectInput
          darkMode={darkMode}
          value={draft.milestoneId}
          disabled={pending || milestones.length === 0}
          options={milestones.map((milestone) => ({
            value: milestone.id,
            label: milestone.title,
          }))}
          onChange={(milestoneId) =>
            setDraft((current) => ({
              ...current,
              milestoneId,
            }))
          }
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel darkMode={darkMode} label="Start date" optional>
          <DatePickerField
            darkMode={darkMode}
            value={draft.startDate}
            placeholder="Select start date"
            disabled={pending}
            onChange={(startDate) =>
              setDraft((current) => ({
                ...current,
                startDate,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label="Deadline" optional>
          <DatePickerField
            darkMode={darkMode}
            value={draft.deadlineDate}
            placeholder="Select deadline"
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
      <div className="grid gap-3">
        <CheckboxField
          darkMode={darkMode}
          label="Done"
          checked={draft.status === "done"}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              status: event.target.checked ? "done" : "todo",
            }))
          }
        />
      </div>
    </>
  );
}
