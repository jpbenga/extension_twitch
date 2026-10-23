import type { GameId } from "@extension-twitch/contracts";

// Interfaces only. Command execution, projections and persistence are step 3.
export interface GameModule<
  Configuration,
  State,
  Command,
  Event,
  PublicView,
  PlayerView,
> {
  readonly id: GameId;
  validateConfiguration(input: unknown): Configuration;
  parseCommand(input: unknown): Command;
  decide(
    state: Readonly<State>,
    command: Command,
    context: CommandContext,
  ): readonly Event[];
  evolve(state: Readonly<State>, event: Event): State;
  publicView(state: Readonly<State>): PublicView;
  playerView(state: Readonly<State>, participantId: string): PlayerView;
}

export interface CommandContext {
  readonly actor:
    | { readonly role: "gm"; readonly userId: string }
    | { readonly role: "player"; readonly participantId: string };
  readonly now: string;
}

// A future adapter must atomically compare versions and persist state + events.
// SQLite is the initial implementation target, not an implemented dependency here.
export interface SessionRepository<State, Event> {
  load(sessionId: string): Promise<{ version: number; state: State } | null>;
  commit(input: {
    sessionId: string;
    commandId: string;
    expectedVersion: number;
    state: State;
    events: readonly Event[];
  }): Promise<"committed" | "duplicate" | "version-conflict">;
}

declare const verifiedByTwitchAdapter: unique symbol;

// Server-only design boundary. Never deserialize this type from a browser body.
// A future adapter must verify authenticity, channel/product binding and expiry.
export interface VerifiedBitsReceipt {
  readonly [verifiedByTwitchAdapter]: true;
  readonly transactionId: string;
  readonly channelId: string;
  readonly productSku: string;
}

export type ExternalInteraction =
  | {
      readonly source: "demo";
      readonly requestId: string;
      readonly interactionId: string;
    }
  | {
      readonly source: "twitch-free";
      readonly requestId: string;
      readonly interactionId: string;
      readonly viewerId: string;
    }
  | {
      readonly source: "twitch-bits";
      readonly receipt: VerifiedBitsReceipt;
      readonly interactionId: string;
    };

// Transaction IDs must be recorded atomically with effects before acknowledgement.
// No adapter, receipt factory or payment execution exists in this foundation.
