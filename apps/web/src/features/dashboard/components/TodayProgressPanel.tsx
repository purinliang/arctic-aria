// Dashboard Page - Today progress panel.
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { CardHeader } from "@/components/card";
import { panelColorClass } from "@/components/color";
import { HorizontalProgressBar } from "@/components/horizontal-progress-bar";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import { cx } from "@/components/utils";
import { localScheduledDayProgress } from "@/features/settings/time-zones";
import type { DashboardMessages } from "@/messages/app-messages";
import { todayReviewCompletionProgress } from "../today-review-text";
import type { Routine, Task } from "../types";

export function TodayProgressPanel({
  darkMode,
  routines,
  tasks,
  messages,
  resolvedTimeZone,
}: {
  darkMode: boolean;
  routines: Routine[];
  tasks: Task[];
  messages: DashboardMessages["progress"];
  resolvedTimeZone: string;
}) {
  const doneTaskCount = tasks.filter((task) => task.status === "done").length;
  const openTaskCount = tasks.length - doneTaskCount;
  const doneRoutineCount = routines.filter(
    (routine) => routine.status === "completed",
  ).length;
  const openRoutineCount = routines.length - doneRoutineCount;
  const progress = todayReviewCompletionProgress({
    doneTaskCount,
    openTaskCount,
    doneRoutineCount,
    openRoutineCount,
  }).value;
  const timeProgress = localScheduledDayProgress({
    date: new Date(),
    timeZone: resolvedTimeZone,
  });

  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<ChartNoAxesColumnIncreasing size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        darkMode={darkMode}
      />
      <div className="grid gap-3 px-4 py-4">
        <PlanHint darkMode={darkMode} messages={messages} />
        <HorizontalProgressBar
          primary={progress}
          secondary={timeProgress}
          ariaLabel={messages.progressLabel}
          className="h-2"
        />
        <SupportingText darkMode={darkMode} className="truncate">
          {[
            progressCountText(
              doneTaskCount,
              tasks.length,
              messages.tasksDone,
              messages.noTasks,
            ),
            progressCountText(
              doneRoutineCount,
              routines.length,
              messages.routinesDone,
              messages.noRoutines,
            ),
          ].join(" · ")}
        </SupportingText>
      </div>
    </Panel>
  );
}

function PlanHint({
  darkMode,
  messages,
}: {
  darkMode: boolean;
  messages: DashboardMessages["progress"];
}) {
  return (
    <div className="group relative w-fit max-w-full">
      <DescriptionText darkMode={darkMode}>
        <span
          className="inline-block cursor-help rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aa-primary-button-bg)]"
          tabIndex={0}
          aria-label={`${messages.planTooltipTitle} ${messages.planSupport}`}
        >
          {messages.planText}
        </span>
      </DescriptionText>
      <div
        className={cx(
          "pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-[min(20rem,calc(100vw-2rem))] rounded-md border p-3 text-left shadow-xl group-hover:grid group-focus-within:grid",
          panelColorClass,
        )}
      >
        <p className="text-sm font-semibold text-[var(--aa-primary-text)]">
          {messages.planTooltipTitle}
        </p>
        <p className="mt-2 text-sm leading-5 text-[var(--aa-secondary-text)]">
          {messages.planSupport}
        </p>
      </div>
    </div>
  );
}

function progressCountText(
  done: number,
  total: number,
  formatter: (done: number, total: number) => string,
  emptyText: string,
) {
  return total > 0 ? formatter(done, total) : emptyText;
}
