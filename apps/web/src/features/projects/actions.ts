"use server";

import { getCurrentUser } from "@/features/auth/actions";
import { projectDatabaseErrorMessage } from "./project-database-errors";
import {
  loadProjectDashboardData,
  unauthorizedResult,
  validateMilestoneInput,
  validateProjectInput,
  validateProjectTaskInput,
} from "./project-action-helpers";
import { projectService } from "./server/project-service";
import type { ProjectTaskStatus } from "./server/project-repository";
import type {
  MilestoneInput,
  ProjectActionResult,
  ProjectDashboardData,
  ProjectInput,
  ProjectTaskInput,
} from "./project-action-helpers";

export type {
  MilestoneInput,
  ProjectActionResult,
  ProjectDashboardData,
  ProjectInput,
  ProjectTaskInput,
  ProjectTaskView,
  ProjectView,
} from "./project-action-helpers";

async function withProjectData(
  action: (userId: string) => Promise<boolean>,
  notFoundMessage: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const ok = await action(user.id);

    if (!ok) {
      return { ok: false, message: notFoundMessage };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return { ok: false, message: projectDatabaseErrorMessage(error) };
  }
}

export async function getProjectDashboardData(): Promise<
  ProjectActionResult<ProjectDashboardData>
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return { ok: false, message: projectDatabaseErrorMessage(error) };
  }
}

export async function saveProject(
  input: ProjectInput,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateProjectInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  try {
    const projectId = await projectService.saveProject(user.id, {
      projectId: input.id,
      title: validation.title,
      objective: validation.objective,
      importanceReason: validation.importanceReason,
      priority: input.priority,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
      expectedDurationDays: validation.expectedDurationDays,
    });

    if (!projectId) {
      return { ok: false, message: "Project was not found." };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return { ok: false, message: projectDatabaseErrorMessage(error) };
  }
}

export async function saveMilestone(
  input: MilestoneInput,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateMilestoneInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  try {
    const milestoneId = await projectService.saveMilestone(user.id, {
      milestoneId: input.id,
      projectId: input.projectId,
      title: validation.title,
      objective: validation.objective,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
      expectedDurationDays: validation.expectedDurationDays,
    });

    if (!milestoneId) {
      return { ok: false, message: "Project or milestone was not found." };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return { ok: false, message: projectDatabaseErrorMessage(error) };
  }
}

export async function saveProjectTask(
  input: ProjectTaskInput,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateProjectTaskInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  try {
    const saved = await projectService.saveTask(user.id, {
      taskId: input.id,
      projectId: input.projectId,
      milestoneId: validation.milestoneId,
      title: validation.title,
      description: validation.description,
      priority: input.priority,
      status: input.status,
      scheduledDate: validation.scheduledDate,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
    });

    if (!saved) {
      return {
        ok: false,
        message: "Project, milestone, or task was not found.",
      };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return { ok: false, message: projectDatabaseErrorMessage(error) };
  }
}

export async function archiveProject(
  projectId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.archiveProject(userId, projectId),
    "Project was not found.",
  );
}

export async function archiveMilestone(
  milestoneId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.archiveMilestone(userId, milestoneId),
    "Milestone was not found.",
  );
}

export async function archiveProjectTask(
  taskId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.archiveTask(userId, taskId),
    "Task was not found.",
  );
}

export async function completeProjectTask(
  taskId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return updateProjectTaskStatus(taskId, "done");
}

export async function skipProjectTask(
  taskId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return updateProjectTaskStatus(taskId, "skipped");
}

export async function blockProjectTask(
  taskId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return updateProjectTaskStatus(taskId, "blocked");
}

export async function reopenProjectTask(
  taskId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return updateProjectTaskStatus(taskId, "todo");
}

export async function updateProjectTaskStatus(
  taskId: string,
  status: Exclude<ProjectTaskStatus, "archived">,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.updateTaskStatus(userId, taskId, status),
    "Task was not found.",
  );
}
