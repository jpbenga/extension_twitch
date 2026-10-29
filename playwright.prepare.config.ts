import { defineConfig } from "@playwright/test";
import base from "./playwright.ux.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/prepare-undercover.spec.ts",
  timeout: 180_000,
  workers: 1,
});
