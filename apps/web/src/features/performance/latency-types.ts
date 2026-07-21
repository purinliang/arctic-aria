export type LatencyMetricKey =
  | "clientTotalMs"
  | "serverTotalMs"
  | "databaseMs"
  | "networkEstimateMs";

export type LatencySample = {
  clientTotalMs: number;
  serverTotalMs: number;
  databaseMs: number;
  networkEstimateMs: number;
};

export type LatencyStatSummary = {
  min: number;
  p10: number;
  p50: number;
  p90: number;
  max: number;
  avg: number;
};

export type LatencyReport = {
  sampleCount: number;
  measuredAt: string;
  metrics: Record<LatencyMetricKey, LatencyStatSummary>;
};

export type LatencyApiSuccess = {
  ok: true;
  measuredAt: string;
  serverTotalMs: number;
  databaseMs: number;
};

export type LatencyApiFailure = {
  ok: false;
  code: string;
  message: string;
};

export type LatencyApiResult = LatencyApiSuccess | LatencyApiFailure;
