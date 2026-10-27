import { invitationCodeSchema } from "@extension-twitch/contracts/sessions";

export const invitationInputError =
  "Collez le code complet ou le lien d’invitation fourni par le GM.";

/** The existing invitation entry rules, shared by /join and the homepage. */
export function parseInvitationCode(input: string): string | null {
  let value = input.trim();
  if (value.includes("://")) {
    try {
      value = new URL(value).pathname.split("/").at(-1) ?? "";
    } catch {
      return null;
    }
  }
  return invitationCodeSchema.safeParse(value).success ? value : null;
}
