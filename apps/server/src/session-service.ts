import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  projectGame,
  addParticipant,
  decideLobby,
  projectPublicSession,
  recordEvent,
  SessionError,
  type PreparedGame,
} from "@extension-twitch/engine";
import {
  sessionViewSchema,
  type LobbyCommand,
  type SessionView,
  type createSessionSchema,
  type joinSessionSchema,
} from "@extension-twitch/contracts/sessions";
import type { z } from "zod";
import { SqliteStore } from "./sqlite-store.js";

export const hashValue = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const invitation = () => randomBytes(9).toString("base64url");
const fingerprint = (value: unknown) => hashValue(JSON.stringify(value));
type StreamMessage =
  { type: "session.snapshot"; view: SessionView } | { type: "access.revoked" };
interface Subscription {
  hash: string | null;
  playerId: string | null;
  send: (message: StreamMessage) => void;
}

export class SessionService {
  private readonly streams = new Map<string, Set<Subscription>>();
  shutdown() {
    for (const group of this.streams.values()) group.clear();
    this.streams.clear();
  }
  constructor(
    readonly store: SqliteStore,
    readonly publicOrigin: string,
  ) {}

  create(
    token: string,
    input: z.infer<typeof createSessionSchema>,
    prepared?: PreparedGame,
  ) {
    const hash = hashValue(token);
    return this.store.transaction(() => {
      const scope = `create:${hash}`;
      const prior = this.store.receipt(
        scope,
        input.requestId,
        fingerprint(prepared ? { input, prepared } : input),
      );
      if (prior) {
        this.store.authorize(prior.sessionId, hash);
        return prior;
      }
      const state = recordEvent(
        {
          ...(prepared ? { preparedGame: structuredClone(prepared) } : {}),
          ...(prepared?.overlayLayout
            ? { overlayLayout: structuredClone(prepared.overlayLayout) }
            : {}),
          id: randomUUID(),
          title: input.title,
          hostName: input.hostName,
          gameId: input.gameId,
          phase: "lobby",
          version: 0,
          invitationCode: invitation(),
          admissionOpen: true,
          participants: [],
          events: [],
        },
        "session.created",
        `${input.hostName} a créé la session.`,
        new Date().toISOString(),
      );
      this.store.save(state, hashValue(state.invitationCode), true);
      this.store.grant(state.id, hash, { role: "gm" });
      const result = { sessionId: state.id };
      this.store.acknowledge(
        scope,
        input.requestId,
        fingerprint(prepared ? { input, prepared } : input),
        result,
      );
      return result;
    });
  }

  join(code: string, token: string, input: z.infer<typeof joinSessionSchema>) {
    const hash = hashValue(token);
    const result = this.store.transaction(() => {
      const state = this.store.findInvitation(hashValue(code));
      const scope = `join:${state.id}:${hash}`;
      const prior = this.store.receipt(
        scope,
        input.requestId,
        fingerprint(input),
      );
      if (prior) {
        this.store.authorize(state.id, hash);
        return prior;
      }
      // A credential already assigned to an identity cannot register another one.
      try {
        this.store.authorize(state.id, hash);
      } catch (error) {
        if (!(error instanceof SessionError) || error.code !== "ACCESS_DENIED")
          throw error;
        const participantId = randomUUID();
        const next = addParticipant(
          state,
          participantId,
          input.name,
          new Date().toISOString(),
        );
        this.store.save(next, hashValue(next.invitationCode));
        this.store.grant(state.id, hash, { role: "player", participantId });
        const joined = { sessionId: state.id, participantId };
        this.store.acknowledge(
          scope,
          input.requestId,
          fingerprint(input),
          joined,
        );
        return joined;
      }
      throw new SessionError("CREDENTIAL_ALREADY_USED", 409);
    });
    this.broadcast(result.sessionId);
    return result;
  }

  command(id: string, token: string, input: LobbyCommand) {
    const hash = hashValue(token);
    this.store.transaction(() => {
      const actor = this.store.authorize(id, hash);
      const scope = `command:${id}:${hash}`;
      if (this.store.receipt(scope, input.commandId, fingerprint(input)))
        return;
      const state = this.store.load(id);
      if (state.version !== input.expectedVersion)
        throw new SessionError("VERSION_CONFLICT", 409);
      const next = decideLobby(state, actor, input.command, {
        at: new Date().toISOString(),
        nextInvitationCode: invitation(),
      });
      this.store.save(next, hashValue(next.invitationCode));
      if (input.command.type === "participant.remove")
        this.store.revoke(id, input.command.participantId);
      if (input.command.type === "session.reset") this.store.revoke(id);
      this.store.acknowledge(scope, input.commandId, fingerprint(input), {
        sessionId: id,
      });
    });
    this.broadcast(id);
    return this.view(id, hash);
  }

  view(id: string, hash: string | null): SessionView {
    const actor = hash === null ? null : this.store.authorize(id, hash);
    const state = this.store.load(id);
    const connected = new Set(
      [...(this.streams.get(id) ?? [])].flatMap((subscription) =>
        subscription.playerId ? [subscription.playerId] : [],
      ),
    );
    const publicView = projectPublicSession(state, connected);
    if (actor?.role === "gm")
      return sessionViewSchema.parse({
        ...publicView,
        audience: "gm",
        ...(state.preparedGame
          ? {
              preparedGame: {
                title: state.preparedGame.definition.title,
                definitionId: state.preparedGame.definition.id,
                definitionVersion: state.preparedGame.definition.version,
              },
            }
          : {}),
        ...(state.gameRun ? { game: projectGame(state.gameRun, actor) } : {}),
        invitationCode: state.invitationCode,
        joinUrl: `${this.publicOrigin}/join/${state.invitationCode}`,
        publicUrl: `${this.publicOrigin}/sessions/${id}/public`,
      });
    if (actor?.role === "player")
      return sessionViewSchema.parse({
        ...publicView,
        audience: "player",
        ...(state.gameRun ? { game: projectGame(state.gameRun, actor) } : {}),
        participantId: actor.participantId,
      });
    return sessionViewSchema.parse(publicView);
  }

  subscribe(id: string, token: string | null, send: Subscription["send"]) {
    const hash = token === null ? null : hashValue(token);
    const initial = this.view(id, hash);
    const group = this.streams.get(id) ?? new Set<Subscription>();
    const total = [...this.streams.values()].reduce(
      (count, streams) => count + streams.size,
      0,
    );
    if (group.size >= 128 || total >= 512)
      throw new SessionError("TOO_MANY_CONNECTIONS", 429);
    const subscription: Subscription = {
      hash,
      playerId: initial.audience === "player" ? initial.participantId : null,
      send,
    };
    group.add(subscription);
    this.streams.set(id, group);
    this.broadcast(id);
    return () => {
      if (!group.delete(subscription)) return;
      if (group.size === 0) this.streams.delete(id);
      else this.broadcast(id);
    };
  }

  private broadcast(id: string) {
    const group = this.streams.get(id);
    if (!group) return;
    // Revoke every invalid identity before constructing any presence projection.
    for (const subscription of group) {
      if (subscription.hash === null) continue;
      try {
        this.store.authorize(id, subscription.hash);
      } catch {
        group.delete(subscription);
        subscription.send({ type: "access.revoked" });
      }
    }
    for (const subscription of group)
      subscription.send({
        type: "session.snapshot",
        view: this.view(id, subscription.hash),
      });
    if (group.size === 0) this.streams.delete(id);
  }
}
