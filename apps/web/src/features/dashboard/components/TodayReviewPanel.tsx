// Dashboard Page - Review Panel.
import { ClipboardCheck, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import {
  FloatingPopover,
  PopoverDismissLayer,
} from "@/components/floating-popover";
import { HorizontalProgressBar } from "@/components/horizontal-progress-bar";
import { Panel } from "@/components/panel";
import { DescriptionText } from "@/components/text";
import {
  buildTodayReviewSummary,
  todayReviewCompletionProgress,
  todayReviewDateKey,
} from "../today-review-text.ts";
import type { DashboardMessages } from "@/messages/app-messages";
import type { PinnedMemory, Routine, Task } from "../types";

export function TodayReviewPanel({
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
  const [reviewOpen, setReviewOpen] = useState(false);
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
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<ClipboardCheck size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        action={
          <div className="relative flex items-center gap-2">
            <Button
              darkMode={darkMode}
              size="icon-sm"
              className="rounded-full"
              aria-label={messages.openSummary}
              icon={<Info size={15} aria-hidden="true" />}
              onClick={() => setReviewOpen((current) => !current)}
            />
            {showSendAction ? (
              <Button
                darkMode={darkMode}
                size="sm"
                tone="secondary"
                loading={pending}
                onClick={onSend}
              >
                {pending ? messages.sending : messages.send}
              </Button>
            ) : null}
            {reviewOpen ? (
              <>
                <PopoverDismissLayer
                  label={messages.closeSummary}
                  onDismiss={() => setReviewOpen(false)}
                />
                <FloatingPopover title={messages.title}>
                  <DescriptionText
                    darkMode={darkMode}
                    className="overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                  >
                    {summaryText}
                  </DescriptionText>
                  <HorizontalProgressBar
                    primary={todayProgress}
                    secondary={todayTimeProgress}
                  />
                </FloatingPopover>
              </>
            ) : null}
          </div>
        }
      />
      <div className="px-4 py-4">
        <HorizontalProgressBar
          primary={todayProgress}
          secondary={todayTimeProgress}
        />
      </div>
    </Panel>
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
