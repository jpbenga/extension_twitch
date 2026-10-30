type LocalTargetAddressSpace = "local" | "private";

function targetAddressSpace(origin: string): LocalTargetAddressSpace | null {
  if (!origin) return null;
  let hostname: string;
  try {
    hostname = new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  )
    return "local";
  const octets = hostname.split(".").map(Number);
  if (
    octets.length === 4 &&
    octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    const first = octets[0]!;
    const second = octets[1]!;
    if (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    )
      return "private";
  }
  return null;
}

/** Marks an intentional read-only local relay request for modern Chromium LNA. */
export function localNetworkRequest(
  origin: string,
  init: RequestInit,
): RequestInit {
  const target = targetAddressSpace(origin);
  if (!target) return init;
  return { ...init, targetAddressSpace: target } as RequestInit;
}
