import assert from "node:assert/strict";
import test from "node:test";
import {
  appPathForProject,
  appPathForView,
  appRouteFromPathname,
} from "../app-routes.ts";

test("app routes map root and today to dashboard", () => {
  assert.deepEqual(appRouteFromPathname("/"), {
    view: "dashboard",
    projectId: null,
  });
  assert.deepEqual(appRouteFromPathname("/today"), {
    view: "dashboard",
    projectId: null,
  });
});

test("app routes map major pages", () => {
  assert.deepEqual(appRouteFromPathname("/projects"), {
    view: "projects",
    projectId: null,
  });
  assert.deepEqual(appRouteFromPathname("/routines"), {
    view: "routines",
    projectId: null,
  });
  assert.deepEqual(appRouteFromPathname("/memories"), {
    view: "memories",
    projectId: null,
  });
  assert.deepEqual(appRouteFromPathname("/ideas"), {
    view: "ideas",
    projectId: null,
  });
  assert.deepEqual(appRouteFromPathname("/settings"), {
    view: "settings",
    projectId: null,
  });
});

test("app routes map project detail paths", () => {
  assert.deepEqual(appRouteFromPathname("/projects/project-one"), {
    view: "projects",
    projectId: "project-one",
  });
  assert.equal(appPathForProject("project one"), "/projects/project%20one");
});

test("app routes ignore unsupported project query route", () => {
  assert.deepEqual(appRouteFromPathname("/project"), {
    view: "dashboard",
    projectId: null,
  });
});

test("app route path builders use stable page paths", () => {
  assert.equal(appPathForView("dashboard"), "/today");
  assert.equal(appPathForView("projects"), "/projects");
  assert.equal(appPathForView("routines"), "/routines");
  assert.equal(appPathForView("memories"), "/memories");
  assert.equal(appPathForView("ideas"), "/ideas");
  assert.equal(appPathForView("settings"), "/settings");
});
