/**
 * The only place that performs HTTP. Every non-2xx response becomes an `ApiError` carrying the
 * backend's stable error `code`, which the UI translates (see `errors.*` in messages/).
 */
import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Browser: `NEXT_PUBLIC_API_BASE_URL` (inlined at build; `/api` behind the k8s ingress).
 * Server components: `API_INTERNAL_BASE_URL` (read at runtime, e.g. cluster DNS), falling back
 * to the public URL when it is absolute.
 */
export function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_BASE_URL ?? publicUrl;
  }
  return publicUrl;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const error = (value as { error: unknown }).error;
  return typeof error === "object" && error !== null && "code" in error;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json();
    if (isErrorBody(body)) {
      return new ApiError(response.status, body.error.code, body.error.message);
    }
  } catch {
    // Non-JSON error body (proxy page, etc.) - fall through to a generic error.
  }
  return new ApiError(response.status, "http_error", `Request failed with status ${response.status}`);
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { cache: "no-store", ...init, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "network_error", "Network request failed");
  }
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}
