import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/local-qa.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  use: { ...base.use, actionTimeout: 10000 },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
  ],
});
