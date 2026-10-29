import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/undercover-tv-motion.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  projects: [
    { name: "desktop", use: { viewport: { width: 1920, height: 1080 } } },
  ],
});
