import type { NextConfig } from "next";

const serverOrigin = process.env.SERVER_ORIGIN ?? "http://127.0.0.1:4000";
const parsedOrigin = new URL(serverOrigin);
if (
  !["http:", "https:"].includes(parsedOrigin.protocol) ||
  parsedOrigin.username ||
  parsedOrigin.password ||
  parsedOrigin.pathname !== "/" ||
  parsedOrigin.search ||
  parsedOrigin.hash
) {
  throw new Error(
    "SERVER_ORIGIN must be an HTTP(S) origin without credentials, path, query or fragment.",
  );
}

const config: NextConfig = {
  poweredByHeader: false,
  // Invitation URLs are capabilities too; keep them out of development logs.
  logging: {
    incomingRequests: false,
    browserToTerminal: false,
    serverFunctions: false,
  },
  // Keep the user-authored repository instructions as the single source.
  agentRules: false,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    ...(process.env.PUBLIC_ORIGIN
      ? [new URL(process.env.PUBLIC_ORIGIN).hostname]
      : []),
    ...(process.env.DEV_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  // Keep API transport same-origin; no browser token or permissive CORS needed.
  async rewrites() {
    return [
      {
        source: "/api/server/:path*",
        destination: `${parsedOrigin.origin}/:path*`,
      },
    ];
  },
};

export default config;
