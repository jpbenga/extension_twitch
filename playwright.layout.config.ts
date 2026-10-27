import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "**/undercover-layout.spec.ts",
  timeout: 90000,
});
