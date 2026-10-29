import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Each viewport gets fresh processes and a temporary SQLite database. This
// prevents automated bursts from sharing the real server's network rate bucket.
// Production limits and all HTTP/SSE authentication checks remain enabled.
const cli = fileURLToPath(
  new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
);
const args = process.argv.slice(2),
  requested = [];
const forwarded = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--project") requested.push(args[++i]);
  else if (arg.startsWith("--project=")) requested.push(arg.slice(10));
  else forwarded.push(arg);
}
const projects = requested.length
  ? requested
  : forwarded.some((a) =>
        /playwright\.(ux|home|players|prepare)\.config/.test(a),
      )
    ? ["desktop", "tablet", "mobile", "small"]
    : ["desktop", "tablet", "mobile"];
if (
  projects.some(
    (project) => !["desktop", "tablet", "mobile", "small"].includes(project),
  )
) {
  console.error("Projet attendu : desktop, tablet, mobile ou small.");
  process.exit(1);
}
// Keep each suite’s screenshots and traces independent, including the approved Stitch blocks.
const outputSuite =
  [
    "prepare",
    "players",
    "home",
    "ux",
    "layout",
    "games",
    "design",
    "legacy",
    "stream",
    "twitch",
    "tv",
    "series",
    "stitch-gm",
    "stitch-broadcast",
    "stitch-lab",
  ].find((name) =>
    forwarded.some((arg) => arg.includes(`playwright.${name}.config`)),
  ) ?? "e2e";
let active;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    active?.kill(signal);
    process.exitCode = 1;
  });
for (const project of projects) {
  if (process.exitCode) break;
  console.log(`\nVérification ${project} — serveur et base isolés`);
  const result = await new Promise((resolve) => {
    active = spawn(
      process.execPath,
      [
        cli,
        "test",
        `--project=${project}`,
        `--output=test-results/${outputSuite}/${project}`,
        ...forwarded,
      ],
      { stdio: "inherit" },
    );
    active.once("error", (error) => {
      console.error(error.message);
      resolve(1);
    });
    active.once("exit", (code) => resolve(code ?? 1));
  });
  active = undefined;
  if (result !== 0) process.exitCode = Number(result);
}
