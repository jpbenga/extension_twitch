import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { networkInterfaces } from "node:os";
export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export function loadTwitchEnvironment() {
  const file = resolve(projectRoot, ".env.twitch.local");
  if (existsSync(file)) process.loadEnvFile(file);
}
export function privateAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter(
      (x) =>
        x &&
        x.family === "IPv4" &&
        !x.internal &&
        /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(x.address),
    )
    .map((x) => x.address);
}
export const tlsDirectory = resolve(projectRoot, ".data/twitch/tls");
