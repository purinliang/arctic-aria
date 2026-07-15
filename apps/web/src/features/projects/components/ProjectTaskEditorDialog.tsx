import { LoaderCircle, Plus, Save, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import {
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/dialog";
import { FieldLabel, TextArea, TextInput } from "@/components/input-field";
import { InlineMessage } from "@/components/text";
import type { ProjectTaskInput } from "@/features/projects/actions";
import {
  priorityOptions,
  taskStatusOptions,
} from "./project-page-helpers";

export function ProjectTaskEditorDialog({
  darkMode,
  pending,
  message,
  draft,
  setDraft,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  draft: ProjectTaskInput;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  function updateSubtask(
    index: number,
    next: Partial<ProjectTaskInput["subtasks"][number]>,
  ) {
    setDraft((current) => ({
      ...current,
      subtasks: current.subtasks.map((subtask, subtaskIndex) =>
        subtaskIndex === index ? { ...subtask, ...next } : subtask,
      ),
    }));
  }

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
          {message ? (
            <InlineMessage darkMode={darkMode} className="mb-3">
              {message}
            </InlineMessage>
          ) : null}
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
              setDraft={setDraft}
            />
            <TaskSubtasks
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              setDraft={setDraft}
              onSubtaskChange={updateSubtask}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              darkMode={darkMode}
              tone="primary"
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
            </Button>
          </div>
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
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldLabel darkMode={darkMode} label="Scheduled date" optional>
          <TextInput
            darkMode={darkMode}
            value={draft.scheduledDate}
            placeholder="YYYY-MM-DD"
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                scheduledDate: event.target.value,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label="Start date" optional>
          <TextInput
            darkMode={darkMode}
            value={draft.startDate}
            placeholder="YYYY-MM-DD"
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label="Deadline" optional>
          <TextInput
            darkMode={darkMode}
            value={draft.deadlineDate}
            placeholder="YYYY-MM-DD"
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                deadlineDate: event.target.value,
              }))
            }
          />
        </FieldLabel>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SegmentedOptions
          label="Priority"
          darkMode={darkMode}
          pending={pending}
          value={draft.priority}
          options={priorityOptions}
          onChange={(priority) =>
            setDraft((current) => ({ ...current, priority }))
          }
        />
        <SegmentedOptions
          label="Status"
          darkMode={darkMode}
          pending={pending}
          value={draft.status}
          options={taskStatusOptions}
          onChange={(status) => setDraft((current) => ({ ...current, status }))}
        />
      </div>
    </>
  );
}

function TaskSubtasks({
  darkMode,
  pending,
  draft,
  setDraft,
  onSubtaskChange,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
  onSubtaskChange: (
    index: number,
    next: Partial<ProjectTaskInput["subtasks"][number]>,
  ) => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold">Subtasks</span>
      <div className="grid gap-2">
        {draft.subtasks.map((subtask, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-slate-200 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <TextInput
                darkMode={darkMode}
                value={subtask.title}
                placeholder="Subtask title"
                disabled={pending}
                onChange={(event) =>
                  onSubtaskChange(index, { title: event.target.value })
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  className="accent-emerald-500"
                  type="checkbox"
                  checked={subtask.isDone}
                  disabled={pending}
                  onChange={(event) =>
                    onSubtaskChange(index, { isDone: event.target.checked })
                  }
                />
                Done
              </label>
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<X size={14} aria-hidden="true" />}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    subtasks: current.subtasks.filter(
                      (_, subtaskIndex) => subtaskIndex !== index,
                    ),
                  }))
                }
              >
                Remove
              </Button>
            </div>
            <TextInput
              darkMode={darkMode}
              value={subtask.description}
              placeholder="Subtask description"
              disabled={pending}
              onChange={(event) =>
                onSubtaskChange(index, { description: event.target.value })
              }
            />
          </div>
        ))}
      </div>
      <Button
        darkMode={darkMode}
        disabled={pending}
        icon={<Plus size={14} aria-hidden="true" />}
        onClick={() =>
          setDraft((current) => ({
            ...current,
            subtasks: [
              ...current.subtasks,
              { title: "", description: "", isDone: false },
            ],
          }))
        }
      >
        Add subtask
      </Button>
    </div>
  );
}

function SegmentedOptions<T extends string>({
  label,
  darkMode,
  pending,
  value,
  options,
  onChange,
}: {
  label: string;
  darkMode: boolean;
  pending: boolean;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            darkMode={darkMode}
            size="xs"
            active={value === option.value}
            disabled={pending}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
