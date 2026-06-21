"use client";

import {
  Bell,
  Check,
  Circle,
  Clock3,
  Gift,
  ListChecks,
  Minus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  dayBoundary,
  initialRoutines,
  initialTasks,
  rewardPreview,
} from "../dummy-data";
import type { Routine, RoutineStatus, Task, TaskStatus } from "../types";

const todayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function clampWeight(value: number, max: number) {
  return Math.min(Math.max(value, 0), max);
}

function statusForWeight(completedWeight: number, weight: number): TaskStatus {
  if (completedWeight >= weight) {
    return "done";
  }

  if (completedWeight > 0) {
    return "partial";
  }

  return "todo";
}

function priorityClass(priority: Task["priority"]) {
  if (priority === "High") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function routineStatusClass(status: RoutineStatus) {
  if (status === "done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "skipped") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (status === "busy") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [reviewOpen, setReviewOpen] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");

  const stats = useMemo(() => {
    const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
    const completedWeight = tasks.reduce(
      (sum, task) => sum + task.completedWeight,
      0,
    );
    const completedRoutines = routines.filter(
      (routine) => routine.status === "done",
    ).length;
    const progressPercent = Math.round((completedWeight / totalWeight) * 100);
    const gold =
      rewardPreview.baseGold +
      completedWeight * rewardPreview.perWeightGold +
      completedRoutines * rewardPreview.routineGold;
    const boxLevel = Math.max(
      1,
      Math.ceil((progressPercent + completedRoutines * 8) / 25),
    );

    return {
      totalWeight,
      completedWeight,
      completedRoutines,
      progressPercent,
      gold,
      boxLevel: Math.min(boxLevel, 5),
    };
  }, [routines, tasks]);

  function toggleTask(taskId: string) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextCompletedWeight =
          task.status === "done" ? 0 : task.weight;

        return {
          ...task,
          completedWeight: nextCompletedWeight,
          status: statusForWeight(nextCompletedWeight, task.weight),
          subtasks: task.subtasks?.map((subtask) => ({
            ...subtask,
            done: nextCompletedWeight === task.weight,
          })),
        };
      }),
    );
  }

  function updatePartialTask(taskId: string, completedWeight: number) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextCompletedWeight = clampWeight(completedWeight, task.weight);

        return {
          ...task,
          completedWeight: nextCompletedWeight,
          status: statusForWeight(nextCompletedWeight, task.weight),
        };
      }),
    );
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId || !task.subtasks) {
          return task;
        }

        const subtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId
            ? { ...subtask, done: !subtask.done }
            : subtask,
        );
        const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
        const nextCompletedWeight = Math.round(
          (doneSubtasks / subtasks.length) * task.weight,
        );

        return {
          ...task,
          subtasks,
          completedWeight: nextCompletedWeight,
          status: statusForWeight(nextCompletedWeight, task.weight),
        };
      }),
    );
  }

  function updateRoutine(routineId: string, status: RoutineStatus) {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === routineId ? { ...routine, status } : routine,
      ),
    );
  }

  function openReview() {
    setReviewOpen(true);
    setReviewCount((count) => count + 1);
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] text-slate-950">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-300 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Daily plan ends at {dayBoundary}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              {todayFormatter.format(new Date())} Dashboard
            </h1>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[680px]">
            <SummaryMetric
              label="Task weight"
              value={`${stats.completedWeight}/${stats.totalWeight}`}
            />
            <SummaryMetric
              label="Progress"
              value={`${stats.progressPercent}%`}
            />
            <SummaryMetric
              label="Routines"
              value={`${stats.completedRoutines}/${routines.length}`}
            />
            <button
              className="flex h-[58px] items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              type="button"
              onClick={openReview}
            >
              <ListChecks size={18} aria-hidden="true" />
              Review
            </button>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_390px]">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 rounded-md border border-slate-300 bg-white">
              <SectionHeader
                icon={<Check size={18} aria-hidden="true" />}
                title="Today's Tasks"
                meta={`${tasks.length} planned`}
              />
              <div className="divide-y divide-slate-200">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    expanded={expandedTaskId === task.id}
                    onExpand={() =>
                      setExpandedTaskId((current) =>
                        current === task.id ? null : task.id,
                      )
                    }
                    onToggle={() => toggleTask(task.id)}
                    onPartialChange={(completedWeight) =>
                      updatePartialTask(task.id, completedWeight)
                    }
                    onSubtaskToggle={(subtaskId) =>
                      toggleSubtask(task.id, subtaskId)
                    }
                  />
                ))}
              </div>
            </section>

            <aside className="grid content-start gap-4">
              <section className="rounded-md border border-slate-300 bg-white">
                <SectionHeader
                  icon={<Bell size={18} aria-hidden="true" />}
                  title="Routines"
                  meta={`${routines.length} scheduled`}
                />
                <div className="divide-y divide-slate-200">
                  {routines.map((routine) => (
                    <RoutineRow
                      key={routine.id}
                      routine={routine}
                      onStatusChange={(status) =>
                        updateRoutine(routine.id, status)
                      }
                    />
                  ))}
                </div>
              </section>

              <Timeline tasks={tasks} routines={routines} />
            </aside>
          </div>

          <ReviewPanel
            tasks={tasks}
            routines={routines}
            open={reviewOpen}
            reviewCount={reviewCount}
            gold={stats.gold}
            boxLevel={stats.boxLevel}
            onClose={() => setReviewOpen(false)}
          />
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-[58px] rounded-md border border-slate-300 bg-white px-3 py-2">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  meta,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <h2 className="truncate text-base font-semibold text-slate-950">
          {title}
        </h2>
      </div>
      <span className="shrink-0 text-sm text-slate-500">{meta}</span>
    </div>
  );
}

function TaskRow({
  task,
  expanded,
  onExpand,
  onToggle,
  onPartialChange,
  onSubtaskToggle,
}: {
  task: Task;
  expanded: boolean;
  onExpand: () => void;
  onToggle: () => void;
  onPartialChange: (completedWeight: number) => void;
  onSubtaskToggle: (subtaskId: string) => void;
}) {
  const progress = Math.round((task.completedWeight / task.weight) * 100);

  return (
    <article className="px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <button
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:border-slate-500"
            type="button"
            aria-label={`Toggle ${task.title}`}
            onClick={onToggle}
          >
            {task.status === "done" ? (
              <Check size={18} aria-hidden="true" />
            ) : task.status === "partial" ? (
              <Minus size={18} aria-hidden="true" />
            ) : (
              <Circle size={18} aria-hidden="true" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 text-base font-semibold text-slate-950">
                {task.title}
              </h3>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${priorityClass(task.priority)}`}
              >
                {task.priority}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
              <span>{task.planLabel}</span>
              <span>Deadline {task.deadline}</span>
              <span>
                Weight {task.completedWeight}/{task.weight}
              </span>
            </div>
          </div>
        </div>
        <button
          className="h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
          type="button"
          onClick={onExpand}
        >
          Partial
        </button>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Completed weight: {task.completedWeight}
            <input
              type="range"
              min="0"
              max={task.weight}
              step="1"
              value={task.completedWeight}
              onChange={(event) =>
                onPartialChange(Number(event.currentTarget.value))
              }
            />
          </label>
          {task.subtasks ? (
            <div className="grid gap-2">
              {task.subtasks.map((subtask) => (
                <label
                  key={subtask.id}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={subtask.done}
                    onChange={() => onSubtaskToggle(subtask.id)}
                  />
                  <span>{subtask.title}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RoutineRow({
  routine,
  onStatusChange,
}: {
  routine: Routine;
  onStatusChange: (status: RoutineStatus) => void;
}) {
  return (
    <article className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">
            {routine.title}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{routine.scheduledTime}</span>
            <span>Reminder {routine.reminderState}</span>
            <span>{routine.streakText}</span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${routineStatusClass(routine.status)}`}
        >
          {routine.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["done", "skipped", "busy"] as RoutineStatus[]).map((status) => (
          <button
            key={status}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700 transition hover:border-slate-500"
            type="button"
            onClick={() => onStatusChange(status)}
          >
            {status}
          </button>
        ))}
      </div>
    </article>
  );
}

function Timeline({ tasks, routines }: { tasks: Task[]; routines: Routine[] }) {
  const events = [
    ...tasks.map((task) => ({
      id: task.id,
      time: task.deadline,
      title: task.title,
      state: task.status,
      type: "Task",
    })),
    ...routines.map((routine) => ({
      id: routine.id,
      time: routine.scheduledTime,
      title: routine.title,
      state: routine.status,
      type: "Routine",
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <section className="rounded-md border border-slate-300 bg-white">
      <SectionHeader
        icon={<Clock3 size={18} aria-hidden="true" />}
        title="Timeline"
        meta="Today"
      />
      <div className="grid gap-3 px-4 py-4">
        {events.map((event) => (
          <div key={`${event.type}-${event.id}`} className="grid grid-cols-[52px_1fr] gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {event.time}
            </span>
            <div className="min-w-0 border-l border-slate-300 pl-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {event.title}
              </p>
              <p className="text-xs text-slate-500">
                {event.type} - {event.state}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewPanel({
  tasks,
  routines,
  open,
  reviewCount,
  gold,
  boxLevel,
  onClose,
}: {
  tasks: Task[];
  routines: Routine[];
  open: boolean;
  reviewCount: number;
  gold: number;
  boxLevel: number;
  onClose: () => void;
}) {
  const completedTasks = tasks.filter((task) => task.status === "done");
  const partialTasks = tasks.filter((task) => task.status === "partial");
  const unfinishedTasks = tasks.filter((task) => task.status === "todo");
  const completedRoutines = routines.filter((routine) => routine.status === "done");
  const interruptedRoutines = routines.filter(
    (routine) => routine.status === "skipped" || routine.status === "busy",
  );

  return (
    <aside className="rounded-md border border-slate-300 bg-white">
      <SectionHeader
        icon={<Gift size={18} aria-hidden="true" />}
        title="Review"
        meta={open ? `Run ${reviewCount}` : "Closed"}
      />
      {open ? (
        <div className="grid gap-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            <RewardCell label="Gold" value={String(gold)} />
            <RewardCell label="Box" value={`Lv ${boxLevel}`} />
            <RewardCell label="Item" value={rewardPreview.itemName} />
          </div>

          <ReviewGroup
            title="Completed"
            items={[
              ...completedTasks.map((task) => task.title),
              ...completedRoutines.map((routine) => routine.title),
            ]}
            fallback="Nothing fully completed yet."
          />
          <ReviewGroup
            title="Partial Progress"
            items={partialTasks.map(
              (task) =>
                `${task.title}: ${task.completedWeight}/${task.weight} weight`,
            )}
            fallback="No partial progress recorded."
          />
          <ReviewGroup
            title="Unfinished or Interrupted"
            items={[
              ...unfinishedTasks.map((task) => task.title),
              ...interruptedRoutines.map(
                (routine) => `${routine.title}: ${routine.status}`,
              ),
            ]}
            fallback="No unfinished or skipped items."
          />

          <button
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
            type="button"
            onClick={onClose}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Collapse review
          </button>
        </div>
      ) : (
        <div className="grid gap-3 p-4 text-sm text-slate-600">
          <p>Review is collapsed. Run it again from the top bar.</p>
        </div>
      )}
    </aside>
  );
}

function RewardCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-1 text-xs font-medium uppercase text-slate-500">
        <Sparkles size={14} aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ReviewGroup({
  title,
  items,
  fallback,
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item} className="rounded-md bg-slate-50 px-2 py-1">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{fallback}</p>
      )}
    </section>
  );
}
