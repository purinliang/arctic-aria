// Ideas Page.
import { Lightbulb } from "lucide-react";
import { CardHeader } from "@/components/card";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import { formatDateKey } from "@/components/forms/date-format";
import type { IdeaPageItem } from "../actions";
import type { IdeaMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

type IdeaRowItem = {
  id: string;
  rawText: string;
  source: IdeaPageItem["source"];
  createdDate: string;
  prototype: boolean;
};

export function IdeasPage({
  darkMode,
  ideas,
  loading,
  messages,
  dateMessages,
}: {
  darkMode: boolean;
  ideas: IdeaPageItem[];
  loading: boolean;
  messages: IdeaMessages;
  dateMessages: DatePickerMessages;
}) {
  const rows: IdeaRowItem[] =
    ideas.length > 0
      ? ideas.map((idea) => ({
          id: idea.id,
          rawText: idea.rawText,
          source: idea.source,
          createdDate: idea.createdDate,
          prototype: false,
        }))
      : messages.page.prototypeItems.map((idea) => ({
          ...idea,
          prototype: true,
        }));

  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Lightbulb size={18} aria-hidden="true" />}
        title={messages.page.title}
        description={messages.page.description}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <ListItem darkMode={darkMode} layout="block">
            <DescriptionText darkMode={darkMode}>
              {messages.page.loading}
            </DescriptionText>
          </ListItem>
        ) : rows.length > 0 ? (
          rows.map((idea) => (
            <IdeaRow
              key={idea.id}
              darkMode={darkMode}
              idea={idea}
              messages={messages}
              dateMessages={dateMessages}
            />
          ))
        ) : (
          <ListItem darkMode={darkMode} layout="block">
            <p className="text-sm font-semibold">{messages.page.emptyTitle}</p>
            <DescriptionText darkMode={darkMode} className="mt-1">
              {messages.page.emptyDescription}
            </DescriptionText>
          </ListItem>
        )}
      </List>
    </Panel>
  );
}

function IdeaRow({
  darkMode,
  idea,
  messages,
  dateMessages,
}: {
  darkMode: boolean;
  idea: IdeaRowItem;
  messages: IdeaMessages;
  dateMessages: DatePickerMessages;
}) {
  const source = sourceLabel(idea.source, messages);
  const metadata = [
    source,
    messages.page.statusUntriaged,
    formatDateKey(idea.createdDate, dateMessages, idea.createdDate),
    idea.prototype ? messages.page.prototypeLabel : null,
  ].filter(Boolean);

  return (
    <ListItem darkMode={darkMode} layout="block">
      <p className="text-sm font-semibold">{idea.rawText}</p>
      <SupportingText darkMode={darkMode} className="mt-2 block">
        {metadata.join(" · ")}
      </SupportingText>
    </ListItem>
  );
}

function sourceLabel(source: IdeaPageItem["source"], messages: IdeaMessages) {
  if (source === "discord") {
    return messages.page.sourceDiscord;
  }

  if (source === "web") {
    return messages.page.sourceWeb;
  }

  if (source === "mobile") {
    return messages.page.sourceMobile;
  }

  return messages.page.sourceAgent;
}
