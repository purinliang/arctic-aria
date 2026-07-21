"use client";

// Settings Page - Developer Tools Panel.
import { Gauge, LoaderCircle, Wrench } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import {
  secondaryButtonBorderColorClass,
  secondaryTextColorClass,
} from "@/components/color";
import { CardHeader } from "@/components/card";
import { List, ListItem, ListItemContent } from "@/components/list";
import { Panel } from "@/components/panel";
import { LabelText, SupportingText } from "@/components/text";
import { DeveloperImportToolItems } from "@/features/developer/components/DeveloperImportToolItems";
import type { DeveloperImportTarget } from "@/features/developer/import-template-prompts";
import type { SettingsMessages } from "@/messages/app-messages";
import {
  latencyReportMarkdown,
  runLatencyDiagnostics,
} from "../client-latency";
import type {
  LatencyMetricKey,
  LatencyReport,
  LatencyStatSummary,
} from "../latency-types";

const metricKeys: LatencyMetricKey[] = [
  "clientTotalMs",
  "serverTotalMs",
  "databaseMs",
  "networkEstimateMs",
];

export function DeveloperToolsPanel({
  darkMode,
  messages,
  onDeveloperImportComplete,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  messages: SettingsMessages;
  onDeveloperImportComplete: (target: DeveloperImportTarget) => void;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [report, setReport] = useState<LatencyReport | null>(null);

  async function handleTestLatency() {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      setReport(await runLatencyDiagnostics());
    } catch {
      showErrorNotification(
        messages.developerTools.results.performance_latency_failed,
        messages.developerTools.notifications.latencyFailed,
      );
    } finally {
      setPending(false);
    }
  }

  async function handleCopyMarkdown() {
    if (!report) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        latencyReportMarkdown(report, messages.developerTools),
      );
      showSuccessNotification(
        messages.developerTools.results.performance_latency_copied,
        messages.developerTools.notifications.reportCopied,
      );
    } catch {
      showErrorNotification(
        messages.developerTools.results.performance_latency_copy_failed,
        messages.developerTools.notifications.reportCopyFailed,
      );
    }
  }

  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        darkMode={darkMode}
        icon={<Wrench size={18} aria-hidden="true" />}
        title={messages.developerTools.title}
        description={messages.developerTools.description}
      />
      <List darkMode={darkMode}>
        <ListItem darkMode={darkMode} className="items-start">
          <ListItemContent
            title={
              <span className="flex items-center gap-2">
                <Gauge size={14} aria-hidden="true" />
                <LabelText darkMode={darkMode}>
                  {messages.developerTools.latencyTitle}
                </LabelText>
              </span>
            }
            main={
              <SupportingText darkMode={darkMode}>
                {messages.developerTools.latencyDescription}
              </SupportingText>
            }
          />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              darkMode={darkMode}
              loading={pending}
              loadingIcon={
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              }
              onClick={handleTestLatency}
            >
              {pending
                ? messages.developerTools.testing
                : messages.developerTools.testLatency}
            </Button>
            {report ? (
              <Button darkMode={darkMode} onClick={handleCopyMarkdown}>
                {messages.developerTools.copyMarkdown}
              </Button>
            ) : null}
          </div>
        </ListItem>
        {report ? (
          <ListItem darkMode={darkMode} layout="block">
            <LatencyReportView
              darkMode={darkMode}
              messages={messages}
              report={report}
            />
          </ListItem>
        ) : null}
        <DeveloperImportToolItems
          darkMode={darkMode}
          messages={messages}
          onImportComplete={onDeveloperImportComplete}
          showErrorNotification={showErrorNotification}
          showSuccessNotification={showSuccessNotification}
        />
      </List>
    </Panel>
  );
}

function LatencyReportView({
  darkMode,
  messages,
  report,
}: {
  darkMode: boolean;
  messages: SettingsMessages;
  report: LatencyReport;
}) {
  return (
    <div className="grid gap-3">
      <SupportingText darkMode={darkMode}>
        {messages.developerTools.lastRun(report.sampleCount, report.measuredAt)}
      </SupportingText>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className={secondaryTextColorClass}>
            <tr>
              <th className="py-2 pr-3 font-semibold">
                {messages.developerTools.metric}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {messages.developerTools.avg}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {messages.developerTools.min}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {messages.developerTools.p10}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {messages.developerTools.p50}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {messages.developerTools.p90}
              </th>
              <th className="py-2 pl-3 text-right font-semibold">
                {messages.developerTools.max}
              </th>
            </tr>
          </thead>
          <tbody>
            {metricKeys.map((key) => (
              <LatencyMetricRow
                key={key}
                label={messages.developerTools.metrics[key]}
                summary={report.metrics[key]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LatencyMetricRow({
  label,
  summary,
}: {
  label: string;
  summary: LatencyStatSummary;
}) {
  return (
    <tr className={`border-t ${secondaryButtonBorderColorClass}`}>
      <td className="py-2 pr-3 font-medium">{label}</td>
      <td className="px-3 py-2 text-right">{formatMs(summary.avg)}</td>
      <td className="px-3 py-2 text-right">{formatMs(summary.min)}</td>
      <td className="px-3 py-2 text-right">{formatMs(summary.p10)}</td>
      <td className="px-3 py-2 text-right">{formatMs(summary.p50)}</td>
      <td className="px-3 py-2 text-right">{formatMs(summary.p90)}</td>
      <td className="py-2 pl-3 text-right">{formatMs(summary.max)}</td>
    </tr>
  );
}

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}
