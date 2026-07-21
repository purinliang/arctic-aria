export type DeveloperImportTarget = "projects" | "routines";

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
  Start date: 2026-07-22
  Deadline: 2026-07-30

- Title: Apply to first role
  Description: Send one careful application.
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
  Start date: 2026-08-01
  Deadline: 2026-08-07

<!-- Project import rules: one Project block creates one project. Repeat the Project heading to import multiple projects. Keep tasks nested under the milestone they belong to. -->
<!-- Legal project fields: Objective, Start date, Timeline, Duration, Deadline. -->
<!-- Legal milestone fields: Objective, Start date, Timeline, Duration, Deadline. -->
<!-- Legal task fields: Title, Description, Start date, Deadline. -->
<!-- Legal duration values: 1_3_months, 3_6_months, 6_12_months, 1_3_years. -->
<!-- Each field is single-line "Field: value"; multiline values are not supported. -->
<!-- Timeline is either duration with Duration, or deadline with Deadline. -->`,
  routines: `Routine: Morning walk

Description: A short walk to start the day.
First start date: 2026-07-22
End date:
Repeat: daily
Fixed interval days:
Preferred time: 08:30
Timezone: Australia/Melbourne

Routine: Evening reset

Description: Clear small loose ends before tomorrow.
First start date: 2026-07-22
End date:
Repeat: daily
Fixed interval days:
Preferred time: 21:30
Timezone: Australia/Melbourne

<!-- Routine import rules: one Routine block creates one routine. Repeat the Routine heading to import multiple routines. -->
<!-- Legal fields: Description, First start date, End date, Repeat, Fixed interval days, Preferred time, Timezone. -->
<!-- Repeat is daily, weekly, monthly, every_14_days, every_30_days, or fixed_days. -->
<!-- Fixed interval days is only used when Repeat is fixed_days. -->
<!-- Each field is single-line "Field: value"; multiline values are not supported. -->`,
};

export function developerImportPromptFor(target: DeveloperImportTarget) {
  return `${developerImportInstructionFor(target)}

${developerImportMarkdownTemplates[target]}

My requirement is:
`;
}

function developerImportInstructionFor(target: DeveloperImportTarget) {
  if (target === "projects") {
    return [
      "According to the following template, parse my requirement into the same Arctic Aria project import Markdown.",
      "Return only the filled import document.",
      "Supported timeline types are duration and deadline.",
      "Supported duration values are 1_3_months, 3_6_months, 6_12_months, and 1_3_years.",
      "If my requirement uses another duration, choose the closest supported duration; if unclear, use 3_6_months.",
      "You may include multiple Project blocks in one document.",
    ].join("\n");
  }

  return [
    "According to the following template, parse my requirement into the same Arctic Aria routine import Markdown.",
    "Return only the filled import document.",
    "Supported repeat values are daily, weekly, monthly, every_14_days, every_30_days, and fixed_days.",
    "If fixed_days is used, include Fixed interval days; otherwise leave Fixed interval days empty.",
    "You may include multiple Routine blocks in one document.",
  ].join("\n");
}
