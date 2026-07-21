"use client";

import { summarizeLatency } from "./latency-stats";
import type {
  LatencyApiResult,
  LatencyMetricKey,
  LatencyProbe,
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
  const frontendBackendMs = await measureFrontendBackendRtt();
  const databaseResult = await requestLatencyProbe("database");

  if (!databaseResult.ok || databaseResult.probe !== "database") {
    throw new Error(
      databaseResult.ok
        ? "Latency diagnostics returned the wrong probe."
        : databaseResult.message,
    );
  }

  return {
    frontendBackendMs,
    backendDatabaseMs: databaseResult.databaseMs,
  };
}

async function measureFrontendBackendRtt() {
  const startedAt = performance.now();
  const result = await requestLatencyProbe("backend");

  if (!result.ok) {
    throw new Error(result.message);
  }

  return roundMs(performance.now() - startedAt);
}

async function requestLatencyProbe(probe: LatencyProbe) {
  const response = await fetch("/api/developer/performance/latency", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ probe }),
  });
  const result = (await response.json()) as LatencyApiResult;

  if (!response.ok && result.ok) {
    return {
      ok: false as const,
      code: "performance_latency_failed",
      message: "Latency diagnostics failed.",
    };
  }

  return result;
}

function roundMs(value: number) {
  return Math.round(value * 10) / 10;
}
