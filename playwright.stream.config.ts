import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "**/stream-preview.spec.ts",
  timeout: 90000,
});
