import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/tv-undercover.spec.ts",
  workers: 1,
  use: { ...base.use, actionTimeout: 10000 },
  timeout: 180_000,
  projects: [
    { name: "desktop", use: { viewport: { width: 1920, height: 1080 } } },
  ],
});
