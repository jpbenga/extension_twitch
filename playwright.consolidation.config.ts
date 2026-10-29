import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/undercover-consolidation.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 120000,
  use: { ...base.use, actionTimeout: 10000 },
});
