"use client";

// Design Page - Buttons.
import type { ReactNode } from "react";
import { MoreHorizontal, Plus, Save } from "lucide-react";
import { Button, type ButtonTone } from "@/components/button";
import { ContentSubsection } from "@/components/content-section";
import { controlGapClass, sectionStackClass } from "@/components/spacing";
import { SupportingText } from "@/components/text";
import { cx } from "@/components/utils";
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
    <div className={sectionStackClass}>
      {buttonToneGroups.map((group) => (
        <ButtonToneSubsection
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
    </div>
  );
}

function ButtonToneSubsection({
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
    <ContentSubsection
      darkMode={darkMode}
      title={title}
      description={description}
      bodyClassName="grid"
    >
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
    </ContentSubsection>
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
    <div
      className={cx(
        "grid sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center",
        controlGapClass,
      )}
    >
      <SupportingText
        darkMode={darkMode}
        className="font-[var(--aa-font-weight-semibold)]"
      >
        {label}
      </SupportingText>
      <div className={cx("flex min-w-0 flex-wrap items-center", controlGapClass)}>
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
