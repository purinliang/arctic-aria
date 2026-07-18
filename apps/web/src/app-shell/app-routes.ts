import type { DashboardView } from "@/features/dashboard/types";

export type AppRouteState = {
  view: DashboardView;
  projectId: string | null;
};

const viewPaths: Record<Exclude<DashboardView, "dashboard">, string> = {
  ideas: "/ideas",
  memories: "/memories",
  projects: "/projects",
  routines: "/routines",
  settings: "/settings",
};

export function appRouteFromPathname(pathname: string): AppRouteState {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/" || normalizedPath === "/today") {
    return { view: "dashboard", projectId: null };
  }

  if (normalizedPath === "/projects") {
    return { view: "projects", projectId: null };
  }

  if (normalizedPath.startsWith("/projects/")) {
    const projectId = decodeRouteSegment(
      normalizedPath.slice("/projects/".length),
    );

    return { view: "projects", projectId: projectId || null };
  }

  for (const [view, path] of Object.entries(viewPaths)) {
    if (normalizedPath === path) {
      return { view: view as DashboardView, projectId: null };
    }
  }

  return { view: "dashboard", projectId: null };
}

export function appPathForView(view: DashboardView) {
  if (view === "dashboard") {
    return "/today";
  }

  return viewPaths[view];
}

export function appPathForProject(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}`;
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/g, "") || "/";
}

function decodeRouteSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}
