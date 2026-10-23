import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  addParticipant,
  decideLobby,
  projectPublicSession,
  type LobbyState,
} from "@extension-twitch/engine";
import { parseSse } from "../apps/web/src/lib/session-client.js";
import { readConfiguration } from "../apps/server/src/config.js";

const base = (): LobbyState => ({
  id: randomUUID(),
  title: "Plateau",
  hostName: "GM",
  gameId: "undercover",
  phase: "lobby",
  version: 1,
  invitationCode: "private_code",
  admissionOpen: true,
  participants: [],
  events: [],
});
const context = {
  at: "2026-10-23T12:00:00.000Z",
  nextInvitationCode: "renewed_code",
};

describe("independent lobby engine", () => {
  it("rejects joins and commands outside the implemented lobby phase", () => {
    const state = { ...base(), phase: "future-phase" } as unknown as LobbyState;
    expect(() =>
      addParticipant(state, randomUUID(), "Nova", context.at),
    ).toThrow("WRONG_PHASE");
    expect(() =>
      decideLobby(state, { role: "gm" }, { type: "session.reset" }, context),
    ).toThrow("WRONG_PHASE");
  });
  it("does not mutate its input and only changes the authenticated player", () => {
    const firstId = randomUUID(),
      secondId = randomUUID();
    const state = addParticipant(
      addParticipant(base(), firstId, "Nova", context.at),
      secondId,
      "Atlas",
      context.at,
    );
    const next = decideLobby(
      state,
      { role: "player", participantId: firstId },
      { type: "participant.ready", ready: true },
      context,
    );
    expect(state.participants.every((player) => !player.ready)).toBe(true);
    expect(next.participants.map((player) => player.ready)).toEqual([
      true,
      false,
    ]);
    expect(() =>
      decideLobby(
        state,
        { role: "player", participantId: randomUUID() },
        { type: "participant.ready", ready: true },
        context,
      ),
    ).toThrow("ACCESS_REVOKED");
  });
  it("constructs public fields explicitly even when future private fields exist", () => {
    const state = {
      ...base(),
      secretWord: "NEVER_PUBLIC",
      gmTokenHash: "NEVER_PUBLIC",
      participants: [
        {
          id: randomUUID(),
          name: "Nova",
          ready: false,
          secretRole: "NEVER_PUBLIC",
        },
      ],
    };
    const result = JSON.stringify(projectPublicSession(state, new Set()));
    expect(result).not.toContain("NEVER_PUBLIC");
    expect(result).not.toContain(state.invitationCode);
  });
  it("caps lobby size for resource use without defining an Undercover player count", () => {
    let state = base();
    for (let i = 0; i < 32; i++)
      state = addParticipant(state, randomUUID(), `Joueur ${i}`, context.at);
    expect(() =>
      addParticipant(state, randomUUID(), "En trop", context.at),
    ).toThrow("LOBBY_FULL");
  });
});

describe("stream parsing across real HTTP chunk boundaries", () => {
  it("retains a partial message and handles split CRLF, heartbeat and several frames", () => {
    const first = parseSse(': heartbeat\r\n\r\ndata: {"type":');
    expect(first.messages).toEqual([]);
    const next = parseSse(first.remaining + '"one"}\r');
    expect(next.messages).toEqual([]);
    const final = parseSse(next.remaining + '\n\r\ndata: {"type":"two"}\n\n');
    expect(final.messages).toEqual(['{"type":"one"}', '{"type":"two"}']);
    expect(final.remaining).toBe("");
  });
  it("joins multiline data and ignores comments", () => {
    expect(parseSse(": hi\ndata: first\ndata: second\n\n").messages).toEqual([
      "first\nsecond",
    ]);
  });
});

describe("network/public origin validation", () => {
  it.each([
    "http://192.168.1.42:3000",
    "http://10.0.0.2:3000",
    "https://studio.example",
  ])("accepts %s", (origin) => {
    expect(readConfiguration({ PUBLIC_ORIGIN: origin }).publicOrigin).toBe(
      origin,
    );
  });
  it.each([
    "http://studio.example",
    "http://10.attacker.example",
    "https://studio.example/path",
    "https://user:password@studio.example",
    "https://studio.example?key=bad",
  ])("rejects unsafe or non-origin configuration %s", (origin) => {
    expect(() => readConfiguration({ PUBLIC_ORIGIN: origin })).toThrow();
  });
});
