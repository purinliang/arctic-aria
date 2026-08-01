// Design Page - Color.
import { Card } from "@/components/card";
import { toneClass, type Tone } from "@/components/color";
import { ContentSubsection } from "@/components/content-section";
import { DescriptionText, LabelText, SupportingText } from "@/components/text";
import { cx } from "@/components/utils";
import type { DesignMessages } from "@/messages/design-messages";

type BackgroundTokenKey = keyof DesignMessages["colors"]["tokens"];
type BackgroundTokenState = "default" | "hover" | "disabled";

const backgroundStates: BackgroundTokenState[] = [
  "default",
  "hover",
  "disabled",
] as const;

const backgroundTokenGroups: {
  key: BackgroundTokenKey;
  values: Partial<Record<BackgroundTokenState, string>>;
}[] = [
  {
    key: "page",
    values: {
      default: "var(--aa-page-bg)",
    },
  },
  {
    key: "panel",
    values: {
      default: "var(--aa-panel-bg)",
      hover: "var(--aa-panel-hover-bg)",
    },
  },
  {
    key: "panelHeader",
    values: {
      default: "var(--aa-panel-header-bg)",
    },
  },
  {
    key: "primaryButton",
    values: {
      default: "var(--aa-primary-button-bg)",
      hover: "var(--aa-primary-button-hover-bg)",
      disabled: "var(--aa-primary-button-disabled-bg)",
    },
  },
  {
    key: "secondaryButton",
    values: {
      default: "var(--aa-secondary-button-bg)",
      hover: "var(--aa-secondary-button-hover-bg)",
      disabled: "var(--aa-secondary-button-disabled-bg)",
    },
  },
  {
    key: "textInput",
    values: {
      default: "var(--aa-text-input-bg)",
      hover: "var(--aa-text-input-hover-bg)",
      disabled: "var(--aa-text-input-disabled-bg)",
    },
  },
];

const semanticToneGroups: Tone[] = ["neutral", "blue", "emerald", "red"];

export function DesignColorPage({
  darkMode,
  messages,
}: {
  darkMode: boolean;
  messages: DesignMessages["colors"];
}) {
  return (
    <div className="grid gap-5">
      <ContentSubsection
        darkMode={darkMode}
        title={messages.paletteTitle}
        description={messages.paletteDescription}
        bodyClassName="grid gap-3 lg:grid-cols-2"
      >
        {backgroundTokenGroups.map((tokenGroup) => (
          <BackgroundTokenCard
            key={tokenGroup.key}
            darkMode={darkMode}
            label={messages.tokens[tokenGroup.key]}
            stateLabels={messages.states}
            unavailableLabel={messages.unavailable}
            values={tokenGroup.values}
          />
        ))}
      </ContentSubsection>
      <ContentSubsection
        darkMode={darkMode}
        title={messages.semanticTitle}
        description={messages.semanticDescription}
        bodyClassName="grid gap-3 sm:grid-cols-2"
      >
        {semanticToneGroups.map((tone) => (
          <SemanticToneCard
            key={tone}
            darkMode={darkMode}
            label={messages.semanticTones[tone].label}
            tone={tone}
            usage={messages.semanticTones[tone].usage}
          />
        ))}
      </ContentSubsection>
    </div>
  );
}

function BackgroundTokenCard({
  darkMode,
  label,
  stateLabels,
  unavailableLabel,
  values,
}: {
  darkMode: boolean;
  label: string;
  stateLabels: DesignMessages["colors"]["states"];
  unavailableLabel: string;
  values: Partial<Record<BackgroundTokenState, string>>;
}) {
  return (
    <Card darkMode={darkMode} className="overflow-hidden">
      <div className="grid gap-2 px-3 py-2.5">
        <LabelText darkMode={darkMode}>{label}</LabelText>
        <div className="grid gap-2 sm:grid-cols-3">
          {backgroundStates.map((state) => (
            <BackgroundTokenSwatch
              key={state}
              darkMode={darkMode}
              label={stateLabels[state]}
              unavailableLabel={unavailableLabel}
              value={values[state]}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function BackgroundTokenSwatch({
  darkMode,
  label,
  unavailableLabel,
  value,
}: {
  darkMode: boolean;
  label: string;
  unavailableLabel: string;
  value?: string;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <SupportingText darkMode={darkMode} className="font-semibold">
        {label}
      </SupportingText>
      <div
        className={cx(
          "h-12 rounded-md border border-[var(--aa-secondary-button-border)]",
          value ? undefined : "grid place-items-center border-dashed",
        )}
        style={value ? { background: value } : undefined}
      >
        {value ? null : (
          <SupportingText darkMode={darkMode}>
            {unavailableLabel}
          </SupportingText>
        )}
      </div>
      <code className="truncate text-xs text-[var(--aa-secondary-text)]">
        {value ? formatCssToken(value) : unavailableLabel}
      </code>
    </div>
  );
}

function formatCssToken(value: string) {
  return value.replace("var(", "").replace(")", "");
}

function SemanticToneCard({
  darkMode,
  label,
  tone,
  usage,
}: {
  darkMode: boolean;
  label: string;
  tone: Tone;
  usage: string;
}) {
  return (
    <Card darkMode={darkMode}>
      <div className="grid gap-2 px-3 py-2.5">
        <span
          className={cx(
            "inline-flex h-6 w-fit shrink-0 items-center rounded border px-2 text-xs font-semibold",
            toneClass(darkMode, tone),
          )}
        >
          {label}
        </span>
        <DescriptionText darkMode={darkMode}>{usage}</DescriptionText>
      </div>
    </Card>
  );
}
