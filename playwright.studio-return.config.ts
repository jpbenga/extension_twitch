import { defineConfig } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const node = JSON.stringify(process.execPath);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/studio-return.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 180_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1920, height: 1080 },
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: {
    command: `${node} node_modules/concurrently/dist/bin/index.js --kill-others --names server,web "${node} apps/server/dist/index.js" "${node} node_modules/next/dist/bin/next start apps/web --hostname 127.0.0.1 --port 3100"`,
    url: "http://127.0.0.1:3100",
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: join(tmpdir(), `xt-studio-return-${randomUUID()}.sqlite`),
      PUBLIC_ORIGIN: "http://127.0.0.1:3100",
      SERVER_HOST: "127.0.0.1",
      SERVER_PORT: "4100",
      SERVER_ORIGIN: "http://127.0.0.1:4100",
      WEB_HOST: "127.0.0.1",
    },
  },
});
