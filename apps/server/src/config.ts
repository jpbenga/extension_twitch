import { z } from "zod";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { isIP } from "node:net";

const configurationSchema = z.object({
  SERVER_HOST: z.string().min(1).default("127.0.0.1"),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_PATH: z
    .string()
    .min(1)
    .default(
      fileURLToPath(new URL("../../../.data/sessions.sqlite", import.meta.url)),
    ),
  PUBLIC_ORIGIN: z
    .url()
    .default("http://127.0.0.1:3000")
    .refine((value) => {
      const url = new URL(value);
      const host = url.hostname;
      const privateHost =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".local") ||
        (isIP(host) === 4 &&
          /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host));
      return (
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash &&
        (url.protocol === "https:" || (url.protocol === "http:" && privateHost))
      );
    }, "PUBLIC_ORIGIN requires HTTPS, or a trusted local/private HTTP address without path or credentials"),
});

export function readConfiguration(environment: NodeJS.ProcessEnv) {
  const configuration = configurationSchema.parse(environment);
  return {
    host: configuration.SERVER_HOST,
    port: configuration.SERVER_PORT,
    databasePath: resolve(configuration.DATABASE_PATH),
    publicOrigin: new URL(configuration.PUBLIC_ORIGIN).origin,
  };
}
