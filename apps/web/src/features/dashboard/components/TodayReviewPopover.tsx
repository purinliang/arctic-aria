// Dashboard Page - Daily Review Popover.
import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import {
  FloatingPopover,
  PopoverDismissLayer,
} from "@/components/floating-popover";
import { HorizontalProgressBar } from "@/components/horizontal-progress-bar";
import { DescriptionText } from "@/components/text";
import type { DashboardMessages } from "@/messages/app-messages";
import {
  buildTodayReviewSummary,
  todayReviewCompletionProgress,
  todayReviewDateKey,
} from "../today-review-text.ts";
import type { PinnedMemory, Routine, Task } from "../types";

export function TodayReviewPopover({
  darkMode,
  pending,
  pinnedMemories,
  routines,
  showSendAction,
  tasks,
  messages,
  onSend,
}: {
  darkMode: boolean;
  pending: boolean;
  pinnedMemories: PinnedMemory[];
  routines: Routine[];
  showSendAction: boolean;
  tasks: Task[];
  messages: DashboardMessages["review"];
  onSend: () => void;
}) {
  const [open, setOpen] = useState(false);
  const doneTaskCount = tasks.filter((task) => task.status === "done").length;
  const openTaskCount = tasks.length - doneTaskCount;
  const doneRoutineCount = routines.filter(
    (routine) => routine.status === "completed",
  ).length;
  const openRoutineCount = routines.length - doneRoutineCount;
  const experiencedMemoryCount = pinnedMemories.filter(
    (memory) => memory.status === "completed",
  ).length;
  const summaryText = buildTodayReviewSummary({
    dateKey: todayReviewDateKey(),
    doneTaskCount,
    openTaskCount,
    doneRoutineCount,
    openRoutineCount,
    experiencedMemoryCount,
    messages: messages.dailySummaryMessages,
  });
  const todayProgress = todayReviewCompletionProgress({
    doneTaskCount,
    openTaskCount,
    doneRoutineCount,
    openRoutineCount,
  }).value;
  const todayTimeProgress = localDayProgress();

  return (
    <div className="relative flex shrink-0 items-center">
      <Button
        darkMode={darkMode}
        size="icon-sm"
        className="rounded-full"
        aria-label={messages.openSummary}
        icon={<ClipboardCheck size={16} aria-hidden="true" />}
        onClick={() => setOpen((current) => !current)}
      />
      {open ? (
        <>
          <PopoverDismissLayer
            label={messages.closeSummary}
            onDismiss={() => setOpen(false)}
          />
          <FloatingPopover
            title={messages.title}
            actions={
              showSendAction ? (
                <Button
                  darkMode={darkMode}
                  size="sm"
                  tone="secondary"
                  loading={pending}
                  onClick={onSend}
                >
                  {pending ? messages.sending : messages.send}
                </Button>
              ) : null
            }
          >
            <DescriptionText
              darkMode={darkMode}
              className="overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            >
              {summaryText}
            </DescriptionText>
            <DescriptionText darkMode={darkMode} className="italic">
              {messages.planSupport}
            </DescriptionText>
            <HorizontalProgressBar
              primary={todayProgress}
              secondary={todayTimeProgress}
            />
          </FloatingPopover>
        </>
      ) : null}
    </div>
  );
}

function localDayProgress(date = new Date()) {
  const elapsedMilliseconds =
    date.getHours() * 60 * 60 * 1000 +
    date.getMinutes() * 60 * 1000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds();

  return elapsedMilliseconds / (24 * 60 * 60 * 1000);
}
