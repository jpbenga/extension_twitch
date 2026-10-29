import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/twitch-local.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  webServer: {
    ...base.webServer,
    command: "npm run twitch:build && npm run start",
  },
});
