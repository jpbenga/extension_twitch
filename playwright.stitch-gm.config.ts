import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/stitch-gm.spec.ts",
  timeout: 180_000,
  workers: 1,
});
