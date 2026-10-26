import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: [
    "**/creator*.spec.ts",
    "**/configurable.spec.ts",
    "**/legacy-*.spec.ts",
  ],
  testIgnore: [],
  webServer: {
    ...base.webServer,
    command: "npm run dev",
    timeout: 90000,
    env: {
      ...(base.webServer as { env: Record<string, string> }).env,
      LEGACY_STUDIO_ENABLED: "1",
    },
  },
});
