import { defineConfig } from "@playwright/test";
import base from "./playwright.ux.config.js";
export default defineConfig({
  ...base,
  testMatch: "**/lobby-player.spec.ts",
  timeout: 180_000,
  projects: base.projects!.map((p) => ({
    ...p,
    use: {
      ...p.use,
      deviceScaleFactor: 2,
      ...(p.name === "desktop"
        ? { viewport: { width: 1280, height: 1024 } }
        : p.name === "mobile"
          ? { viewport: { width: 390, height: 884 } }
          : {}),
    },
  })),
});
