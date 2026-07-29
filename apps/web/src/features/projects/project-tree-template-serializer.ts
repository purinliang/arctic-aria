import { durationRangeForDays } from "./project-duration.ts";
import type { ProjectTaskView, ProjectView } from "./project-view-models.ts";

export function projectTreeTemplateForProject(project: ProjectView) {
  return [
    "# Project Tree Template",
    "",
    "<!--",
    "Fill this Arctic Aria project tree template and return only the filled Markdown.",
    "Keep project_id, milestone_id, and task_id values unchanged for update/delete rows.",
    "Use op: create for new milestones or tasks and leave their id field empty.",
    "Use op: update for existing milestones or tasks you want to edit.",
    "Use op: delete only when the existing milestone or task should be deleted.",
    "Do not remove existing rows from the template to delete them; omitted rows are preserved.",
    "Task placement is determined by the section where the task appears.",
    "Use single-line field values. Use \\n inside objective or description for line breaks.",
    "Legal timeline values: deadline or duration.",
    "Legal duration values: 1_3_months, 3_6_months, 6_12_months, 1_3_years.",
    "-->",
    "",
    "## Project",
    `project_id: ${project.id}`,
    "op: update",
    `title: ${fieldValue(project.title)}`,
    `objective: ${fieldValue(project.description ?? "")}`,
    `start_date: ${project.startDate}`,
    `timeline: ${project.deadlineDate ? "deadline" : "duration"}`,
    `deadline: ${project.deadlineDate}`,
    `duration: ${project.durationRange}`,
    "",
    "## Top-level Tasks",
    ...taskLines(project.tasks.filter((task) => !task.milestoneId)),
    "",
    "## Milestones",
    ...project.milestones.flatMap((milestone) => [
      `### Milestone: ${fieldValue(milestone.title)}`,
      `milestone_id: ${milestone.id}`,
      "op: update",
      `title: ${fieldValue(milestone.title)}`,
      `objective: ${fieldValue(milestone.objective ?? "")}`,
      `start_date: ${milestone.startDate}`,
      `timeline: ${milestone.deadlineDate ? "deadline" : "duration"}`,
      `deadline: ${milestone.deadlineDate}`,
      `duration: ${durationRangeForDays(Number(milestone.expectedDurationDays) || null)}`,
      "",
      "#### Tasks",
      ...taskLines(milestone.tasks),
      "",
    ]),
  ].join("\n");
}

function taskLines(tasks: ProjectTaskView[]) {
  if (tasks.length === 0) {
    return ["<!-- No tasks in this section. Add new tasks with op: create. -->"];
  }

  return tasks.flatMap((task) => [
    "- op: update",
    `  task_id: ${task.id}`,
    `  title: ${fieldValue(task.title)}`,
    `  description: ${fieldValue(task.description ?? "")}`,
    `  start_date: ${task.startDate}`,
    `  deadline: ${task.deadlineDate}`,
    `  estimated_duration_minutes: ${task.estimatedDurationMinutes}`,
    "",
  ]);
}

function fieldValue(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/\n/g, "\\n");
}
