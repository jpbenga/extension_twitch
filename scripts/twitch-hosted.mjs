import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { loadTwitchEnvironment, projectRoot } from "./twitch-environment.mjs";

if (process.argv.includes("--help")) {
  console.log(`Usage: npm run twitch:hosted

Lance Twitch Local Test et un tunnel HTTPS Cloudflare temporaire dans un seul terminal.
Le tunnel expose uniquement la passerelle publique en lecture seule. Ctrl+C arrête les deux processus.

Variables facultatives :
  CLOUDFLARED_BIN       chemin explicite vers cloudflared
  TWITCH_LOCAL_HOST     localhost ou adresse privée du Mac
  TWITCH_LOCAL_PORT     port HTTPS local, 8443 par défaut`);
  process.exit(0);
}

loadTwitchEnvironment();

function executable(path) {
  if (!path || !existsSync(path)) return false;
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function cloudflaredCommand() {
  const explicit = process.env.CLOUDFLARED_BIN;
  if (explicit) {
    const path = resolve(explicit);
    if (executable(path)) return path;
    throw new Error(`CLOUDFLARED_BIN n’est pas exécutable : ${path}`);
  }
  if (spawnSync("cloudflared", ["--version"], { stdio: "ignore" }).status === 0)
    return "cloudflared";
  for (const path of [
    join(homedir(), "bin/cloudflared"),
    "/opt/homebrew/bin/cloudflared",
    "/usr/local/bin/cloudflared",
  ])
    if (executable(path)) return path;
  throw new Error(
    "cloudflared est introuvable. Installez le binaire dans ~/bin/cloudflared ou définissez CLOUDFLARED_BIN.",
  );
}

let cloudflared;
try {
  cloudflared = cloudflaredCommand();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const host = process.env.TWITCH_LOCAL_HOST ?? "localhost";
const port = Number(process.env.TWITCH_LOCAL_PORT ?? 8443);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error("TWITCH_LOCAL_PORT doit être un port de 1024 à 65535.");
  process.exit(1);
}

const children = [];
let ending = false;
function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}
function shutdown(code = 0) {
  if (ending) return;
  ending = true;
  for (const child of children) stopChild(child);
  process.exitCode = code;
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => shutdown(0));

function launch(command, args, label) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    detached: true,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });
  children.push(child);
  child.once("error", (error) => {
    console.error(`[${label}] ${error.message}`);
    shutdown(1);
  });
  child.once("exit", (code, signal) => {
    if (!ending) {
      console.error(
        `[${label}] arrêt inattendu (${signal ?? `code ${code ?? 1}`}).`,
      );
      shutdown(code ?? 1);
    }
  });
  return child;
}

console.log(
  `Twitch Hosted Test local — démarrage de l’application et du tunnel HTTPS\nOrigine locale du tunnel : https://${host}:${port}\n`,
);

const local = launch("npm", ["run", "twitch:local"], "local");
local.stdout.pipe(process.stdout);
local.stderr.pipe(process.stderr);

const tunnel = launch(
  cloudflared,
  ["tunnel", "--url", `https://${host}:${port}`, "--no-tls-verify"],
  "cloudflared",
);

let announced = false;
let tunnelOutput = "";
function inspectTunnel(chunk) {
  const text = chunk.toString();
  process.stderr.write(text);
  tunnelOutput = `${tunnelOutput}${text}`.slice(-8192);
  const match = tunnelOutput.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (!match || announced) return;
  announced = true;
  const url = match[0];
  void mkdir(resolve(projectRoot, ".data/twitch"), { recursive: true })
    .then(() =>
      writeFile(
        resolve(projectRoot, ".data/twitch/current-tunnel-url.txt"),
        `${url}\n`,
        "utf8",
      ),
    )
    .catch(() => {});
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║ TWITCH HOSTED TEST — URL TEMPORAIRE PRÊTE                           ║
╚══════════════════════════════════════════════════════════════════════╝

${url}

1. Vérifiez cette URL dans Chrome : la page « Twitch Local Test » doit apparaître.
2. Dans les capacités Twitch, remplacez l’ancienne URL trycloudflare dans
   Images, Multimédia et Récupération d’URL, puis enregistrez.
3. Dans la configuration de l’extension, utilisez cette URL comme
   « Serveur public HTTPS » et conservez le lien public de la partie.

Cette URL change après chaque redémarrage du tunnel. Gardez ce terminal ouvert.
Le fichier .data/twitch/current-tunnel-url.txt contient aussi l’adresse courante.
Ctrl+C arrête l’application locale et le tunnel.
`);
}
tunnel.stdout.on("data", inspectTunnel);
tunnel.stderr.on("data", inspectTunnel);
