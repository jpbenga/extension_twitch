import type { GameDescriptor } from "@extension-twitch/contracts";

export const undercover = {
  id: "undercover",
  title: "Undercover",
  rulesStatus: "pending-definition",
} as const satisfies GameDescriptor;
