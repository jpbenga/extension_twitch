import type { PublicSessionView } from "@extension-twitch/contracts/sessions";
/** Explicit pre-session placeholders, no invented gameplay or event. Same renderer. */
export function layoutPreparationPreview(count: number): PublicSessionView {
  return {
    audience: "public",
    sessionId: "00000000-0000-4000-8000-000000000000",
    title: "Undercover · aperçu de préparation",
    hostName: "Game Master",
    gameId: "undercover",
    phase: "lobby",
    version: 1,
    admissionOpen: true,
    events: [],
    participants: Array.from(
      { length: Math.max(3, Math.min(12, Math.trunc(count) || 3)) },
      (_, i) => ({
        id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        name: `Joueur ${i + 1}`,
        ready: false,
        connected: false,
      }),
    ),
  };
}
