import { redirect } from "next/navigation";
export const legacyStudioEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.LEGACY_STUDIO_ENABLED === "1";
export function requireLegacyStudio() {
  if (!legacyStudioEnabled()) redirect("/play");
}
