import { ApiError } from "./api/client";

const KNOWN_CODES = new Set([
  "network_error",
  "ticket_not_found",
  "validation_error",
  "read_only_mode",
  "metrics_unavailable",
  "internal_error",
]);

/** Maps any thrown value to a translation key under `errors.*`. */
export function errorMessageKey(error: unknown): string {
  if (error instanceof ApiError && KNOWN_CODES.has(error.code)) return `errors.${error.code}`;
  return "errors.generic";
}
