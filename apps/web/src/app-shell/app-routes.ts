import type { DashboardView } from "@/features/dashboard/types";

export type AppRouteState = {
  view: DashboardView;
  projectId: string | null;
};

const viewPaths: Record<Exclude<DashboardView, "dashboard">, string> = {
  design: "/design",
  events: "/events",
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

export function isSupportedAppPathname(pathname: string) {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/" || normalizedPath === "/today") {
    return true;
  }

  if (normalizedPath === "/projects") {
    return true;
  }

  if (normalizedPath.startsWith("/projects/")) {
    const routeSegment = normalizedPath.slice("/projects/".length);

    return Boolean(routeSegment) && !routeSegment.includes("/");
  }

  return Object.values(viewPaths).some((path) => normalizedPath === path);
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

export function browserPathname() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.pathname;
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
