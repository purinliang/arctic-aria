import {
  Archive,
  Check,
  Edit3,
  ListTodo,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  dividerClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/ui/color";
import {
  ConfirmDialog,
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/ui/dialog";
import { FieldLabel, NumberInput, TextArea, TextInput } from "@/components/ui/input-field";
import { ListItem } from "@/components/ui/list";
import { Panel } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import { InlineMessage } from "@/components/ui/text";
import { cx } from "@/components/ui/utils";
import type { TaskInput, TaskProgressInput } from "@/features/tasks/actions";
import type { Priority, Task, TaskStatus, Subtask } from "../types";

type TaskResult = Promise<boolean>;
type ConfirmationTarget =
  | {
      kind: "archive" | "delete";
      id: string;
      title: string;
    }
  | null;

const statusOptions: Array<{ value: "all" | TaskStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "blocked", label: "Blocked" },
  { value: "skipped", label: "Skipped" },
  { value: "done", label: "Done" },
];

const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function emptyDraft(): TaskInput {
  return {
    title: "",
    description: "",
    planTitle: "",
    priority: "medium",
    status: "todo",
    weight: 1,
    completedWeight: 0,
    deadlineAt: "",
    scheduledDate: "",
    children: [],
  };
}

function toDraft(task: Task): TaskInput {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    planTitle: task.planLabel === "No plan" ? "" : task.planLabel,
    priority: task.priority,
    status: task.status,
    weight: task.weight,
    completedWeight: task.completedWeight,
    deadlineAt: task.deadlineAt,
    scheduledDate: task.scheduledDate,
    children:
      task.subtasks?.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description,
        weight: subtask.weight,
        completedWeight: subtask.completedWeight,
        status: subtask.status,
      })) ?? [],
  };
}

function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function completedText(task: Pick<Task, "completedWeight" | "weight">) {
  return `${task.completedWeight} / ${task.weight} weight done`;
}

export function TasksPage({
  darkMode,
  tasks,
  loading,
  pending,
  message,
  onTaskSave,
  onTaskDelete,
  onTaskArchive,
  onTaskProgress,
  onTaskStatus,
  onMessageClear,
}: {
  darkMode: boolean;
  tasks: Task[];
  loading: boolean;
  pending: boolean;
  message: string | null;
  onTaskSave: (input: TaskInput) => TaskResult;
  onTaskDelete: (taskId: string) => TaskResult;
  onTaskArchive: (taskId: string) => TaskResult;
  onTaskProgress: (input: TaskProgressInput) => TaskResult;
  onTaskStatus: (taskId: string, status: Exclude<TaskStatus, "archived">) => TaskResult;
  onMessageClear: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<TaskInput>(emptyDraft);
  const [progressDraft, setProgressDraft] = useState<TaskProgressInput | null>(
    null,
  );
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget>(null);

  const planOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tasks
            .map((task) => task.planLabel)
            .filter((planLabel) => planLabel && planLabel !== "No plan"),
        ),
      ),
    [tasks],
  );
  const visibleTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }

    return planFilter === "all" || task.planLabel === planFilter;
  });

  function closeEditor() {
    if (!pending) {
      setEditorOpen(false);
      setDraft(emptyDraft());
      onMessageClear();
    }
  }

  function openNewEditor() {
    setDraft(emptyDraft());
    onMessageClear();
    setEditorOpen(true);
  }

  function openEditor(task: Task) {
    setDraft(toDraft(task));
    onMessageClear();
    setEditorOpen(true);
  }

  async function submitTask() {
    const saved = await onTaskSave(draft);

    if (saved) {
      setEditorOpen(false);
      setDraft(emptyDraft());
    }
  }

  async function submitProgress() {
    if (!progressDraft) {
      return;
    }

    const saved = await onTaskProgress(progressDraft);

    if (saved) {
      setProgressDraft(null);
    }
  }

  async function confirmAction() {
    if (!confirmationTarget) {
      return;
    }

    const ok =
      confirmationTarget.kind === "archive"
        ? await onTaskArchive(confirmationTarget.id)
        : await onTaskDelete(confirmationTarget.id);

    if (ok) {
      setConfirmationTarget(null);
      setEditorOpen(false);
      setDraft(emptyDraft());
    }
  }

  function updateChild(index: number, next: Partial<TaskInput["children"][number]>) {
    setDraft((current) => ({
      ...current,
      children: current.children.map((child, childIndex) =>
        childIndex === index ? { ...child, ...next } : child,
      ),
    }));
  }

  return (
    <>
      <Panel darkMode={darkMode}>
        <div
          className={cx(
            "flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
            sectionBorderClass(darkMode),
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ListTodo size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Tasks</h2>
            </div>
            <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
              Plan concrete work, subtasks, deadlines, and progress.
            </p>
          </div>
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={15} aria-hidden="true" />}
            onClick={openNewEditor}
          >
            Add
          </Button>
        </div>

        <div className={cx("grid gap-3 border-b px-4 py-3", sectionBorderClass(darkMode))}>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                darkMode={darkMode}
                size="xs"
                active={statusFilter === option.value}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {planOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                darkMode={darkMode}
                size="xs"
                active={planFilter === "all"}
                onClick={() => setPlanFilter("all")}
              >
                All plans
              </Button>
              {planOptions.map((plan) => (
                <Button
                  key={plan}
                  darkMode={darkMode}
                  size="xs"
                  active={planFilter === plan}
                  onClick={() => setPlanFilter(plan)}
                >
                  {plan}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        {message ? (
          <p
            className={`border-b px-4 py-3 text-sm ${
              darkMode
                ? "border-neutral-900 text-amber-200"
                : "border-slate-200 text-amber-700"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className={dividerClass(darkMode)}>
          {loading ? (
            <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
              Loading tasks...
            </p>
          ) : null}
          {!loading && visibleTasks.length === 0 ? (
            <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
              No tasks yet. Add a task to start planning concrete work.
            </p>
          ) : null}
          {visibleTasks.map((task) => (
            <ListItem
              key={task.id}
              darkMode={darkMode}
              expanded={expandedTaskId === task.id}
              layout="block"
            >
              <button
                className="grid w-full grid-cols-[1fr_auto] items-start gap-3 text-left"
                type="button"
                aria-expanded={expandedTaskId === task.id}
                onClick={() =>
                  setExpandedTaskId((current) =>
                    current === task.id ? null : task.id,
                  )
                }
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{task.title}</span>
                    <Tag darkMode={darkMode}>{task.planLabel}</Tag>
                    <Tag darkMode={darkMode}>{titleCase(task.priority)}</Tag>
                    <Tag darkMode={darkMode}>{titleCase(task.status)}</Tag>
                  </span>
                  <span className={`mt-1 block text-sm ${mutedTextClass(darkMode)}`}>
                    Deadline {task.deadline} · {completedText(task)}
                  </span>
                </span>
                <span className={`text-xs font-semibold ${mutedTextClass(darkMode)}`}>
                  {expandedTaskId === task.id ? "Collapse" : "Expand"}
                </span>
              </button>

              {expandedTaskId === task.id ? (
                <div className="mt-3 grid gap-3">
                  <p className={`text-sm leading-6 ${mutedTextClass(darkMode)}`}>
                    {task.description || "No description."}
                  </p>
                  {task.subtasks && task.subtasks.length > 0 ? (
                    <div className="grid gap-2">
                      {task.subtasks.map((subtask) => (
                        <SubtaskRow
                          key={subtask.id}
                          darkMode={darkMode}
                          subtask={subtask}
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      darkMode={darkMode}
                      tone="success"
                      disabled={pending || task.status === "done"}
                      icon={<Check size={14} aria-hidden="true" />}
                      onClick={() => void onTaskStatus(task.id, "done")}
                    >
                      Done
                    </Button>
                    <Button
                      darkMode={darkMode}
                      disabled={pending}
                      onClick={() =>
                        setProgressDraft({
                          taskId: task.id,
                          weight: task.weight,
                          completedWeight: task.completedWeight,
                        })
                      }
                    >
                      Progress
                    </Button>
                    <Button
                      darkMode={darkMode}
                      disabled={pending || task.status === "blocked"}
                      onClick={() => void onTaskStatus(task.id, "blocked")}
                    >
                      Block
                    </Button>
                    <Button
                      darkMode={darkMode}
                      disabled={pending || task.status === "skipped"}
                      onClick={() => void onTaskStatus(task.id, "skipped")}
                    >
                      Skip
                    </Button>
                    <Button
                      darkMode={darkMode}
                      icon={<Edit3 size={14} aria-hidden="true" />}
                      onClick={() => openEditor(task)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ) : null}
            </ListItem>
          ))}
        </div>
      </Panel>

      {editorOpen ? (
        <DialogOverlay>
          <DialogBackdrop label="Close task editor" onClick={closeEditor} />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitTask();
            }}
          >
            <DialogFrame darkMode={darkMode}>
              <DialogHeader
                darkMode={darkMode}
                title={draft.id ? "Edit task" : "Add task"}
                closeLabel="Close task editor"
                onClose={closeEditor}
              />
              {message ? (
                <InlineMessage darkMode={darkMode} className="mb-3">
                  {message}
                </InlineMessage>
              ) : null}
              <div className="grid gap-3">
                <FieldLabel darkMode={darkMode} label="Title">
                  <TextInput
                    darkMode={darkMode}
                    value={draft.title}
                    maxLength={120}
                    disabled={pending}
                    placeholder="Task title"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
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
                            setDraft((current) => ({
                              ...current,
                              priority: option.value,
                            }))
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
                              updateChild(index, { title: event.target.value })
                            }
                          />
                          <NumberInput
                            darkMode={darkMode}
                            min={0.001}
                            step={0.5}
                            value={child.weight}
                            disabled={pending}
                            onChange={(event) =>
                              updateChild(index, {
                                weight: Number(event.target.value),
                              })
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
                            updateChild(index, { description: event.target.value })
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
                      onClick={() =>
                        draft.id
                          ? setConfirmationTarget({
                              kind: "archive",
                              id: draft.id,
                              title: draft.title || "this task",
                            })
                          : undefined
                      }
                    >
                      Archive
                    </Button>
                    <Button
                      darkMode={darkMode}
                      disabled={pending}
                      icon={<Trash2 size={14} aria-hidden="true" />}
                      onClick={() =>
                        draft.id
                          ? setConfirmationTarget({
                              kind: "delete",
                              id: draft.id,
                              title: draft.title || "this task",
                            })
                          : undefined
                      }
                    >
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </DialogFrame>
          </form>
        </DialogOverlay>
      ) : null}

      {progressDraft ? (
        <DialogOverlay zIndex="z-[60]">
          <DialogBackdrop
            label="Close progress editor"
            onClick={() => {
              if (!pending) {
                setProgressDraft(null);
              }
            }}
          />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitProgress();
            }}
          >
            <DialogFrame darkMode={darkMode} size="sm">
              <DialogHeader
                darkMode={darkMode}
                title="Update progress"
                closeLabel="Close progress editor"
                onClose={() => {
                  if (!pending) {
                    setProgressDraft(null);
                  }
                }}
              />
              {message ? (
                <InlineMessage darkMode={darkMode} className="mb-3">
                  {message}
                </InlineMessage>
              ) : null}
              <div className="grid gap-3">
                <FieldLabel darkMode={darkMode} label="Total weight">
                  <NumberInput
                    darkMode={darkMode}
                    min={0.001}
                    step={0.5}
                    value={progressDraft.weight}
                    disabled={pending}
                    onChange={(event) =>
                      setProgressDraft((current) =>
                        current
                          ? { ...current, weight: Number(event.target.value) }
                          : current,
                      )
                    }
                  />
                </FieldLabel>
                <FieldLabel darkMode={darkMode} label="Completed weight">
                  <NumberInput
                    darkMode={darkMode}
                    min={0}
                    step={0.5}
                    value={progressDraft.completedWeight}
                    disabled={pending}
                    onChange={(event) =>
                      setProgressDraft((current) =>
                        current
                          ? {
                              ...current,
                              completedWeight: Number(event.target.value),
                            }
                          : current,
                      )
                    }
                  />
                </FieldLabel>
              </div>
              <div className="mt-4 flex justify-end">
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
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending}
          title={confirmationTarget.kind === "archive" ? "Archive task" : "Delete task"}
          description={`${
            confirmationTarget.kind === "archive" ? "Archive" : "Delete"
          } "${confirmationTarget.title}"?`}
          confirmText={confirmationTarget.kind === "archive" ? "Archive" : "Delete"}
          confirmIcon={
            confirmationTarget.kind === "archive" ? (
              <Archive size={14} aria-hidden="true" />
            ) : (
              <Trash2 size={14} aria-hidden="true" />
            )
          }
          onCancel={() => {
            if (!pending) {
              setConfirmationTarget(null);
            }
          }}
          onConfirm={() => void confirmAction()}
        />
      ) : null}
    </>
  );
}

function SubtaskRow({
  darkMode,
  subtask,
}: {
  darkMode: boolean;
  subtask: Subtask;
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md px-2 py-2 text-sm ${
        darkMode ? "bg-white/5 text-neutral-200" : "bg-white text-slate-700"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{subtask.title}</span>
          <Tag darkMode={darkMode}>{titleCase(subtask.status)}</Tag>
        </div>
        <p className={`mt-1 truncate text-xs ${mutedTextClass(darkMode)}`}>
          {subtask.description || "No description."}
        </p>
      </div>
      <span className="flex shrink-0 gap-1" aria-label={`${subtask.weight} weight`}>
        {Array.from({ length: Math.ceil(subtask.weight) }).map((_, index) => (
          <span
            key={index}
            className={`h-3 w-3 rounded-full border ${
              subtask.done
                ? "border-emerald-500 bg-emerald-500"
                : darkMode
                  ? "border-neutral-300 bg-black"
                  : "border-slate-500 bg-white"
            }`}
          />
        ))}
      </span>
    </div>
  );
}
