import type { GameDescriptor } from "@extension-twitch/contracts";

export const undercover = {
  id: "undercover",
  title: "Undercover",
  rulesStatus: "demo-playable",
} as const satisfies GameDescriptor;
