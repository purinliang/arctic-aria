// Projects Page - Project Detail Page.
import { useMemo, useState } from "react";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { Panel } from "@/components/panel";
import type { TaskStatus } from "@/features/dashboard/types";
import type {
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import {
  compareDetailTasks,
  ProjectDetailTasksPanel,
} from "./ProjectDetailTasksPanel";
import {
  MilestoneOverviewPanel,
  MilestoneSwitchPanel,
  type MilestoneChoice,
} from "./ProjectDetailSidePanels";

export function ProjectDetailPage({
  darkMode,
  pending,
  project,
  messages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onManageMilestones,
  onAddTask,
  onEditTask,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView | null;
  messages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onManageMilestones: () => void;
  onAddTask: (projectId: string, milestoneId?: string) => void;
  onEditTask: (task: ProjectTaskView) => void;
  onTaskStatus: (taskId: string, status: TaskStatus) => void;
}) {
  if (!project) {
    return (
      <Panel darkMode={darkMode} className="min-h-[60vh]">
        <div className="px-4 py-4">
          <p className={`text-sm ${secondaryTextColorClass}`}>
            {messages.selectProject}
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <ProjectDetailContent
      darkMode={darkMode}
      pending={pending}
      project={project}
      messages={messages}
      timelineMessages={timelineMessages}
      durationMessages={durationMessages}
      defaultDescriptions={defaultDescriptions}
      dateMessages={dateMessages}
      onManageMilestones={onManageMilestones}
      onAddTask={onAddTask}
      onEditTask={onEditTask}
      onTaskStatus={onTaskStatus}
    />
  );
}

function ProjectDetailContent({
  darkMode,
  pending,
  project,
  messages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onManageMilestones,
  onAddTask,
  onEditTask,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView;
  messages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onManageMilestones: () => void;
  onAddTask: (projectId: string, milestoneId?: string) => void;
  onEditTask: (task: ProjectTaskView) => void;
  onTaskStatus: (taskId: string, status: TaskStatus) => void;
}) {
  const unassignedTasks = useMemo(
    () => project.tasks.filter((task) => !task.milestoneId),
    [project.tasks],
  );
  const taskCountsByMilestoneId = useMemo(
    () => countTasksByMilestoneId(project.tasks),
    [project.tasks],
  );
  const milestoneChoices = useMemo<MilestoneChoice[]>(
    () => [
      ...[...project.milestones].sort(compareDetailMilestones).map(
        (milestone) => {
          const taskCounts = taskCountsByMilestoneId.get(milestone.id) ?? {
            done: 0,
            total: 0,
          };

          return {
            id: milestone.id,
            title: milestone.title,
            description: displayDescription(
              milestone.objective,
              milestone.title,
              defaultDescriptions.milestone,
            ),
            doneTaskCount: taskCounts.done,
            taskCount: taskCounts.total,
            milestone,
          };
        },
      ),
      ...(unassignedTasks.length > 0
        ? [
            {
              id: "",
              title: messages.noMilestoneTitle,
              description: messages.noMilestoneDescription,
              doneTaskCount: countDoneTasks(unassignedTasks),
              taskCount: unassignedTasks.length,
              milestone: null,
            },
          ]
        : []),
    ],
    [
      defaultDescriptions.milestone,
      messages.noMilestoneDescription,
      messages.noMilestoneTitle,
      project.milestones,
      taskCountsByMilestoneId,
      unassignedTasks,
    ],
  );
  const [requestedMilestoneId, setSelectedMilestoneId] = useState<
    string | null
  >(null);
  const defaultMilestoneId = milestoneChoices[0]?.id ?? null;
  const selectedMilestoneId = milestoneChoices.some(
    (choice) => choice.id === requestedMilestoneId,
  )
    ? requestedMilestoneId
    : defaultMilestoneId;

  const selectedChoice = useMemo(
    () =>
      milestoneChoices.find((choice) => choice.id === selectedMilestoneId) ??
      null,
    [milestoneChoices, selectedMilestoneId],
  );
  const selectedMilestone = selectedChoice?.milestone ?? null;
  const selectedTasks = useMemo(
    () =>
      selectedMilestoneId === null
        ? []
        : [...project.tasks]
            .filter((task) =>
              selectedMilestoneId === ""
                ? !task.milestoneId
                : task.milestoneId === selectedMilestoneId,
            )
            .sort(compareDetailTasks),
    [project.tasks, selectedMilestoneId],
  );
  const sidePanelMessages = useMemo(
    () => ({
      dates: dateMessages,
      defaults: defaultDescriptions,
      detail: messages,
      duration: durationMessages,
      timeline: timelineMessages,
    }),
    [
      dateMessages,
      defaultDescriptions,
      durationMessages,
      messages,
      timelineMessages,
    ],
  );

  return (
    <section className="grid gap-4">
      <MilestoneOverviewPanel
        darkMode={darkMode}
        choice={selectedChoice}
        messages={sidePanelMessages}
      />
      <div className="aa-split-container">
        <div className="aa-split-panel gap-4">
          <div className="grid min-w-0 content-start gap-4">
            <ProjectDetailTasksPanel
              darkMode={darkMode}
              pending={pending}
              tasks={selectedTasks}
              messages={messages}
              defaultDescriptions={defaultDescriptions}
              dateMessages={dateMessages}
              onAddTask={() =>
                onAddTask(project.id, selectedMilestone?.id ?? undefined)
              }
              onEditTask={onEditTask}
              onTaskStatus={onTaskStatus}
            />
          </div>

          <aside className="grid content-start gap-4">
            <MilestoneSwitchPanel
              darkMode={darkMode}
              pending={pending}
              choices={milestoneChoices}
              selectedMilestoneId={selectedMilestoneId}
              messages={sidePanelMessages}
              onManageMilestones={onManageMilestones}
              onSelectMilestone={setSelectedMilestoneId}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}

function compareDetailMilestones(
  left: ProjectView["milestones"][number],
  right: ProjectView["milestones"][number],
) {
  return (
    dateSortValue(left.deadlineDate) - dateSortValue(right.deadlineDate) ||
    dateSortValue(left.startDate) - dateSortValue(right.startDate) ||
    left.title.localeCompare(right.title)
  );
}

function dateSortValue(date: string) {
  return date ? Date.parse(`${date}T00:00:00.000Z`) : Number.POSITIVE_INFINITY;
}

function countDoneTasks(tasks: ProjectTaskView[]) {
  return tasks.filter((task) => task.status === "done").length;
}

function countTasksByMilestoneId(tasks: ProjectTaskView[]) {
  const counts = new Map<string, { done: number; total: number }>();

  for (const task of tasks) {
    if (!task.milestoneId) {
      continue;
    }

    const count = counts.get(task.milestoneId) ?? { done: 0, total: 0 };
    count.total += 1;

    if (task.status === "done") {
      count.done += 1;
    }

    counts.set(task.milestoneId, count);
  }

  return counts;
}
