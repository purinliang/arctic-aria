// Dashboard Page - Today progress panel.
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { CardHeader } from "@/components/card";
import { HorizontalProgressBar } from "@/components/horizontal-progress-bar";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
} from "@/components/list";
import { Panel } from "@/components/panel";
import type { DashboardMessages } from "@/messages/app-messages";
import { todayReviewCompletionProgress } from "../today-review-text";
import type { Routine, Task } from "../types";

export function TodayProgressPanel({
  darkMode,
  routines,
  tasks,
  messages,
}: {
  darkMode: boolean;
  routines: Routine[];
  tasks: Task[];
  messages: DashboardMessages["progress"];
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
  const timeProgress = localDayProgress();

  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<ChartNoAxesColumnIncreasing size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        <ListItem darkMode={darkMode} layout="block">
          <ListItemContent
            main={
              <ListItemDescription>
                {messages.planSupport}
              </ListItemDescription>
            }
            support={
              <HorizontalProgressBar
                primary={progress}
                secondary={timeProgress}
                ariaLabel={messages.progressLabel}
                className="mt-3"
              />
            }
          />
        </ListItem>
      </List>
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
