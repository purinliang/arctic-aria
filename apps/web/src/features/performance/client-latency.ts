"use client";

import { summarizeLatency } from "./latency-stats";
import type {
  LatencyApiResult,
  LatencyMetricKey,
  LatencyReport,
  LatencySample,
} from "./latency-types";

export const latencySampleCount = 30;

export type LatencyReportLabels = {
  avg: string;
  max: string;
  metric: string;
  metrics: Record<LatencyMetricKey, string>;
  min: string;
  p10: string;
  p50: string;
  p90: string;
  markdownTitle: (sampleCount: number, measuredAt: string) => string;
};

export async function runLatencyDiagnostics(): Promise<LatencyReport> {
  const samples: LatencySample[] = [];

  for (let index = 0; index < latencySampleCount; index += 1) {
    samples.push(await runLatencySample());
  }

  const report = summarizeLatency(samples);

  console.table(
    Object.entries(report.metrics).map(([metric, summary]) => ({
      metric,
      ...summary,
    })),
  );

  return report;
}

export function latencyReportMarkdown(
  report: LatencyReport,
  labels: LatencyReportLabels,
) {
  const lines = [
    labels.markdownTitle(report.sampleCount, report.measuredAt),
    "",
    `| ${labels.metric} | ${labels.avg} | ${labels.min} | ${labels.p10} | ${labels.p50} | ${labels.p90} | ${labels.max} |`,
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const [key, summary] of Object.entries(report.metrics)) {
    const metricKey = key as LatencyMetricKey;

    lines.push(
      `| ${labels.metrics[metricKey]} | ${formatMs(summary.avg)} | ${formatMs(summary.min)} | ${formatMs(summary.p10)} | ${formatMs(summary.p50)} | ${formatMs(summary.p90)} | ${formatMs(summary.max)} |`,
    );
  }

  return lines.join("\n");
}

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}

async function runLatencySample(): Promise<LatencySample> {
  const clientStartedAt = performance.now();
  const response = await fetch("/api/developer/performance/latency", {
    method: "POST",
    cache: "no-store",
  });
  const clientTotalMs = performance.now() - clientStartedAt;
  const result = (await response.json()) as LatencyApiResult;

  if (!response.ok || !result.ok) {
    throw new Error(
      !result.ok ? result.message : "Latency diagnostics failed.",
    );
  }

  return {
    clientTotalMs: roundMs(clientTotalMs),
    serverTotalMs: result.serverTotalMs,
    databaseMs: result.databaseMs,
    networkEstimateMs: roundMs(
      Math.max(0, clientTotalMs - result.serverTotalMs),
    ),
  };
}

function roundMs(value: number) {
  return Math.round(value * 10) / 10;
}
