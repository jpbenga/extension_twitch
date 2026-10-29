import { spawnSync } from "node:child_process";
import { mkdir, chmod } from "node:fs/promises";
import { resolve } from "node:path";
import { privateAddresses, tlsDirectory } from "./twitch-environment.mjs";
if (spawnSync("mkcert", ["-version"], { stdio: "ignore" }).status !== 0) {
  console.error(
    "Installez mkcert une seule fois : brew install mkcert. Puis relancez npm run twitch:cert. Aucun contrôle TLS ne sera désactivé.",
  );
  process.exit(1);
}
await mkdir(tlsDirectory, { recursive: true, mode: 0o700 });
// mkcert asks the local OS for permission to trust its development CA; no credential is read here.
if (spawnSync("mkcert", ["-install"], { stdio: "inherit" }).status !== 0)
  process.exit(1);
if (
  spawnSync(
    "mkcert",
    [
      "-cert-file",
      resolve(tlsDirectory, "localhost.pem"),
      "-key-file",
      resolve(tlsDirectory, "localhost-key.pem"),
      "localhost",
      "127.0.0.1",
      ...privateAddresses(),
    ],
    { stdio: "inherit" },
  ).status !== 0
)
  process.exit(1);
await chmod(resolve(tlsDirectory, "localhost-key.pem"), 0o600);
console.log(
  "Certificat de développement prêt. Relancez npm run twitch:local. Les clés restent ignorées par Git.",
);
