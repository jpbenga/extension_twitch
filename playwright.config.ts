import { defineConfig } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/official-games.spec.ts", "**/design-system.spec.ts"],
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "tablet",
      use: { viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    timeout: 60_000,
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: join(tmpdir(), `xt-e2e-${randomUUID()}.sqlite`),
      PUBLIC_ORIGIN: "http://127.0.0.1:3000",
      WEB_HOST: "127.0.0.1",
    },
  },
});
