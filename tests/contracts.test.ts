import { describe, expect, it } from "vitest";
import {
  commandEnvelopeSchema,
  interactionPolicySchema,
  publicDemoSchema,
  spectatorRequestSchema,
} from "@extension-twitch/contracts";

const requestId = "30322ae4-50c6-48cb-82e0-11a0dcf7cd50";

describe("public data boundary", () => {
  const demo = {
    kind: "demo",
    title: "Plateau",
    participants: [{ id: "p1", name: "Naruto", initials: "NA" }],
  };
  it("accepts user-supplied names without imposing a character catalogue", () => {
    expect(publicDemoSchema.parse(demo).participants[0]?.name).toBe("Naruto");
  });
  it("rejects secret fields at the public root", () => {
    expect(
      publicDemoSchema.safeParse({ ...demo, secretWord: "hidden" }).success,
    ).toBe(false);
  });
  it("rejects private fields inside a public participant", () => {
    expect(
      publicDemoSchema.safeParse({
        ...demo,
        participants: [{ ...demo.participants[0], role: "spy" }],
      }).success,
    ).toBe(false);
  });
});

describe("future command envelope", () => {
  const command = {
    commandId: requestId,
    sessionId: "session",
    expectedVersion: 0,
    gameId: "auctions",
    command: { type: "future-command", payload: {} },
  };
  it("requires a usable idempotency identifier and a nonnegative integer version", () => {
    expect(commandEnvelopeSchema.safeParse(command).success).toBe(true);
    expect(
      commandEnvelopeSchema.safeParse({ ...command, commandId: "" }).success,
    ).toBe(false);
    expect(
      commandEnvelopeSchema.safeParse({ ...command, expectedVersion: -1 })
        .success,
    ).toBe(false);
    expect(
      commandEnvelopeSchema.safeParse({ ...command, expectedVersion: 1.5 })
        .success,
    ).toBe(false);
  });
  it("does not allow a client to assign itself a server-side role", () => {
    expect(
      commandEnvelopeSchema.safeParse({ ...command, actor: { role: "gm" } })
        .success,
    ).toBe(false);
  });
});

describe("spectator integration boundary", () => {
  const request = {
    requestId,
    interactionId: "future-poll",
    source: "demo",
    payload: { choice: 1 },
  };
  it("accepts demo and free requests only", () => {
    expect(spectatorRequestSchema.safeParse(request).success).toBe(true);
    expect(
      spectatorRequestSchema.safeParse({ ...request, source: "twitch-free" })
        .success,
    ).toBe(true);
    expect(
      spectatorRequestSchema.safeParse({ ...request, source: "twitch-bits" })
        .success,
    ).toBe(false);
  });
  it("rejects a browser-supplied payment receipt", () => {
    expect(
      spectatorRequestSchema.safeParse({
        ...request,
        transactionId: "fake",
        verified: true,
      }).success,
    ).toBe(false);
  });
  it("requires a Twitch product reference for future Bits policies and valid limits", () => {
    const policy = {
      id: "future-event",
      enabled: false,
      effect: "cosmetic",
      cooldownSeconds: 30,
      maxUsesPerSession: 2,
      requiresGmApproval: true,
      pricing: "twitch-bits",
    };
    expect(interactionPolicySchema.safeParse(policy).success).toBe(false);
    expect(
      interactionPolicySchema.safeParse({
        ...policy,
        twitchProductSku: "future-sku",
      }).success,
    ).toBe(true);
    expect(
      interactionPolicySchema.safeParse({
        ...policy,
        twitchProductSku: "future-sku",
        cooldownSeconds: -1,
      }).success,
    ).toBe(false);
    expect(
      interactionPolicySchema.safeParse({
        ...policy,
        twitchProductSku: "future-sku",
        maxUsesPerSession: 0,
      }).success,
    ).toBe(false);
  });
});
