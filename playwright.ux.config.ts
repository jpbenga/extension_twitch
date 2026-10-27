import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "**/ux-experiences.spec.ts",
  timeout: 90000,
  projects: [
    ...base.projects!,
    {
      name: "small",
      use: {
        viewport: { width: 320, height: 568 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
