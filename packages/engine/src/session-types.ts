/** Authentication authority belongs to the session service, never to a game definition. */
export type SessionActor =
  { role: "gm" } | { role: "player"; participantId: string };

export class SessionError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}
