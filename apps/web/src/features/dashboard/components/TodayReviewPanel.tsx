// Dashboard Page - Today Review Panel.
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { Panel } from "@/components/panel";
import type { DashboardMessages } from "@/messages/app-messages";

export function TodayReviewPanel({
  darkMode,
  pending,
  showSendAction,
  messages,
  onSend,
}: {
  darkMode: boolean;
  pending: boolean;
  showSendAction: boolean;
  messages: DashboardMessages["review"];
  onSend: () => void;
}) {
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
    </Panel>
  );
}
