"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  GameDefinition,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import { counterRecipeFor } from "@extension-twitch/contracts/creator";
import { useStudio } from "../components/creator-context";
import { requestMessage } from "./session-client";
import { prepareLab, saveLab, type CreatorLab } from "./creator-lab";
export function useCreatorLaunch() {
  const studio = useStudio(),
    router = useRouter();
  const [launching, setLaunching] = useState(false),
    [failure, setFailure] = useState("");
  const flight = useRef(false);
  async function launch(
    gameId: string,
    version: string,
    definition: GameDefinition,
    mode: "quick" | "invite" = "quick",
    returnTo = `/creator/games/${gameId}`,
    configuration: Record<string, Scalar> = {},
    demoPlayers?: number,
  ) {
    if (flight.current) return;
    flight.current = true;
    setLaunching(true);
    setFailure("");
    try {
      const access = await studio.prepare(gameId, version);
      if (!access) return;
      const template = studio.view?.catalog.find(
        (g) => g.release.definition.id === "collective-pulse",
      )?.release.definition;
      const m = definition.mechanics,
        deal = m?.deals[0];
      const minority = deal
        ? Number(
            configuration[deal.minorityCountConfiguration] ??
              definition.configuration.find(
                (c) => c.id === deal.minorityCountConfiguration,
              )?.value.initial ??
              0,
          )
        : 0;
      const lab: CreatorLab = {
        ...access,
        gameId,
        returnTo,
        mode,
        ...(m
          ? {
              demoPlayers:
                demoPlayers ??
                Math.min(
                  m.maxPlayers,
                  Math.max(4, m.minPlayers, minority * 2 + 1),
                ),
            }
          : {}),
        configuration,
        players: [],
        ready: false,
        initialPhase: definition.initialPhase,
        started: false,
        ...(template && counterRecipeFor(definition, template)
          ? { startAction: "open" }
          : {}),
      };
      saveLab(lab);
      try {
        await prepareLab(lab);
      } catch {
        /* The lab resumes the exact pending commands, with their receipts. */
      }
      router.push(`/creator/lab/${lab.sessionId}`);
    } catch (e) {
      setFailure(
        requestMessage(
          e,
          "Le test n’a pas démarré. Vérifiez la connexion et l’espace disponible sur cet appareil, puis réessayez. Votre jeu est conservé.",
        ),
      );
    } finally {
      flight.current = false;
      setLaunching(false);
    }
  }
  return { launch, launching, failure };
}
