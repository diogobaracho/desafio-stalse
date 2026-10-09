import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    env: { NEXT_PUBLIC_API_BASE_URL: "http://api.test" },
    css: { modules: { classNameStrategy: "non-scoped" } },
    coverage: {
      provider: "v8",
      include: ["components/**", "lib/**", "i18n/config.ts"],
      reporter: ["text", "html", "lcov"],
      // Pages under app/ are thin server components covered by the Playwright E2E suite.
      thresholds: { lines: 75, statements: 75, functions: 75, branches: 70 },
    },
  },
});
