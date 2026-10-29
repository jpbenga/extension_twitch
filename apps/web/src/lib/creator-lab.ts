import { z } from "zod";
import { scalarRecordSchema } from "@extension-twitch/contracts/game-definition";
import {
  gmSessionSchema,
  playerSessionSchema,
  sessionAccessSchema,
  accessTokenSchema,
  type LobbyAction,
} from "@extension-twitch/contracts/sessions";
import {
  accessKey,
  RequestFailure,
  commandId,
  post,
  randomToken,
  readResponse,
} from "./session-client.ts";
const player = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  token: accessTokenSchema,
  requestId: z.uuid(),
});
export const labSchema = z.strictObject({
  sessionId: z.uuid(),
  token: accessTokenSchema,
  gameId: z.union([z.uuid(), z.literal("undercover")]),
  returnTo: z.string().regex(/^\/(?:creator|play)(?:\/[^#?]*)?$/),
  mode: z.enum(["quick", "invite"]),
  players: z.array(player).max(12),
  demoPlayers: z.number().int().min(2).max(12).optional(),
  configuration: scalarRecordSchema.optional(),
  ready: z.boolean(),
  startAction: z.string().optional(),
  initialPhase: z.string(),
  started: z.boolean(),
  restartStage: z.enum(["reset", "open"]).optional(),
  pending: z
    .object({
      commandId: z.uuid(),
      expectedVersion: z.number(),
      command: z.unknown(),
    })
    .optional(),
});
export type CreatorLab = z.infer<typeof labSchema>;
export const labKey = (id: string) => `xt:creator:lab:${id}`;
export function saveLab(lab: CreatorLab) {
  sessionStorage.setItem(labKey(lab.sessionId), JSON.stringify(lab));
  sessionStorage.setItem("xt:recent-gm-session", lab.sessionId);
  sessionStorage.setItem(accessKey(lab.sessionId, "gm"), lab.token);
  for (const p of lab.players)
    if (p.id)
      sessionStorage.setItem(
        accessKey(lab.sessionId, `player:${p.id}`),
        p.token,
      );
}
export function readLab(id: string) {
  const raw = sessionStorage.getItem(labKey(id));
  return raw ? labSchema.parse(JSON.parse(raw) as unknown) : null;
}
export async function labGm(lab: CreatorLab) {
  return gmSessionSchema.parse(
    await readResponse(
      await fetch(`/api/server/sessions/${lab.sessionId}/private`, {
        headers: { Authorization: `Bearer ${lab.token}` },
        cache: "no-store",
      }),
    ),
  );
}
export async function labCommand(
  lab: CreatorLab,
  action: LobbyAction,
  applied?: () => void,
) {
  const gm = await labGm(lab);
  if (!lab.pending) {
    lab.pending = {
      commandId: commandId(),
      expectedVersion: gm.version,
      command: action,
    };
    saveLab(lab);
  }
  try {
    const result = gmSessionSchema.parse(
      await post(`/sessions/${lab.sessionId}/commands`, lab.token, lab.pending),
    );
    delete lab.pending;
    applied?.();
    saveLab(lab);
    return result;
  } catch (error) {
    // A definite refusal may be corrected with a fresh command. An uncertain
    // network/server outcome must retain the original receipt identifier.
    if (error instanceof RequestFailure && error.status < 500) {
      delete lab.pending;
      saveLab(lab);
    }
    throw error;
  }
}
export async function prepareLab(lab: CreatorLab) {
  saveLab(lab);
  if (lab.mode === "quick") {
    let gm = await labGm(lab);
    if (!gm.game) {
      if (!lab.players.length) {
        lab.players = Array.from(
          { length: lab.demoPlayers ?? 2 },
          (_, i) => `Joueur démo ${i + 1}`,
        ).map((name) => ({
          name,
          token: randomToken(),
          requestId: commandId(),
        }));
        saveLab(lab);
      }
      for (const p of lab.players) {
        if (p.id) continue;
        const joined = sessionAccessSchema.parse(
          await post(`/invitations/${gm.invitationCode}/join`, p.token, {
            requestId: p.requestId,
            name: p.name,
          }),
        );
        if (!joined.participantId)
          throw new Error(
            "Le joueur n’a pas pu rejoindre. Reprenez la préparation.",
          );
        p.id = joined.participantId;
        saveLab(lab);
      }
    }
    gm = await labGm(lab);
    if (!gm.game || lab.pending)
      gm = await labCommand(lab, {
        type: "game.use-prepared",
        configuration: lab.configuration ?? {},
      });
    if (lab.startAction && !lab.started && gm.game) {
      if (gm.game.phase.id === lab.initialPhase || lab.pending)
        gm = await labCommand(lab, {
          type: "game.action",
          runId: gm.game.runId,
          actionId: lab.startAction,
          parameters: {},
        });
      lab.started = true;
    }
    lab.ready = true;
    saveLab(lab);
  }
  return lab;
}
export async function restartLab(lab: CreatorLab) {
  let gm = await labGm(lab);
  if (!gm.game) throw new Error("Préparez la partie avant de recommencer.");
  if (!lab.restartStage) {
    lab.restartStage = "reset";
    saveLab(lab);
  }
  if (lab.restartStage === "reset") {
    gm = await labCommand(
      lab,
      { type: "game.restart", runId: gm.game.runId },
      () => {
        lab.restartStage = "open";
      },
    );
  }
  if (
    lab.startAction &&
    gm.game &&
    (gm.game.phase.id === lab.initialPhase || lab.pending)
  ) {
    await labCommand(
      lab,
      {
        type: "game.action",
        runId: gm.game.runId,
        actionId: lab.startAction,
        parameters: {},
      },
      () => {
        delete lab.restartStage;
      },
    );
  } else {
    delete lab.restartStage;
    saveLab(lab);
  }
  return lab;
}

export async function probePlayerAccess(lab: CreatorLab) {
  const player = lab.players[0];
  if (!player?.id)
    throw new Error(
      "Préparez d’abord un test avec des joueurs de démonstration.",
    );
  const view = playerSessionSchema.parse(
    await readResponse(
      await fetch(`/api/server/sessions/${lab.sessionId}/private`, {
        headers: { Authorization: `Bearer ${player.token}` },
        cache: "no-store",
      }),
    ),
  );
  if (view.participantId !== player.id)
    throw new RequestFailure("ACCESS_DENIED", 403);
  try {
    await post(`/sessions/${lab.sessionId}/commands`, player.token, {
      commandId: commandId(),
      expectedVersion: view.version,
      command: { type: "session.rename", title: "Action de gestion interdite" },
    });
    return false;
  } catch (error) {
    if (error instanceof RequestFailure && error.status === 403) return true;
    throw error;
  }
}
