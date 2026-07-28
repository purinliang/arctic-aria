"use server";

import { getCurrentUser } from "@/features/auth/actions";
import {
  projectDatabaseErrorCategory,
  projectDatabaseErrorCode,
  projectDatabaseErrorMetadata,
  projectDatabaseErrorMessage,
} from "./project-database-errors";
import {
  unauthorizedResult,
  validateMilestoneInput,
  validateProjectInput,
  validateProjectTaskInput,
} from "./project-action-helpers";
import { projectService } from "./server/project-service";
import { loadProjectDashboardData } from "./project-view-models";
import type { ProjectTaskStatus } from "./server/project-repository";
import type {
  MilestoneInput,
  ProjectActionResult,
  ProjectInput,
  ProjectTaskInput,
} from "./project-action-helpers";
import type { ProjectDashboardData } from "./project-view-models";

export type {
  MilestoneInput,
  ProjectActionResult,
  ProjectInput,
  ProjectTaskInput,
} from "./project-action-helpers";

export type {
  ProjectDashboardData,
  ProjectTaskView,
  ProjectView,
} from "./project-view-models";

type ProjectCommandResult = ProjectActionResult<null>;

function projectDatabaseResult<T>(error: unknown): ProjectActionResult<T> {
  return {
    ok: false,
    message: projectDatabaseErrorMessage(error),
    code: projectDatabaseErrorCode(error),
    category: projectDatabaseErrorCategory(error),
    ...projectDatabaseErrorMetadata(error),
  };
}

async function withProjectData(
  action: (userId: string) => Promise<boolean>,
  notFoundMessage: string,
  notFoundCode: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const ok = await action(user.id);

    if (!ok) {
      return {
        ok: false,
        message: notFoundMessage,
        code: notFoundCode,
        category: "not_found",
      };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return projectDatabaseResult(error);
  }
}

async function withProjectCommand(
  action: (userId: string) => Promise<boolean>,
  notFoundMessage: string,
  notFoundCode: string,
): Promise<ProjectCommandResult> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const ok = await action(user.id);

    if (!ok) {
      return {
        ok: false,
        message: notFoundMessage,
        code: notFoundCode,
        category: "not_found",
      };
    }

    return {
      ok: true,
      data: null,
    };
  } catch (error) {
    return projectDatabaseResult(error);
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
    return projectDatabaseResult(error);
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
    return validation;
  }

  try {
    const projectId = await projectService.saveProject(user.id, {
      projectId: input.id,
      title: validation.title,
      objective: validation.objective,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
      expectedDurationDays: validation.expectedDurationDays,
    });

    if (!projectId) {
      return {
        ok: false,
        message: "Project was not found.",
        code: "project_not_found",
        category: "not_found",
        subject: "project",
      };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return projectDatabaseResult(error);
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
    return validation;
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
      return {
        ok: false,
        message: "Project or milestone was not found.",
        code: "project_or_milestone_not_found",
        category: "not_found",
      };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return projectDatabaseResult(error);
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
    return validation;
  }

  try {
    const saved = await projectService.saveTask(user.id, {
      taskId: input.id,
      projectId: input.projectId,
      milestoneId: validation.milestoneId,
      title: validation.title,
      description: validation.description,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
      estimatedDurationMinutes: validation.estimatedDurationMinutes,
    });

    if (!saved) {
      return {
        ok: false,
        message: "Project, milestone, or task was not found.",
        code: "project_milestone_or_task_not_found",
        category: "not_found",
      };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return projectDatabaseResult(error);
  }
}

export async function archiveProject(
  projectId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.archiveProject(userId, projectId),
    "Project was not found.",
    "project_not_found",
  );
}

export async function pinProject(
  projectId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const result = await projectService.pinProject(user.id, projectId);

    if (result === "not_found") {
      return {
        ok: false,
        message: "Project was not found.",
        code: "project_not_found",
        category: "not_found",
        subject: "project",
      };
    }

    if (result === "limit_reached") {
      return {
        ok: false,
        message: "You can pin up to 3 projects.",
        code: "project_pin_limit",
        category: "domain",
        action: "pin",
        subject: "project",
        reason: "limit_reached",
        limit: 3,
      };
    }

    return {
      ok: true,
      data: await loadProjectDashboardData(user.id),
    };
  } catch (error) {
    return projectDatabaseResult(error);
  }
}

export async function unpinProject(
  projectId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.unpinProject(userId, projectId),
    "Project was not found.",
    "project_not_found",
  );
}

export async function archiveMilestone(
  milestoneId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.archiveMilestone(userId, milestoneId),
    "Milestone was not found.",
    "milestone_not_found",
  );
}

export async function archiveProjectTask(
  taskId: string,
): Promise<ProjectActionResult<ProjectDashboardData>> {
  return withProjectData(
    (userId) => projectService.archiveTask(userId, taskId),
    "Task was not found.",
    "task_not_found",
  );
}

export async function completeProjectTask(
  taskId: string,
): Promise<ProjectCommandResult> {
  return updateProjectTaskStatus(taskId, "done");
}

export async function skipProjectTask(
  taskId: string,
): Promise<ProjectCommandResult> {
  void taskId;
  return {
    ok: false,
    message: "Task skip is not supported.",
    code: "task_status_unsupported",
    category: "domain",
    action: "update",
    subject: "task",
    reason: "invalid_value",
  };
}

export async function blockProjectTask(
  taskId: string,
): Promise<ProjectCommandResult> {
  void taskId;
  return {
    ok: false,
    message: "Task blocking is not supported.",
    code: "task_status_unsupported",
    category: "domain",
    action: "update",
    subject: "task",
    reason: "invalid_value",
  };
}

export async function reopenProjectTask(
  taskId: string,
): Promise<ProjectCommandResult> {
  return updateProjectTaskStatus(taskId, "todo");
}

export async function updateProjectTaskStatus(
  taskId: string,
  status: ProjectTaskStatus,
): Promise<ProjectCommandResult> {
  return withProjectCommand(
    (userId) => projectService.updateTaskStatus(userId, taskId, status),
    "Task was not found.",
    "task_not_found",
  );
}
