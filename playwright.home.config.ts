import { defineConfig } from "@playwright/test";
import base from "./playwright.ux.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/home.spec.ts",
  timeout: 90_000,
});
