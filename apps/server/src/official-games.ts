import { officialSessionSchema } from "@extension-twitch/contracts/official-games";
import { undercoverDefinition } from "@extension-twitch/game-undercover/definition";
import type { z } from "zod";
import type { SessionService } from "./session-service.js";

/** Only trusted server definitions enter new product sessions. */
export function prepareOfficialSession(
  service: SessionService,
  token: string,
  input: z.infer<typeof officialSessionSchema>,
) {
  return service.create(
    token,
    {
      requestId: input.requestId,
      title: "Undercover",
      hostName: "Game Master",
      gameId: "undercover",
    },
    {
      definition: undercoverDefinition,
      assets: [],
      configuration: input.settings,
      ...(input.overlayLayout ? { overlayLayout: input.overlayLayout } : {}),
      ...(input.broadcastTheme ? { broadcastTheme: input.broadcastTheme } : {}),
    },
  );
}
