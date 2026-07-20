// Dashboard Page - Today Review Panel.
import { Send } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { Panel } from "@/components/panel";
import { DescriptionText } from "@/components/text";
import type { DashboardMessages } from "@/messages/app-messages";

export function TodayReviewPanel({
  darkMode,
  pending,
  messages,
  onSend,
}: {
  darkMode: boolean;
  pending: boolean;
  messages: DashboardMessages["review"];
  onSend: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Send size={18} aria-hidden="true" />}
        title={messages.title}
        action={
          <Button
            darkMode={darkMode}
            size="sm"
            tone="secondary"
            loading={pending}
            onClick={onSend}
          >
            {pending ? messages.sending : messages.send}
          </Button>
        }
      />
      <div className="px-4 py-4">
        <DescriptionText darkMode={darkMode}>
          {messages.description}
        </DescriptionText>
      </div>
    </Panel>
  );
}
