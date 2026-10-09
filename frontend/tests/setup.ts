import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./msw";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// App Router hooks are not available outside Next; provide minimal fakes.
vi.mock("next/navigation", async () => {
  const { routerMock } = await import("./router");
  return {
    useRouter: () => routerMock,
    usePathname: () => "/tickets",
    notFound: vi.fn(),
    redirect: vi.fn(),
  };
});
