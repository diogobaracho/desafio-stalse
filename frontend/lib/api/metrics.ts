import { request } from "./client";
import type { Metrics } from "./types";

export function getMetrics(): Promise<Metrics> {
  return request<Metrics>("/metrics");
}
