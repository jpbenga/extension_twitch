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
  // Keep the user-authored repository instructions as the single source.
  agentRules: false,
  allowedDevOrigins: [
    "127.0.0.1",
    ...(process.env.DEV_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  ],
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
