const privateIpv4 = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/;

/**
 * Local LAN tests need two origins: the shareable Wi-Fi origin for players and
 * localhost for Twitch embeds/browser capture on the production Mac.
 */
export function studioReturnOrigin(
  publicOrigin: string,
  browserOrigin?: string,
) {
  const canonical = new URL(publicOrigin);
  if (!browserOrigin) return canonical.origin;
  const browser = new URL(browserOrigin);
  const localLanTest =
    canonical.protocol === "http:" &&
    browser.protocol === "http:" &&
    canonical.hostname === browser.hostname &&
    privateIpv4.test(canonical.hostname);
  if (!localLanTest) return canonical.origin;
  return `http://localhost${canonical.port ? `:${canonical.port}` : ""}`;
}
