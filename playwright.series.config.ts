import { defineConfig } from "@playwright/test";
import base from "./playwright.ux.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/undercover-series.spec.ts",
  workers: 1,
  use: { ...base.use, actionTimeout: 10000 },
  timeout: 120_000,
});
