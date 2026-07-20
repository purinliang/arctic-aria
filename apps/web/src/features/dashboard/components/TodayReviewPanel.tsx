// Dashboard Page - Review Panel.
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { Panel } from "@/components/panel";
import { DescriptionText, LabelText } from "@/components/text";
import {
  reviewSummaryForDate,
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
  const doneTasks = tasks.filter((task) => task.status === "done");
  const openTasks = tasks.filter((task) => task.status !== "done");
  const doneRoutines = routines.filter(
    (routine) => routine.status === "completed",
  );
  const openRoutines = routines.filter(
    (routine) => routine.status !== "completed",
  );
  const experiencedMemories = pinnedMemories.filter(
    (memory) => memory.status === "completed",
  );
  const openMemories = pinnedMemories.filter(
    (memory) => memory.status !== "completed",
  );
  const dailySummary = reviewSummaryForDate(
    todayReviewDateKey(),
    messages.dailySummaryOptions,
  );

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
      <div className="grid gap-3 px-4 py-4">
        <DescriptionText darkMode={darkMode}>{dailySummary}</DescriptionText>

        <div className="grid gap-2">
          <ReviewSummaryLine
            darkMode={darkMode}
            label={messages.summary.doneTasks}
            value={summaryValue(doneTasks, messages.summary.none)}
          />
          <ReviewSummaryLine
            darkMode={darkMode}
            label={messages.summary.openTasks}
            value={summaryValue(openTasks, messages.summary.none)}
          />
          <ReviewSummaryLine
            darkMode={darkMode}
            label={messages.summary.doneRoutines}
            value={summaryValue(doneRoutines, messages.summary.none)}
          />
          <ReviewSummaryLine
            darkMode={darkMode}
            label={messages.summary.openRoutines}
            value={summaryValue(openRoutines, messages.summary.none)}
          />
          <ReviewSummaryLine
            darkMode={darkMode}
            label={messages.summary.experiencedMemories}
            value={summaryValue(experiencedMemories, messages.summary.none)}
          />
          <ReviewSummaryLine
            darkMode={darkMode}
            label={messages.summary.openMemories}
            value={summaryValue(openMemories, messages.summary.none)}
          />
        </div>
      </div>
    </Panel>
  );
}

function ReviewSummaryLine({
  darkMode,
  label,
  value,
}: {
  darkMode: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <LabelText darkMode={darkMode}>{label}</LabelText>
      <DescriptionText darkMode={darkMode} className="line-clamp-2">
        {value}
      </DescriptionText>
    </div>
  );
}

function summaryValue(items: Array<{ title: string }>, emptyText: string) {
  return items.length > 0
    ? items.map((item) => item.title).join(", ")
    : emptyText;
}
