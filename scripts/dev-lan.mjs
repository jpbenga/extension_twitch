import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { localQaUrls } from "./local-qa-urls.mjs";

const privateIpv4 = (host) =>
  /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) &&
  /^\d+\.\d+\.\d+\.\d+$/.test(host);
const addresses = Object.values(networkInterfaces())
  .flat()
  .filter(
    (entry) =>
      entry &&
      !entry.internal &&
      entry.family === "IPv4" &&
      privateIpv4(entry.address),
  )
  .map((entry) => entry.address);
if (!process.env.PUBLIC_ORIGIN && addresses.length === 0) {
  console.error(
    "Aucune adresse IPv4 privée trouvée. Connectez cet ordinateur au même réseau Wi-Fi que l’iPhone, ou utilisez un hébergement HTTPS protégé.",
  );
  process.exit(1);
}
const origin = new URL(
  process.env.PUBLIC_ORIGIN ??
    `http://${addresses[0]}:${process.env.PORT ?? "3000"}`,
);
if (
  origin.protocol !== "http:" ||
  !privateIpv4(origin.hostname) ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash ||
  !addresses.includes(origin.hostname)
) {
  console.error(
    "dev:lan exige une adresse HTTP privée de cet ordinateur, sans chemin ni identifiants. Pour le cloud, consultez docs/TEST-IPHONE.md.",
  );
  process.exit(1);
}
const webPort = Number(origin.port || 80),
  serverPort = Number(process.env.SERVER_PORT ?? 4000);
if (
  ![webPort, serverPort].every(
    (p) => Number.isInteger(p) && p >= 1024 && p <= 65535,
  ) ||
  webPort === serverPort
) {
  console.error(
    "PORT et SERVER_PORT doivent être deux ports distincts entre 1024 et 65535.",
  );
  process.exit(1);
}
try {
  for (const [port, host] of [
    [webPort, "0.0.0.0"],
    [serverPort, "127.0.0.1"],
  ])
    await new Promise((resolve, reject) => {
      const s = createServer();
      s.once("error", reject);
      s.listen(port, host, () => s.close(resolve));
    });
} catch {
  console.error(
    "Un port est déjà occupé. Arrêtez l’ancien serveur avec Ctrl+C. Aucun processus existant n’a été arrêté.",
  );
  process.exit(1);
}
console.log(localQaUrls(origin.origin));
console.log(
  "Ordinateur et iPhone sur le même réseau de confiance. Ne pas rediriger ce port sur Internet.",
);
if (addresses.length > 1)
  console.log(
    "Plusieurs interfaces privées détectées. Si nécessaire, relancez avec PUBLIC_ORIGIN=http://ADRESSE_WIFI:3000.",
  );
const child = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "dev"],
  {
    stdio: "inherit",
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      PUBLIC_ORIGIN: origin.origin,
      WEB_HOST: "0.0.0.0",
      SERVER_HOST: "127.0.0.1",
      LOCAL_QA_LOOPBACK_ORIGINS: "1",
      SERVER_PORT: String(serverPort),
      SERVER_ORIGIN: `http://127.0.0.1:${serverPort}`,
      PORT: origin.port || "80",
    },
  },
);
let ending = false;
function shutdown() {
  if (ending) return;
  ending = true;
  if (!child.pid) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
child.on("error", () => {
  console.error("Impossible de lancer npm.");
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = ending ? 0 : (code ?? (signal === "SIGINT" ? 0 : 1));
});
