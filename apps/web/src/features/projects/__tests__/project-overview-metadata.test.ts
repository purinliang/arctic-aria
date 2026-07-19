import assert from "node:assert/strict";
import test from "node:test";
import { projectOverviewTimelineMetadata } from "../project-overview-metadata.ts";
import type { ProjectDurationRange } from "../project-duration.ts";

const messages = {
  deadline: "Deadline",
  duration: "Duration",
  timeline: "Timeline",
  openEnded: "Open-ended",
};

const durations: Record<ProjectDurationRange, string> = {
  "1_3_months": "1-3 months",
  "3_6_months": "3-6 months",
  "6_12_months": "6-12 months",
  "1_3_years": "1-3 years",
};

test("project overview timeline metadata shows deadline as the exact row type", () => {
  assert.deepEqual(
    projectOverviewTimelineMetadata(
      {
        deadlineDate: "2026-08-21",
        durationRange: "3_6_months",
        expectedDurationDays: "",
      },
      messages,
      durations,
      (value) => `formatted ${value}`,
    ),
    {
      label: "Deadline",
      value: "formatted 2026-08-21",
    },
  );
});

test("project overview timeline metadata shows duration without expected wording", () => {
  assert.deepEqual(
    projectOverviewTimelineMetadata(
      {
        deadlineDate: "",
        durationRange: "3_6_months",
        expectedDurationDays: "180",
      },
      messages,
      durations,
      (value) => `formatted ${value}`,
    ),
    {
      label: "Duration",
      value: "3-6 months",
    },
  );
});

test("project overview timeline metadata keeps a legacy fallback", () => {
  assert.deepEqual(
    projectOverviewTimelineMetadata(
      {
        deadlineDate: "",
        durationRange: "3_6_months",
        expectedDurationDays: "",
      },
      messages,
      durations,
      (value) => `formatted ${value}`,
    ),
    {
      label: "Timeline",
      value: "Open-ended",
    },
  );
});
