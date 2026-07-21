export type LatencyMetricKey = "frontendBackendMs" | "backendDatabaseMs";

export type LatencySample = {
  frontendBackendMs: number;
  backendDatabaseMs: number;
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

export type LatencyProbe = "backend" | "database";

export type BackendLatencyApiSuccess = {
  ok: true;
  measuredAt: string;
  probe: "backend";
};

export type DatabaseLatencyApiSuccess = {
  ok: true;
  measuredAt: string;
  probe: "database";
  databaseMs: number;
};

export type LatencyApiSuccess =
  | BackendLatencyApiSuccess
  | DatabaseLatencyApiSuccess;

export type LatencyApiFailure = {
  ok: false;
  code: string;
  message: string;
};

export type LatencyApiResult = LatencyApiSuccess | LatencyApiFailure;
