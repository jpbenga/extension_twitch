import type { GameDescriptor } from "@extension-twitch/contracts";

export const spy = {
  id: "spy",
  title: "Qui est l’espion ?",
  rulesStatus: "pending-definition",
} as const satisfies GameDescriptor;
