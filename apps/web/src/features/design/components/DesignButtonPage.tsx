"use client";

// Design Page - Buttons.
import type { ReactNode } from "react";
import { MoreHorizontal, Plus, Save } from "lucide-react";
import { Button, type ButtonTone } from "@/components/button";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
} from "@/components/list";
import type { DesignMessages } from "@/messages/design-messages";

type ButtonToneKey = keyof DesignMessages["buttons"]["tones"];

const buttonToneGroups: {
  key: ButtonToneKey;
  tone: ButtonTone;
  icon: ReactNode;
}[] = [
  {
    key: "primary",
    tone: "primary",
    icon: <Plus size={14} aria-hidden="true" />,
  },
  {
    key: "secondary",
    tone: "secondary",
    icon: <Save size={14} aria-hidden="true" />,
  },
  {
    key: "ghost",
    tone: "ghost",
    icon: <MoreHorizontal size={14} aria-hidden="true" />,
  },
];

export function DesignButtonPage({
  darkMode,
  messages,
}: {
  darkMode: boolean;
  messages: DesignMessages["buttons"];
}) {
  return (
    <List darkMode={darkMode} className="rounded-md">
      {buttonToneGroups.map((group) => (
        <ButtonToneListItem
          key={group.key}
          darkMode={darkMode}
          examples={messages.examples}
          icon={group.icon}
          states={messages.states}
          tone={group.tone}
          title={messages.tones[group.key].title}
          description={messages.tones[group.key].description}
        />
      ))}
    </List>
  );
}

function ButtonToneListItem({
  darkMode,
  description,
  examples,
  icon,
  states,
  title,
  tone,
}: {
  darkMode: boolean;
  description: string;
  examples: DesignMessages["buttons"]["examples"];
  icon: ReactNode;
  states: DesignMessages["buttons"]["states"];
  title: string;
  tone: ButtonTone;
}) {
  return (
    <ListItem darkMode={darkMode} layout="block">
      <ListItemContent
        title={<ListItemTitle>{title}</ListItemTitle>}
        main={<ListItemDescription>{description}</ListItemDescription>}
      />
      <div className="mt-3 grid gap-2">
        <ButtonExampleRow
          darkMode={darkMode}
          examples={examples}
          icon={icon}
          label={states.normal}
          tone={tone}
          toneLabel={title}
        />
        <ButtonExampleRow
          darkMode={darkMode}
          disabled
          examples={examples}
          icon={icon}
          label={states.disabled}
          tone={tone}
          toneLabel={title}
        />
      </div>
    </ListItem>
  );
}

function ButtonExampleRow({
  darkMode,
  disabled = false,
  examples,
  icon,
  label,
  tone,
  toneLabel,
}: {
  darkMode: boolean;
  disabled?: boolean;
  examples: DesignMessages["buttons"]["examples"];
  icon: ReactNode;
  label: string;
  tone: ButtonTone;
  toneLabel: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center">
      <span className="text-xs font-semibold text-[var(--aa-secondary-text)]">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button darkMode={darkMode} tone={tone} disabled={disabled} icon={icon}>
          {examples.withIcon}
        </Button>
        <Button darkMode={darkMode} tone={tone} disabled={disabled}>
          {examples.withoutIcon}
        </Button>
        <Button
          darkMode={darkMode}
          tone={tone}
          size="icon"
          disabled={disabled}
          aria-label={`${toneLabel} ${examples.iconOnly}`}
          icon={icon}
        />
      </div>
    </div>
  );
}
