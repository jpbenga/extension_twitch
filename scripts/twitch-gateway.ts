import { createServer, type ServerOptions } from "node:https";
import { request as httpRequest } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

const uuid = "[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}";
const publicPath = new RegExp(
  `^/api/server/sessions/${uuid}/public(?:/events)?$`,
  "i",
);
const mediaPath = new RegExp(
  `^/api/server/sessions/${uuid}/media/${uuid}$`,
  "i",
);
export function allowedPublicPath(path: string, query: string) {
  return (
    (publicPath.test(path) && !query) ||
    (mediaPath.test(path) && (!query || /^\?v=[a-f0-9]{12}$/.test(query)))
  );
}
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ...["panel", "mobile", "video_overlay", "config", "live_config"].map((x) => [
    `/${x}.html`,
    [`${x}.html`, "text/html; charset=utf-8"],
  ]),
  ...["viewer", "config"].flatMap((x) => [
    [`/${x}.js`, [`${x}.js`, "text/javascript; charset=utf-8"]],
    [`/${x}.css`, [`${x}.css`, "text/css; charset=utf-8"]],
  ]),
  ...["spacegrotesk", "dmsans"].map((x) => [
    `/home/${x}.ttf`,
    [`home/${x}.ttf`, "font/ttf"],
  ]),
] as [string, [string, string]][]);
export function createTwitchGateway(options: {
  tls: ServerOptions;
  upstream: string;
  dist: string;
  extensionClientId?: string;
}) {
  const upstream = new URL(options.upstream);
  if (
    upstream.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(upstream.hostname) ||
    upstream.username ||
    upstream.password ||
    upstream.pathname !== "/" ||
    upstream.search ||
    upstream.hash
  )
    throw new Error("Twitch public gateway requires a loopback HTTP upstream.");
  if (
    options.extensionClientId &&
    !/^[a-z0-9]{1,64}$/i.test(options.extensionClientId)
  )
    throw new Error("Invalid Twitch extension Client ID.");
  const hostedOrigin = options.extensionClientId
    ? new URL(`https://${options.extensionClientId}.ext-twitch.tv`).origin
    : null;
  const server = createServer(options.tls, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const reject = (status: number) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: status === 403 ? "ORIGIN_DENIED" : "NOT_FOUND",
        }),
      );
    };
    const url = new URL(req.url ?? "/", "https://internal");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method ?? "")) {
      reject(405);
      return;
    }
    if (allowedPublicPath(url.pathname, url.search)) {
      const origin = req.headers.origin;
      const port = (server.address() as AddressInfo | null)?.port;
      const local = [
        `https://localhost:${port}`,
        `https://127.0.0.1:${port}`,
        `https://${req.socket.localAddress}:${port}`,
      ];
      if (origin && origin !== hostedOrigin && !local.includes(origin)) {
        reject(403);
        return;
      }
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      if (req.method === "OPTIONS") {
        // No credentialed requests or arbitrary authorization header are supported.
        if (
          req.headers["access-control-request-headers"] ||
          !["GET", "HEAD"].includes(
            String(req.headers["access-control-request-method"]),
          )
        ) {
          reject(403);
          return;
        }
        if (req.headers["access-control-request-private-network"] === "true")
          res.setHeader("Access-Control-Allow-Private-Network", "true");
        res.writeHead(204, { "Access-Control-Allow-Methods": "GET, HEAD" });
        res.end();
        return;
      }
      const target = new URL(
        url.pathname.replace(/^\/api\/server/, "") + url.search,
        upstream,
      );
      // Deliberately never forward incoming Authorization, Cookie or an arbitrary destination.
      const source = httpRequest(
        target,
        {
          method: req.method,
          headers: {
            Accept: mediaPath.test(url.pathname)
              ? "image/png"
              : "application/json, text/event-stream",
          },
        },
        (response) => {
          res.writeHead(response.statusCode ?? 502, {
            "Content-Type":
              response.headers["content-type"] ?? "application/json",
            "Cache-Control": "no-store, no-transform",
            "X-Accel-Buffering": "no",
          });
          response.pipe(res);
          response.on("error", () => res.destroy());
        },
      );
      source.on("error", () => {
        if (res.headersSent) res.destroy();
        else {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "PUBLIC_SERVER_UNAVAILABLE" }));
        }
      });
      res.on("close", () => source.destroy());
      source.end();
      return;
    }
    const file = files.get(url.pathname);
    // Twitch appends its runtime context (anchor, language, mode, state, …)
    // to extension iframe URLs. Static asset selection remains pathname-only;
    // the query is intentionally ignored rather than forwarded anywhere.
    if (!file || req.method === "OPTIONS") {
      reject(404);
      return;
    }
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self' https://extension-files.twitch.tv; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'self' https://twitch.tv https://*.twitch.tv https://*.ext-twitch.tv; base-uri 'none'; object-src 'none'; form-action 'none'",
    );
    const path = join(options.dist, file[0]);
    void stat(path)
      .then((info) => {
        res.writeHead(200, {
          "Content-Type": file[1],
          "Content-Length": info.size,
        });
        if (req.method === "HEAD") res.end();
        else
          createReadStream(path)
            .on("error", () => res.destroy())
            .pipe(res);
      })
      .catch(() => reject(404));
  });
  return server;
}
