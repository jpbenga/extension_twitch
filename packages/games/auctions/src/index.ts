import type { GameDescriptor } from "@extension-twitch/contracts";

export const auctions = {
  id: "auctions",
  title: "Enchères de personnages",
  rulesStatus: "pending-definition",
} as const satisfies GameDescriptor;

// Confirmed requirement for the future module: bids do not debit budgets.
// Debit only on confirmed allocation; cancellation semantics remain to define.
