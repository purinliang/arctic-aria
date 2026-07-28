export type DeveloperImportTarget = "projects" | "routines";
export type DeveloperImportDetection = DeveloperImportTarget | "ambiguous" | null;

export const developerImportMarkdownTemplates: Record<
  DeveloperImportTarget,
  string
> = {
  projects: `# Project: Find a job

Objective: Land a backend role.
Start date: 2026-07-22
Timeline: duration
Duration: 3_6_months

## Milestone: Applications

Objective: Submit strong applications.
Start date: 2026-07-22
Timeline: duration
Duration: 1_3_months

### Tasks

- Title: Prepare resume
  Description: Rewrite backend experience bullets.
  Estimated duration minutes: 45
  Start date: 2026-07-22
  Deadline: 2026-07-30

- Title: Apply to first role
  Description: Send one careful application.
  Estimated duration minutes: 30
  Start date: 2026-07-23
  Deadline: 2026-08-01

## Milestone: Interviews

Objective: Prepare for interview loops.
Start date: 2026-08-01
Timeline: duration
Duration: 1_3_months

### Tasks

- Title: Practice system design
  Description: Review one system design topic.
  Estimated duration minutes: 60
  Start date: 2026-08-01
  Deadline: 2026-08-07

---

<!-- Add another Project block here if you want to import multiple projects. -->

<!-- Project import rules: one Project block creates one project. Repeat the Project heading to import multiple projects. Keep tasks nested under the milestone they belong to. -->
<!-- Legal project fields: Objective, Start date, Timeline, Duration, Deadline. -->
<!-- Legal milestone fields: Objective, Start date, Timeline, Duration, Deadline. -->
<!-- Legal task fields: Title, Description, Estimated duration minutes, Start date, Deadline. -->
<!-- Estimated duration minutes is optional and must be a whole number from 1 to 1440. Leave it empty if the estimate is unknown. -->
<!-- Legal duration values: 1_3_months, 3_6_months, 6_12_months, 1_3_years. -->
<!-- Each field is single-line "Field: value"; multiline values are not supported. -->
<!-- Timeline is either duration with Duration, or deadline with Deadline. -->
<!-- Plan milestone dates as a realistic sequence. Do not start every milestone on the project start date unless the work truly runs in parallel. -->
<!-- Put externally constrained work early enough to leave buffer for people, organizations, bookings, approvals, tests, documents, shipping, and waiting time. -->`,
  routines: `Routine: Morning walk

Description: A short walk to start the day.
Estimated duration minutes: 15
Start date: 2026-07-22
End date:
Repeat: once
Fixed interval days:
Preferred time: 08:30
Timezone: Australia/Melbourne

---

Routine: Evening reset

Description: Clear small loose ends before tomorrow.
Estimated duration minutes: 15
Start date: 2026-07-22
End date:
Repeat: daily
Fixed interval days:
Preferred time: 21:30
Timezone: Australia/Melbourne

<!-- Routine import rules: one Routine block creates one routine. Repeat the Routine heading to import multiple routines. -->
<!-- Legal fields: Description, Estimated duration minutes, Start date, End date, Repeat, Fixed interval days, Preferred time, Timezone. -->
<!-- Estimated duration minutes is optional and must be a whole number from 1 to 1440. Leave it empty if the estimate is unknown. -->
<!-- Repeat is once, daily, weekly, monthly, yearly, every_14_days, every_30_days, or fixed_days. -->
<!-- Fixed interval days is only used when Repeat is fixed_days. Examples: 1 = daily, 2 = every 2 days, 7 = weekly. -->
<!-- Each field is single-line "Field: value"; multiline values are not supported. -->`,
};

export function developerImportPromptFor(target: DeveloperImportTarget) {
  return `${developerImportInstructionFor(target)}

${developerImportMarkdownTemplates[target]}

My requirement is:
`;
}

export function detectDeveloperImportTarget(
  source: string,
): DeveloperImportDetection {
  const trimmedSource = source.trim();

  if (!trimmedSource) {
    return null;
  }

  const jsonTarget = detectJsonTarget(trimmedSource);

  if (jsonTarget) {
    return jsonTarget;
  }

  return detectMarkdownTarget(trimmedSource);
}

function developerImportInstructionFor(target: DeveloperImportTarget) {
  if (target === "projects") {
    return [
      "According to the following template, parse my requirement into the same Arctic Aria project import Markdown.",
      "Return only the filled import document.",
      "Supported timeline types are duration and deadline.",
      "Supported duration values are 1_3_months, 3_6_months, 6_12_months, and 1_3_years.",
      "If my requirement uses another duration, choose the closest supported duration; if unclear, use 3_6_months.",
      "Task estimated duration is optional. Use Estimated duration minutes only when there is a clear 1-1440 minute estimate.",
      "Plan milestone start dates and deadlines as a realistic sequence. Do not put every milestone on the project start date unless the work truly runs in parallel.",
      "When deadlines depend on physical-world constraints, other people, organizations, bookings, approvals, tests, documents, shipping, or waiting time, schedule those tasks and milestone deadlines early enough to leave buffer before the final project deadline.",
      "You may include multiple Project blocks in one document.",
    ].join("\n");
  }

  return [
    "According to the following template, parse my requirement into the same Arctic Aria routine import Markdown.",
    "Return only the filled import document.",
    "Supported repeat values are once, daily, weekly, monthly, yearly, every_14_days, every_30_days, and fixed_days.",
    "Routine estimated duration is optional. Use Estimated duration minutes only when there is a clear 1-1440 minute estimate.",
    "If fixed_days is used, include Fixed interval days; for example 1 means daily, 2 means every 2 days, and 7 means weekly. Otherwise leave Fixed interval days empty.",
    "You may include multiple Routine blocks in one document.",
  ].join("\n");
}

function detectMarkdownTarget(markdown: string): DeveloperImportDetection {
  const hasProject = /^#{0,6}\s*Project\s*:/im.test(markdown);
  const hasRoutine = /^#{0,6}\s*Routine\s*:/im.test(markdown);

  if (hasProject && hasRoutine) {
    return "ambiguous";
  }

  if (hasProject) {
    return "projects";
  }

  if (hasRoutine) {
    return "routines";
  }

  return null;
}

function detectJsonTarget(source: string): DeveloperImportDetection {
  if (!source.startsWith("{")) {
    return null;
  }

  try {
    return detectJsonValueTarget(JSON.parse(source));
  } catch {
    return null;
  }
}

function detectJsonValueTarget(value: unknown): DeveloperImportDetection {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.format === "markdown" &&
    typeof value.source === "string"
  ) {
    return detectMarkdownTarget(value.source);
  }

  if (value.format === "json") {
    if (typeof value.source === "string") {
      try {
        return detectJsonValueTarget(JSON.parse(value.source));
      } catch {
        return null;
      }
    }

    return detectJsonValueTarget(value.source);
  }

  const hasProject = "project" in value || "projects" in value;
  const hasRoutine = "routine" in value || "routines" in value;

  if (hasProject && hasRoutine) {
    return "ambiguous";
  }

  if (hasProject) {
    return "projects";
  }

  if (hasRoutine) {
    return "routines";
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
