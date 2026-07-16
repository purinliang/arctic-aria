// Ideas Page.
import { Lightbulb } from "lucide-react";
import { CardHeader } from "@/components/card";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { IdeaMessages } from "@/messages/app-messages";

type IdeaPrototype = IdeaMessages["page"]["prototypeItems"][number];

export function IdeasPage({
  darkMode,
  messages,
}: {
  darkMode: boolean;
  messages: IdeaMessages;
}) {
  const ideas: IdeaPrototype[] = messages.page.prototypeItems;

  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Lightbulb size={18} aria-hidden="true" />}
        title={messages.page.title}
        description={messages.page.description}
      />
      <List darkMode={darkMode}>
        {ideas.length > 0 ? (
          ideas.map((idea) => (
            <IdeaRow
              key={idea.id}
              darkMode={darkMode}
              idea={idea}
              messages={messages}
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
}: {
  darkMode: boolean;
  idea: IdeaPrototype;
  messages: IdeaMessages;
}) {
  const source =
    idea.source === "discord"
      ? messages.page.sourceDiscord
      : messages.page.sourceWeb;

  return (
    <ListItem darkMode={darkMode} layout="block">
      <p className="text-sm font-semibold">{idea.rawText}</p>
      <SupportingText darkMode={darkMode} className="mt-2 block">
        {source} · {messages.page.statusUntriaged} · {idea.createdLabel} ·{" "}
        {messages.page.prototypeLabel}
      </SupportingText>
    </ListItem>
  );
}
