import {
  Archive,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  FieldLabel,
  NumberInput,
  TextArea,
  TextInput,
} from "@/components/ui/input-field";
import { InlineMessage } from "@/components/ui/text";
import type { TaskInput } from "@/features/tasks/actions";
import { priorityOptions } from "./task-page-helpers";

export function TaskEditorDialog({
  darkMode,
  pending,
  message,
  draft,
  setDraft,
  onClose,
  onSubmit,
  onArchive,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  draft: TaskInput;
  setDraft: Dispatch<SetStateAction<TaskInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  function updateChild(index: number, next: Partial<TaskInput["children"][number]>) {
    setDraft((current) => ({
      ...current,
      children: current.children.map((child, childIndex) =>
        childIndex === index ? { ...child, ...next } : child,
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
            <TaskBasics darkMode={darkMode} pending={pending} draft={draft} setDraft={setDraft} />
            <TaskMeta darkMode={darkMode} pending={pending} draft={draft} setDraft={setDraft} />
            <TaskChildren
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              setDraft={setDraft}
              onChildChange={updateChild}
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
            {draft.id ? (
              <>
                <Button
                  darkMode={darkMode}
                  disabled={pending}
                  icon={<Archive size={14} aria-hidden="true" />}
                  onClick={onArchive}
                >
                  Archive
                </Button>
                <Button
                  darkMode={darkMode}
                  disabled={pending}
                  icon={<Trash2 size={14} aria-hidden="true" />}
                  onClick={onDelete}
                >
                  Delete
                </Button>
              </>
            ) : null}
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
  draft: TaskInput;
  setDraft: Dispatch<SetStateAction<TaskInput>>;
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
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel darkMode={darkMode} label="Plan" optional>
          <TextInput
            darkMode={darkMode}
            value={draft.planTitle ?? ""}
            maxLength={120}
            disabled={pending}
            placeholder="Plan name"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                planTitle: event.target.value,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label="Deadline" optional>
          <TextInput
            darkMode={darkMode}
            type="text"
            placeholder="YYYY-MM-DDTHH:MM"
            value={draft.deadlineAt ?? ""}
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                deadlineAt: event.target.value,
              }))
            }
          />
        </FieldLabel>
      </div>
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
  draft: TaskInput;
  setDraft: Dispatch<SetStateAction<TaskInput>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="grid gap-1.5">
        <span className="text-xs font-semibold">Priority</span>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((option) => (
            <Button
              key={option.value}
              darkMode={darkMode}
              size="xs"
              active={draft.priority === option.value}
              disabled={pending}
              onClick={() =>
                setDraft((current) => ({ ...current, priority: option.value }))
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <FieldLabel darkMode={darkMode} label="Weight">
        <NumberInput
          darkMode={darkMode}
          min={0.001}
          step={0.5}
          value={draft.weight}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              weight: Number(event.target.value),
            }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Completed weight">
        <NumberInput
          darkMode={darkMode}
          min={0}
          step={0.5}
          value={draft.completedWeight}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              completedWeight: Number(event.target.value),
            }))
          }
        />
      </FieldLabel>
    </div>
  );
}

function TaskChildren({
  darkMode,
  pending,
  draft,
  setDraft,
  onChildChange,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: TaskInput;
  setDraft: Dispatch<SetStateAction<TaskInput>>;
  onChildChange: (index: number, next: Partial<TaskInput["children"][number]>) => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold">Subtasks</span>
      <div className="grid gap-2">
        {draft.children.map((child, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-slate-200 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
              <TextInput
                darkMode={darkMode}
                value={child.title}
                placeholder="Subtask title"
                disabled={pending}
                onChange={(event) =>
                  onChildChange(index, { title: event.target.value })
                }
              />
              <NumberInput
                darkMode={darkMode}
                min={0.001}
                step={0.5}
                value={child.weight}
                disabled={pending}
                onChange={(event) =>
                  onChildChange(index, { weight: Number(event.target.value) })
                }
              />
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<X size={14} aria-hidden="true" />}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    children: current.children.filter(
                      (_, childIndex) => childIndex !== index,
                    ),
                  }))
                }
              >
                Remove
              </Button>
            </div>
            <TextInput
              darkMode={darkMode}
              value={child.description}
              placeholder="Subtask description"
              disabled={pending}
              onChange={(event) =>
                onChildChange(index, { description: event.target.value })
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
            children: [
              ...current.children,
              {
                title: "",
                description: "",
                weight: 1,
                completedWeight: 0,
                status: "todo",
              },
            ],
          }))
        }
      >
        Add subtask
      </Button>
    </div>
  );
}
