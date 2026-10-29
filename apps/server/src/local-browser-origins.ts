import { isIP } from "node:net";

/** Explicit opt-in from the local launchers, never active on a production server. */
export function localQaBrowserOrigins(
  publicOrigin: string,
  environment: NodeJS.ProcessEnv,
): string[] {
  if (
    environment.LOCAL_QA_LOOPBACK_ORIGINS !== "1" ||
    environment.NODE_ENV === "production" ||
    !["127.0.0.1", "localhost"].includes(environment.SERVER_HOST ?? "127.0.0.1")
  )
    return [];
  const url = new URL(publicOrigin);
  const local =
    url.hostname === "localhost" ||
    (isIP(url.hostname) === 4 &&
      /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname));
  if (url.protocol !== "http:" || !local) return [];
  return ["localhost", "127.0.0.1"].map(
    (host) => `http://${host}${url.port ? `:${url.port}` : ""}`,
  );
}
