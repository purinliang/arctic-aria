import { Archive, ListTodo, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  mutedTextClass,
  sectionBorderClass,
} from "@/components/ui/color";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Panel } from "@/components/ui/panel";
import { cx } from "@/components/ui/utils";
import type { Task, TaskStatus } from "@/features/dashboard/types";
import type { TaskInput, TaskProgressInput } from "@/features/tasks/actions";
import { TaskEditorDialog } from "./TaskEditorDialog";
import { TaskProgressDialog } from "./TaskProgressDialog";
import { TaskFilters, TasksList } from "./TasksList";
import { emptyDraft, toDraft } from "./task-page-helpers";

type TaskResult = Promise<boolean>;
type ConfirmationTarget =
  | {
      kind: "archive" | "delete";
      id: string;
      title: string;
    }
  | null;

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
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => TaskResult;
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

  function closeProgressEditor() {
    if (!pending) {
      setProgressDraft(null);
    }
  }

  return (
    <>
      <Panel darkMode={darkMode}>
        <TasksPageHeader
          darkMode={darkMode}
          pending={pending}
          onAdd={openNewEditor}
        />
        <TaskFilters
          darkMode={darkMode}
          statusFilter={statusFilter}
          planFilter={planFilter}
          planOptions={planOptions}
          onStatusChange={setStatusFilter}
          onPlanChange={setPlanFilter}
        />
        {message ? <TasksPageMessage darkMode={darkMode} message={message} /> : null}
        <TasksList
          darkMode={darkMode}
          loading={loading}
          pending={pending}
          tasks={visibleTasks}
          expandedTaskId={expandedTaskId}
          setExpandedTaskId={setExpandedTaskId}
          onTaskStatus={(taskId, status) => void onTaskStatus(taskId, status)}
          onProgressEdit={(task) =>
            setProgressDraft({
              taskId: task.id,
              weight: task.weight,
              completedWeight: task.completedWeight,
            })
          }
          onTaskEdit={openEditor}
        />
      </Panel>

      {editorOpen ? (
        <TaskEditorDialog
          darkMode={darkMode}
          pending={pending}
          message={message}
          draft={draft}
          setDraft={setDraft}
          onClose={closeEditor}
          onSubmit={() => void submitTask()}
          onArchive={() =>
            draft.id
              ? setConfirmationTarget({
                  kind: "archive",
                  id: draft.id,
                  title: draft.title || "this task",
                })
              : undefined
          }
          onDelete={() =>
            draft.id
              ? setConfirmationTarget({
                  kind: "delete",
                  id: draft.id,
                  title: draft.title || "this task",
                })
              : undefined
          }
        />
      ) : null}

      {progressDraft ? (
        <TaskProgressDialog
          darkMode={darkMode}
          pending={pending}
          message={message}
          progressDraft={progressDraft}
          setProgressDraft={setProgressDraft}
          onClose={closeProgressEditor}
          onSubmit={() => void submitProgress()}
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending}
          title={
            confirmationTarget.kind === "archive"
              ? "Archive task"
              : "Delete task"
          }
          description={`${
            confirmationTarget.kind === "archive" ? "Archive" : "Delete"
          } "${confirmationTarget.title}"?`}
          confirmText={
            confirmationTarget.kind === "archive" ? "Archive" : "Delete"
          }
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

function TasksPageHeader({
  darkMode,
  pending,
  onAdd,
}: {
  darkMode: boolean;
  pending: boolean;
  onAdd: () => void;
}) {
  return (
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
        onClick={onAdd}
      >
        Add
      </Button>
    </div>
  );
}

function TasksPageMessage({
  darkMode,
  message,
}: {
  darkMode: boolean;
  message: string;
}) {
  return (
    <p
      className={`border-b px-4 py-3 text-sm ${
        darkMode
          ? "border-neutral-900 text-amber-200"
          : "border-slate-200 text-amber-700"
      }`}
    >
      {message}
    </p>
  );
}
