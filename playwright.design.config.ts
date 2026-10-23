import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "**/design-system.spec.ts",
  timeout: 60_000,
});
