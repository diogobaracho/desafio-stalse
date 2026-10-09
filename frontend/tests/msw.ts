import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { API, metrics, tickets } from "./fixtures";

/** Default happy-path API. Individual tests override handlers with `server.use(...)`. */
export const handlers = [
  http.get(`${API}/tickets`, ({ request }) => {
    const search = new URL(request.url).searchParams.get("search")?.toLowerCase();
    const result = search
      ? tickets.filter((t) => `${t.customer_name} ${t.subject}`.toLowerCase().includes(search))
      : tickets;
    return HttpResponse.json(result);
  }),
  http.get(`${API}/metrics`, () => HttpResponse.json(metrics)),
  http.get(`${API}/health`, () =>
    HttpResponse.json({ status: "ok", service: "api", version: "0", environment: "test", read_only: false }),
  ),
];

export const server = setupServer(...handlers);

export function errorResponse(status: number, code: string, message = "error") {
  return HttpResponse.json({ error: { code, message, details: null } }, { status });
}
