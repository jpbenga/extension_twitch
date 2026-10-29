import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { projectRoot } from "./twitch-environment.mjs";
const dir = resolve(projectRoot, "apps/twitch/dist"),
  zip = resolve(projectRoot, ".data/twitch/hosted-test.zip");
await mkdir(resolve(projectRoot, ".data/twitch"), { recursive: true });
await rm(zip, { force: true });
const r = spawnSync(
  "zip",
  [
    "-q",
    zip,
    "index.html",
    "panel.html",
    "mobile.html",
    "video_overlay.html",
    "config.html",
    "live_config.html",
    "viewer.js",
    "viewer.css",
    "config.js",
    "config.css",
    "home/spacegrotesk.ttf",
    "home/dmsans.ttf",
  ],
  {
    cwd: dir,
    stdio: "inherit",
  },
);
if (r.status !== 0) {
  console.error("Installez l’outil zip pour créer l’archive Hosted Test.");
  process.exit(1);
}
console.log(
  "Archive de test créée : .data/twitch/hosted-test.zip. Aucun upload, Hosted Test, Review ou Release déclenché.",
);
