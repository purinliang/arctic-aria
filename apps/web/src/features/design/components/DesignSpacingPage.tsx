// Design Page - Spacing.
import type { ReactNode } from "react";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemTextStack,
} from "@/components/list";
import { Tag } from "@/components/tag";
import { TextStack } from "@/components/text";
import type { DesignMessages } from "@/messages/design-messages";

export function DesignSpacingPage({
  darkMode,
  messages,
}: {
  darkMode: boolean;
  messages: DesignMessages["spacing"];
}) {
  return (
    <div className="grid gap-[var(--aa-space-section-gap)]">
      <SpacingSection
        title={messages.rowsTitle}
        description={messages.rowsDescription}
      >
        <List darkMode={darkMode}>
          <ListItem darkMode={darkMode}>
            <ListItemContent>
              <ListItemTextStack
                title={messages.normalRow}
                description={messages.rowDescription}
                support={messages.rowSupport}
              />
            </ListItemContent>
            <ListItemActions>
              <Tag darkMode={darkMode} tone="neutral">
                {messages.tag}
              </Tag>
            </ListItemActions>
          </ListItem>
          <ListItem darkMode={darkMode} density="compact">
            <ListItemContent>
              <ListItemTextStack
                title={messages.compactRow}
                titleClassName="text-[var(--aa-primary-text)]"
                support={messages.rowSupport}
                truncateTitle
              />
            </ListItemContent>
            <ListItemActions>
              <Tag darkMode={darkMode} tone="neutral">
                {messages.tag}
              </Tag>
            </ListItemActions>
          </ListItem>
        </List>
      </SpacingSection>
    </div>
  );
}

function SpacingSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="grid gap-[var(--aa-space-subsection-gap)]">
      <TextStack
        title={title}
        titleProps={{ as: "h3", size: "md", weight: "semibold" }}
        description={description}
      />
      {children}
    </section>
  );
}
