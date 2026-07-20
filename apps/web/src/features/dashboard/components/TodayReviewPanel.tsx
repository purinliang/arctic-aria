// Dashboard Page - Review Panel.
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { Panel } from "@/components/panel";
import { DescriptionText } from "@/components/text";
import {
  buildTodayReviewSummary,
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

  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<ClipboardCheck size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        action={
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
      />
      <div className="px-4 py-4">
        <DescriptionText darkMode={darkMode}>{summaryText}</DescriptionText>
      </div>
    </Panel>
  );
}
