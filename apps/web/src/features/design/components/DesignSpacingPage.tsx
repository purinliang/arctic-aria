// Design Page - Spacing.
import type { ReactNode } from "react";
import { Card } from "@/components/card";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemTextStack,
} from "@/components/list";
import {
  cardBodyPaddingClass,
  compactListRowPaddingClass,
  dialogPaddingClass,
  popoverPaddingClass,
} from "@/components/spacing";
import { Tag } from "@/components/tag";
import { Text, TextStack } from "@/components/text";
import { cx } from "@/components/utils";
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
          <article
            className={cx(
              "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[var(--aa-space-inline-gap)]",
              compactListRowPaddingClass,
            )}
          >
            <ListItemTextStack
              title={messages.compactRow}
              titleClassName="text-[var(--aa-primary-text)]"
              support={messages.rowSupport}
              truncateTitle
            />
            <Tag darkMode={darkMode} tone="blue">
              {messages.tag}
            </Tag>
          </article>
        </List>
      </SpacingSection>

      <SpacingSection
        title={messages.surfacesTitle}
        description={messages.surfacesDescription}
      >
        <div className="grid gap-[var(--aa-space-body-gap)] sm:grid-cols-2">
          <SurfaceSample
            darkMode={darkMode}
            label={messages.cardBody}
            paddingClassName={cardBodyPaddingClass}
          />
          <SurfaceSample
            darkMode={darkMode}
            label={messages.dialogBody}
            paddingClassName={dialogPaddingClass}
          />
          <SurfaceSample
            darkMode={darkMode}
            label={messages.popover}
            paddingClassName={popoverPaddingClass}
          />
          <Card darkMode={darkMode}>
            <div className={cardBodyPaddingClass}>
              <TextStack
                title={messages.tag}
                description={
                  <Tag darkMode={darkMode} tone="emerald">
                    {messages.tag}
                  </Tag>
                }
              />
            </div>
          </Card>
        </div>
      </SpacingSection>

      <SpacingSection
        title={messages.textStackTitle}
        description={messages.textStackDescription}
      >
        <Card darkMode={darkMode}>
          <div className={cardBodyPaddingClass}>
            <TextStack
              title={messages.rowTitle}
              description={messages.rowDescription}
              support={messages.rowSupport}
            />
          </div>
        </Card>
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

function SurfaceSample({
  darkMode,
  label,
  paddingClassName,
}: {
  darkMode: boolean;
  label: string;
  paddingClassName: string;
}) {
  return (
    <Card darkMode={darkMode}>
      <div className={paddingClassName}>
        <Text size="sm" tone="secondary" weight="medium">
          {label}
        </Text>
        <div className="mt-[var(--aa-space-text-title-desc)] rounded-md border border-dashed border-[var(--aa-list-divider-border)] p-[var(--aa-space-tag-y)]" />
      </div>
    </Card>
  );
}
