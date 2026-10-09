import { request } from "./client";
import type { Health } from "./types";

export function getHealth(): Promise<Health> {
  return request<Health>("/health");
}

/** Read-only flag for the UI; an unreachable API is treated as "not read-only" (pages show their own errors). */
export async function isReadOnly(): Promise<boolean> {
  try {
    return (await getHealth()).read_only;
  } catch {
    return false;
  }
}
