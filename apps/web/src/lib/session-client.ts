import { apiErrorSchema } from "@extension-twitch/contracts/sessions";

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
// randomUUID is not available on every iPhone over trusted LAN HTTP.
export function commandId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 15) | 64;
  bytes[8] = (bytes[8]! & 63) | 128;
  const hex = [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export const accessKey = (id: string, role: string) =>
  `xt:access:${id}:${role}`;

const messages: Record<string, string> = {
  ACCESS_DENIED:
    "Accès privé absent ou révoqué. Ouvrez votre lien privé de récupération.",
  ACCESS_REVOKED:
    "Votre accès a été retiré. Demandez une nouvelle invitation au GM.",
  FORBIDDEN: "Cette action n’est pas autorisée pour votre accès.",
  ORIGIN_DENIED:
    "L’adresse réseau ne correspond pas à PUBLIC_ORIGIN. Relancez avec npm run dev:lan ou consultez le guide iPhone.",
  ADMISSION_CLOSED:
    "Le GM a fermé les invitations. Demandez-lui de les rouvrir.",
  INVITATION_NOT_FOUND:
    "Cette invitation est inconnue ou a été renouvelée par le GM.",
  SESSION_NOT_FOUND: "Cette session est introuvable sur ce serveur.",
  NAME_TAKEN: "Ce nom est déjà utilisé dans le salon. Choisissez un autre nom.",
  LOBBY_FULL: "Ce salon a atteint la limite technique de 32 participants.",
  VERSION_CONFLICT:
    "La session a changé entre-temps. Vérifiez son état puis recommencez votre action.",
  COMMAND_ID_REUSED:
    "Cette commande a déjà été utilisée avec un autre contenu. Rechargez la page.",
  INVALID_INPUT: "Vérifiez les champs saisis et le code d’invitation.",
  RATE_LIMITED: "Trop de demandes. Attendez une minute avant de réessayer.",
  INTERNAL_ERROR:
    "Le serveur ne peut pas enregistrer l’action. Réessayez avec la même commande.",
};
export class RequestFailure extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(messages[code] ?? "La demande n’a pas pu être traitée.");
  }
}
export async function readResponse(response: Response): Promise<unknown> {
  const value: unknown = await response.json();
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(value);
    throw new RequestFailure(
      parsed.success ? parsed.data.error : "INTERNAL_ERROR",
      response.status,
    );
  }
  return value;
}
export async function post(
  path: string,
  token: string,
  value: unknown,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`/api/server${path}`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(value),
      signal: controller.signal,
    });
    return await readResponse(response);
  } finally {
    clearTimeout(timeout);
  }
}

export function parseSse(buffer: string): {
  messages: string[];
  remaining: string;
} {
  const normalized = buffer.replaceAll("\r\n", "\n");
  const frames = normalized.split("\n\n");
  const remaining = frames.pop() ?? "";
  return {
    messages: frames.flatMap((frame) => {
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""));
      return data.length ? [data.join("\n")] : [];
    }),
    remaining,
  };
}
