import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/button";
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
import { SelectInput } from "@/components/forms/selection-field";
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
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  milestones: ProjectView["milestones"];
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
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
            {onDelete ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
                className="w-full"
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={onDelete}
              >
                Delete
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
      <FieldLabel darkMode={darkMode} label="Milestone" optional>
        <SelectInput
          darkMode={darkMode}
          value={draft.milestoneId}
          disabled={pending}
          options={[
            { value: "", label: "No milestone" },
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
    </>
  );
}
