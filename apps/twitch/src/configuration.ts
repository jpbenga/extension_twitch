import { z } from "zod";
import { sessionIdSchema } from "@extension-twitch/contracts/sessions";

/** Public pointers only, stored by Twitch for this broadcaster. No GM/player access or future pair. */
export const viewerConfigurationSchema = z.strictObject({
  version: z.literal(1),
  sessionId: sessionIdSchema,
  apiOrigin: z
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      );
    }, "Utilisez une origine HTTPS sans chemin ni accès privé.")
    .transform((value) => new URL(value).origin),
});
export type ViewerConfiguration = z.infer<typeof viewerConfigurationSchema>;
export function sessionFromPublicInput(input: string) {
  if (sessionIdSchema.safeParse(input.trim()).success) return input.trim();
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Copiez le lien public du plateau depuis la régie.");
  }
  // Never accept a private GM/player URL or its recovery fragment.
  if (url.hash || url.username || url.password || url.search)
    throw new Error("Lien public uniquement, sans accès privé.");
  const match = /^\/sessions\/([^/]+)\/(public|obs|stream)$/.exec(url.pathname);
  if (!match || !["http:", "https:"].includes(url.protocol))
    throw new Error("Copiez le lien public du plateau depuis la régie.");
  return sessionIdSchema.parse(match[1]);
}
