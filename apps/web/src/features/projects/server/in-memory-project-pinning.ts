import type {
  ProjectPinResult,
  ProjectRecord,
} from "./project-repository-types.ts";

export function pinInMemoryProject(input: {
  projects: ProjectRecord[];
  userId: string;
  projectId: string;
  occurredAt: Date;
}): ProjectPinResult {
  const project = findVisibleProject(input.projects, input.userId, input.projectId);

  if (!project) {
    return "not_found";
  }

  if (project.sidebarPinOrder) {
    return "pinned";
  }

  const usedSlots = new Set(
    input.projects
      .filter(
        (current) =>
          current.userId === input.userId &&
          current.deletedAt === null &&
          current.sidebarPinOrder !== null,
      )
      .map((current) => current.sidebarPinOrder),
  );
  const slot = [1, 2, 3].find((candidate) => !usedSlots.has(candidate));

  if (!slot) {
    return "limit_reached";
  }

  project.sidebarPinOrder = slot;
  project.updatedAt = input.occurredAt;
  return "pinned";
}

export function unpinInMemoryProject(input: {
  projects: ProjectRecord[];
  userId: string;
  projectId: string;
  occurredAt: Date;
}) {
  const project = findVisibleProject(input.projects, input.userId, input.projectId);

  if (!project) {
    return false;
  }

  if (project.sidebarPinOrder !== null) {
    project.sidebarPinOrder = null;
    project.updatedAt = input.occurredAt;
  }

  return true;
}

function findVisibleProject(
  projects: ProjectRecord[],
  userId: string,
  projectId: string,
) {
  return projects.find(
    (project) =>
      project.userId === userId &&
      project.id === projectId &&
      project.deletedAt === null,
  );
}
