// Design Page - Typography.
import type { ReactNode } from "react";
import { Card } from "@/components/card";
import { cardBodyPaddingClass } from "@/components/spacing";
import {
  Text,
  TextStack,
  type TextSize,
  type TextTone,
  type TextWeight,
} from "@/components/text";
import { cx } from "@/components/utils";
import type { DesignMessages } from "@/messages/design-messages";

const textSizes: TextSize[] = ["xs", "sm", "md", "lg", "xl", "page"];
const textWeights: TextWeight[] = ["light", "normal", "medium", "semibold"];
const textTones: TextTone[] = ["primary", "secondary", "inverse", "current"];

export function DesignTypographyPage({
  darkMode,
  messages,
}: {
  darkMode: boolean;
  messages: DesignMessages["typography"];
}) {
  return (
    <div className="grid gap-[var(--aa-space-section-gap)]">
      <TypographySection
        title={messages.sizesTitle}
        description={messages.sizesDescription}
      >
        <div className="grid gap-[var(--aa-space-body-gap)]">
          {textSizes.map((size) => (
            <Card key={size} darkMode={darkMode}>
              <div
                className={cx(
                  "grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-[var(--aa-space-inline-gap)]",
                  cardBodyPaddingClass,
                )}
              >
                <Text size="sm" tone="secondary" weight="medium">
                  {messages.sizeLabels[size]}
                </Text>
                <Text size={size} weight="semibold">
                  {messages.sampleTitle}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      </TypographySection>

      <TypographySection
        title={messages.weightsTitle}
        description={messages.weightsDescription}
      >
        <div className="grid gap-[var(--aa-space-body-gap)] sm:grid-cols-2">
          {textWeights.map((weight) => (
            <Card key={weight} darkMode={darkMode}>
              <div className={cardBodyPaddingClass}>
                <TextStack
                  title={messages.weightLabels[weight]}
                  titleProps={{ weight }}
                  description={messages.sampleDescription}
                  descriptionProps={{ weight }}
                />
              </div>
            </Card>
          ))}
        </div>
      </TypographySection>

      <TypographySection
        title={messages.tonesTitle}
        description={messages.tonesDescription}
      >
        <div className="grid gap-[var(--aa-space-body-gap)] sm:grid-cols-2">
          {textTones.map((tone) => (
            <Card key={tone} darkMode={darkMode}>
              <div
                className={cx(
                  tone === "inverse" || tone === "current"
                    ? "rounded-md bg-[var(--aa-primary-button-bg)]"
                    : undefined,
                  tone === "current"
                    ? "text-[var(--aa-primary-button-text)]"
                    : undefined,
                  cardBodyPaddingClass,
                )}
              >
                <TextStack
                  title={messages.toneLabels[tone]}
                  titleProps={{ tone, weight: "semibold" }}
                  description={messages.sampleDescription}
                  descriptionProps={{ tone }}
                  support={messages.sampleSupport}
                  supportProps={{ tone }}
                />
              </div>
            </Card>
          ))}
        </div>
      </TypographySection>

      <TypographySection
        title={messages.languageTitle}
        description={messages.languageDescription}
      >
        <div className="grid gap-[var(--aa-space-body-gap)] lg:grid-cols-2">
          <LanguageSample
            darkMode={darkMode}
            title="English"
            sample={messages.englishSample}
            support={messages.lineHeightSupport}
          />
          <LanguageSample
            darkMode={darkMode}
            title="简体中文"
            sample={messages.chineseSample}
            support={messages.lineHeightSupport}
          />
        </div>
      </TypographySection>
    </div>
  );
}

function TypographySection({
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
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function LanguageSample({
  darkMode,
  sample,
  support,
  title,
}: {
  darkMode: boolean;
  sample: string;
  support: string;
  title: string;
}) {
  return (
    <Card darkMode={darkMode}>
      <div className={cardBodyPaddingClass}>
        <TextStack
          title={title}
          titleProps={{ size: "lg" }}
          description={sample}
          descriptionProps={{ size: "md" }}
          support={support}
        />
      </div>
    </Card>
  );
}
