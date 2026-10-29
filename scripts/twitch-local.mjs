import { spawn } from "node:child_process";
import { localQaUrls } from "./local-qa-urls.mjs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "node:net";
import { X509Certificate } from "node:crypto";
import { buildTwitch, twitchDist } from "./twitch-build.mjs";
import { createTwitchGateway } from "./twitch-gateway.ts";
import {
  loadTwitchEnvironment,
  privateAddresses,
  tlsDirectory,
  projectRoot,
} from "./twitch-environment.mjs";
loadTwitchEnvironment();
const host = process.env.TWITCH_LOCAL_HOST ?? "localhost",
  port = Number(process.env.TWITCH_LOCAL_PORT ?? 8443);
const addresses = privateAddresses();
if (
  !["localhost", "127.0.0.1", ...addresses].includes(host) ||
  !Number.isInteger(port) ||
  port < 1024 ||
  port > 65535
) {
  console.error(
    "Utilisez localhost ou une adresse IPv4 privée de cet ordinateur pour TWITCH_LOCAL_HOST, et un port de 1024 à 65535.",
  );
  process.exit(1);
}
let cert, key;
try {
  cert = await readFile(resolve(tlsDirectory, "localhost.pem"));
  key = await readFile(resolve(tlsDirectory, "localhost-key.pem"));
  const x = new X509Certificate(cert);
  if (
    !(host === "localhost" ? x.checkHost(host) : x.checkIP(host)) ||
    Date.parse(x.validTo) <= Date.now()
  )
    throw new Error("Certificate mismatch");
} catch {
  console.error(
    "Certificat local absent, expiré ou non adapté à cette adresse. Exécutez npm run twitch:cert, puis relancez. Voir docs/TWITCH-LOCAL-TEST.md.",
  );
  process.exit(1);
}
const webPort = Number(process.env.PORT ?? 3000),
  serverPort = Number(process.env.SERVER_PORT ?? 4000);
const gmHost = addresses.includes(host) ? host : (addresses[0] ?? "127.0.0.1");
if (
  ![webPort, serverPort].every(
    (p) => Number.isInteger(p) && p >= 1024 && p <= 65535,
  ) ||
  new Set([port, webPort, serverPort]).size !== 3
) {
  console.error(
    "PORT, SERVER_PORT et TWITCH_LOCAL_PORT doivent être trois ports distincts, de 1024 à 65535.",
  );
  process.exit(1);
}
async function available(p, h) {
  await new Promise((resolve, reject) => {
    const s = createServer();
    s.once("error", reject);
    s.listen(p, h, () => s.close(resolve));
  });
}
try {
  await available(port, host);
  await available(webPort, "0.0.0.0");
  await available(serverPort, "127.0.0.1");
} catch {
  console.error(
    "Un port est déjà occupé. Arrêtez l’ancien npm run dev:lan, ou définissez PORT, SERVER_PORT et TWITCH_LOCAL_PORT. Aucun ancien processus n’a été arrêté.",
  );
  process.exit(1);
}
const children = [];
let gateway,
  buildContext,
  ending = false;
async function shutdown(code = 0) {
  if (ending) return;
  ending = true;
  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null) continue;
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
  gateway?.closeAllConnections();
  gateway?.close();
  await buildContext?.dispose();
  process.exitCode = code;
}
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
try {
  // Package compilation precedes both esbuild resolution and Next startup.
  await new Promise((resolve, reject) => {
    const p = spawn("npm", ["run", "build:packages"], {
      cwd: projectRoot,
      stdio: "inherit",
      detached: true,
    });
    children.push(p);
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Package build failed")),
    );
  });
  buildContext = await buildTwitch(true);
  gateway = createTwitchGateway({
    tls: { cert, key },
    dist: twitchDist,
    upstream: `http://127.0.0.1:${serverPort}`,
    ...(process.env.TWITCH_EXTENSION_CLIENT_ID
      ? { extensionClientId: process.env.TWITCH_EXTENSION_CLIENT_ID }
      : {}),
  });
  gateway.on("error", () => {
    console.error("Le serveur HTTPS Twitch n’a pas pu démarrer.");
    void shutdown(1);
  });
  await new Promise((resolve) => gateway.listen(port, host, resolve));
  const app = spawn("npm", ["run", "dev"], {
    cwd: projectRoot,
    stdio: "inherit",
    detached: true,
    env: {
      ...process.env,
      SERVER_HOST: "127.0.0.1",
      SERVER_PORT: String(serverPort),
      SERVER_ORIGIN: `http://127.0.0.1:${serverPort}`,
      WEB_HOST: "0.0.0.0",
      PORT: String(webPort),
      PUBLIC_ORIGIN: `http://${gmHost}:${webPort}`,
    },
  });
  children.push(app);
  app.on("error", () => void shutdown(1));
  app.on("exit", (code) => {
    if (!ending) void shutdown(code ?? 1);
  });
  console.log(
    localQaUrls(`http://${gmHost}:${webPort}`, `https://${host}:${port}`),
  );
  console.log(
    `\nTWITCH LOCAL TEST — aucun live émis\nTesting Base URI: https://${host}:${port}/\nPanel Viewer Path: panel.html\nMobile Path: mobile.html\nConfig Path: config.html\nLive Config Path: live_config.html (facultatif)\nVideo Overlay Path: video_overlay.html (test vidéo séparé)\nServeur public HTTPS à associer: https://${host}:${port}\nGM / préparation: http://${gmHost}:${webPort}/play/undercover\nJoueurs: liens d’invitation de la régie\n\nGardez ce terminal ouvert. Le bundle Twitch se reconstruit automatiquement ; rechargez l’extension dans Twitch après une modification. Pas de faux Helper hors Twitch.\n`,
  );
} catch {
  console.error(
    "Démarrage interrompu. Vérifiez la compilation et la configuration locale ; aucun accès Twitch n’a été créé.",
  );
  await shutdown(1);
}
