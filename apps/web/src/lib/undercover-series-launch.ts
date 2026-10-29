import { z } from "zod";
import { undercoverSettingsSchema } from "@extension-twitch/contracts/official-games";
import { undercoverLayoutSchema } from "@extension-twitch/contracts/undercover-layout";
import { themeIdSchema } from "@extension-twitch/contracts/themes";
import {
  accessTokenSchema,
  sessionAccessSchema,
} from "@extension-twitch/contracts/sessions";
import { post, readResponse } from "./session-client";
import { prepareLab, saveLab, type CreatorLab } from "./creator-lab";
import {
  getSeriesImage,
  preparationName,
  validatedPreparation,
  preparationSchema,
  type UndercoverPreparation,
  type UndercoverSeries,
} from "./undercover-series";

export const seriesAttemptSchema = z.object({
  requestId: z.uuid(),
  token: accessTokenSchema,
  mode: z.enum(["invite", "quick"]),
  count: z.number().int().min(3).max(12),
  settings: undercoverSettingsSchema,
  overlayLayout: undercoverLayoutSchema.optional(),
  broadcastTheme: themeIdSchema.optional(),
  snapshot: preparationSchema.optional(),
  preparation: z
    .strictObject({
      id: z.uuid(),
      title: z.string().min(1).max(80),
      series: z.strictObject({
        id: z.uuid(),
        title: z.string().min(1).max(80),
        position: z.number().int().min(1),
        total: z.number().int().min(1),
      }),
    })
    .optional(),
});
export type SeriesAttempt = z.infer<typeof seriesAttemptSchema>;
export function makeSeriesAttempt(
  series: UndercoverSeries,
  p: UndercoverPreparation,
  index: number,
  token: string,
): SeriesAttempt {
  return {
    snapshot: structuredClone(p),
    requestId: crypto.randomUUID(),
    token,
    mode: "invite",
    count: p.count,
    settings: validatedPreparation(p),
    overlayLayout: p.overlayLayout,
    broadcastTheme: p.broadcastTheme,
    preparation: {
      id: p.id,
      title: preparationName(p).slice(0, 80),
      series: {
        id: series.id,
        title: series.title,
        position: index + 1,
        total: series.preparations.length,
      },
    },
  };
}
export async function createSeriesSession(
  attempt: SeriesAttempt,
): Promise<CreatorLab> {
  const { requestId, settings, overlayLayout, broadcastTheme, preparation } =
    attempt;
  const access = sessionAccessSchema.parse(
    await post("/official-games/undercover/sessions", attempt.token, {
      requestId,
      settings,
      ...(overlayLayout ? { overlayLayout } : {}),
      ...(broadcastTheme ? { broadcastTheme } : {}),
      ...(preparation ? { preparation } : {}),
    }),
  );
  const lab: CreatorLab = {
    sessionId: access.sessionId,
    token: attempt.token,
    gameId: "undercover",
    returnTo: "/play/undercover",
    mode: attempt.mode,
    demoPlayers: attempt.count,
    configuration: attempt.settings,
    players: [],
    ready: false,
    initialPhase: "preparation",
    started: false,
  };
  saveLab(lab);
  await prepareLab(lab).catch(() => {});
  return lab;
}
/** Only the selected current preparation is transmitted. Missing media never blocks text. */
export async function uploadPreparationImages(
  sessionId: string,
  token: string,
  p: UndercoverPreparation,
) {
  const result = { missing: 0, failed: 0 };
  const response = await fetch(`/api/server/sessions/${sessionId}/private`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const raw = await readResponse(response);
  const parsed = z
    .object({
      undercoverPreparation: z
        .object({
          id: z.uuid(),
          contents: z.object({
            a: z.object({ id: z.uuid() }),
            b: z.object({ id: z.uuid() }),
          }),
        })
        .optional(),
    })
    .passthrough()
    .parse(raw);
  if (!parsed.undercoverPreparation || parsed.undercoverPreparation.id !== p.id)
    return result;
  for (const side of ["a", "b"] as const) {
    const image = p.contents[side].imageId;
    if (!image) continue;
    try {
      const blob = await getSeriesImage(image);
      if (!blob) {
        result.missing++;
        continue;
      }
      const sent = await fetch(
        `/api/server/sessions/${sessionId}/media/${parsed.undercoverPreparation.contents[side].id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "image/png",
          },
          body: blob,
        },
      );
      if (!sent.ok) result.failed++;
    } catch {
      result.failed++;
    }
  }
  return result;
}
