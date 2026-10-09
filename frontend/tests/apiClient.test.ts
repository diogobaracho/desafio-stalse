import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, getApiBaseUrl, request } from "@/lib/api/client";
import { isReadOnly } from "@/lib/api/health";
import { getMetrics } from "@/lib/api/metrics";
import { getTicket, listTickets, updateTicket } from "@/lib/api/tickets";
import { errorMessageKey } from "@/lib/errors";

import { API, makeTicket, metrics } from "./fixtures";
import { errorResponse, server } from "./msw";

describe("api client", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses NEXT_PUBLIC_API_BASE_URL in the browser", () => {
    expect(getApiBaseUrl()).toBe(API);
  });

  it("prefers API_INTERNAL_BASE_URL on the server", () => {
    vi.stubEnv("API_INTERNAL_BASE_URL", "http://backend:8000");
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate a server environment
    delete globalThis.window;
    try {
      expect(getApiBaseUrl()).toBe("http://backend:8000");
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("encodes the search term and skips blank searches", async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/tickets`, ({ request: r }) => {
        urls.push(new URL(r.url).search);
        return HttpResponse.json([]);
      }),
    );

    await listTickets("  café & pão ");
    await listTickets("   ");

    expect(urls).toEqual(["?search=caf%C3%A9+%26+p%C3%A3o", ""]);
  });

  it("gets and patches tickets with JSON", async () => {
    server.use(
      http.get(`${API}/tickets/1`, () => HttpResponse.json(makeTicket())),
      http.patch(`${API}/tickets/1`, async ({ request: r }) => {
        expect(r.headers.get("content-type")).toBe("application/json");
        return HttpResponse.json(makeTicket({ ...((await r.json()) as object) }));
      }),
    );

    expect((await getTicket(1)).id).toBe(1);
    expect((await updateTicket(1, { priority: "high" })).priority).toBe("high");
    expect(await getMetrics()).toEqual(metrics);
  });

  it("turns the error envelope into an ApiError with the backend code", async () => {
    server.use(
      http.get(`${API}/tickets/9`, () => errorResponse(404, "ticket_not_found", "Ticket 9 not found.")),
    );

    const error = await getTicket(9).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "ticket_not_found", message: "Ticket 9 not found." });
    expect(errorMessageKey(error)).toBe("errors.ticket_not_found");
  });

  it("handles non-JSON error bodies safely", async () => {
    server.use(
      http.get(`${API}/metrics`, () => new HttpResponse("<html>Bad gateway</html>", { status: 502 })),
    );

    const error = await getMetrics().catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 502, code: "http_error" });
    expect(errorMessageKey(error)).toBe("errors.generic");
  });

  it("maps network failures to network_error", async () => {
    server.use(http.get(`${API}/health`, () => HttpResponse.error()));

    await expect(request("/health")).rejects.toMatchObject({ status: 0, code: "network_error" });
  });

  it("rethrows aborts so callers can ignore stale requests", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(listTickets("", controller.signal)).rejects.toThrow();
  });

  it("reads the read-only flag and treats an unreachable API as writable", async () => {
    expect(await isReadOnly()).toBe(false);

    server.use(
      http.get(`${API}/health`, () =>
        HttpResponse.json({
          status: "ok",
          service: "api",
          version: "0",
          environment: "prod",
          read_only: true,
        }),
      ),
    );
    expect(await isReadOnly()).toBe(true);

    server.use(http.get(`${API}/health`, () => HttpResponse.error()));
    expect(await isReadOnly()).toBe(false);
  });

  it("maps unknown errors to the generic message", () => {
    expect(errorMessageKey(new Error("boom"))).toBe("errors.generic");
    expect(errorMessageKey(new ApiError(418, "teapot", "x"))).toBe("errors.generic");
  });
});
