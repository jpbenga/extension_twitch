import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

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
console.log(`Régie sur le réseau local : ${origin.origin}`);
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
    env: {
      ...process.env,
      PUBLIC_ORIGIN: origin.origin,
      WEB_HOST: origin.hostname,
      PORT: origin.port || "80",
    },
  },
);
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("error", () => {
  console.error("Impossible de lancer npm.");
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 0 : 1);
});
