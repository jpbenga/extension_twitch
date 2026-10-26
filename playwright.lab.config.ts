import { defineConfig } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

export default defineConfig({
  outputDir: "test-results/lab",
  testDir: "./tests/lab",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3100/lab",
    timeout: 60_000,
    reuseExistingServer: false,
    env: {
      LEGACY_STUDIO_ENABLED: "1",
      DATABASE_PATH: join(tmpdir(), `xt-lab-${randomUUID()}.sqlite`),
      PUBLIC_ORIGIN: "http://127.0.0.1:3100",
      PORT: "3100",
      SERVER_PORT: "4100",
      SERVER_ORIGIN: "http://127.0.0.1:4100",
      WEB_HOST: "127.0.0.1",
    },
  },
});
