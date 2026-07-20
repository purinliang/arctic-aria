import type {
  LatencyMetricKey,
  LatencyReport,
  LatencySample,
  LatencyStatSummary,
} from "./latency-types.ts";

const metricKeys: LatencyMetricKey[] = [
  "clientTotalMs",
  "serverTotalMs",
  "databaseMs",
  "networkEstimateMs",
];

export function summarizeLatency(samples: LatencySample[]): LatencyReport {
  return {
    sampleCount: samples.length,
    measuredAt: new Date().toISOString(),
    metrics: Object.fromEntries(
      metricKeys.map((key) => [
        key,
        summarizeNumbers(samples.map((sample) => sample[key])),
      ]),
    ) as Record<LatencyMetricKey, LatencyStatSummary>,
  };
}

export function summarizeNumbers(values: number[]): LatencyStatSummary {
  if (values.length === 0) {
    return {
      min: 0,
      p10: 0,
      p50: 0,
      p90: 0,
      max: 0,
      avg: 0,
    };
  }

  const sorted = values.toSorted((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  return {
    min: roundMs(sorted[0] ?? 0),
    p10: roundMs(percentile(sorted, 0.1)),
    p50: roundMs(percentile(sorted, 0.5)),
    p90: roundMs(percentile(sorted, 0.9)),
    max: roundMs(sorted[sorted.length - 1] ?? 0),
    avg: roundMs(total / sorted.length),
  };
}

function percentile(sortedValues: number[], percentileValue: number) {
  if (sortedValues.length === 0) {
    return 0;
  }

  if (sortedValues.length === 1) {
    return sortedValues[0] ?? 0;
  }

  const index = (sortedValues.length - 1) * percentileValue;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const lowerValue = sortedValues[lowerIndex] ?? 0;
  const upperValue = sortedValues[upperIndex] ?? lowerValue;
  const weight = index - lowerIndex;

  return lowerValue + (upperValue - lowerValue) * weight;
}

function roundMs(value: number) {
  return Math.round(value * 10) / 10;
}
