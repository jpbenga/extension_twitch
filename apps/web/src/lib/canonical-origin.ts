const privateIpv4 = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/;
const loopback = new Set(["localhost", "127.0.0.1"]);
const studioRoute = /^\/sessions\/[^/]+\/studio(?:\/|$)/;

/** Keep the local Studio on localhost, but move every product workflow to LAN. */
export function canonicalApplicationUrl(
  publicOrigin: string,
  currentUrl: string,
) {
  const canonical = new URL(publicOrigin);
  const current = new URL(currentUrl);
  if (
    current.origin === canonical.origin ||
    studioRoute.test(current.pathname) ||
    canonical.protocol !== "http:" ||
    !privateIpv4.test(canonical.hostname) ||
    !loopback.has(current.hostname)
  )
    return "";
  return `${canonical.origin}${current.pathname}${current.search}${current.hash}`;
}
