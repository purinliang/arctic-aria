import type { ProjectDurationRange } from "./project-duration";

export type ProjectOverviewTimelineInput = {
  deadlineDate: string;
  expectedDurationDays: string;
  durationRange: ProjectDurationRange;
};

export type ProjectOverviewTimelineMessages = {
  deadline: string;
  duration: string;
  timeline: string;
  openEnded: string;
};

export function projectOverviewTimelineMetadata(
  project: ProjectOverviewTimelineInput,
  messages: ProjectOverviewTimelineMessages,
  durations: Record<ProjectDurationRange, string>,
  formatDate: (value: string) => string,
) {
  if (project.deadlineDate) {
    return {
      label: messages.deadline,
      value: formatDate(project.deadlineDate),
    };
  }

  if (project.expectedDurationDays) {
    return {
      label: messages.duration,
      value: durations[project.durationRange],
    };
  }

  return {
    label: messages.timeline,
    value: messages.openEnded,
  };
}
