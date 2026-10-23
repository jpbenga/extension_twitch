import { randomUUID } from "node:crypto";
import {
  decideCreator,
  guideRepresentable,
  findRelease,
  officialCatalog,
  exportManifest,
  type PreparedGame,
} from "@extension-twitch/engine";
import {
  studioViewSchema,
  type CreatorCommand,
  type creatorTestSchema,
  type workspaceCreateSchema,
} from "@extension-twitch/contracts/creator";
import { SessionError } from "@extension-twitch/engine";
import type { z } from "zod";
import { hashValue, type SessionService } from "./session-service.js";
import type { SqliteStore } from "./sqlite-store.js";
const fingerprint = (value: unknown) => hashValue(JSON.stringify(value));
export class CreatorService {
  constructor(
    private readonly store: SqliteStore,
    private readonly sessions: SessionService,
  ) {}
  create(token: string, input: z.infer<typeof workspaceCreateSchema>) {
    return this.store.transaction(() => {
      const hash = hashValue(token),
        fp = fingerprint(input);
      const prior = this.store.studioBootstrap(hash, fp);
      if (prior) return this.view(prior.id, token);
      const state = {
        id: randomUUID(),
        name: input.name,
        version: 1,
        games: [],
        installations: [],
      };
      this.store.createStudio(state, hash, fp);
      return this.view(state.id, token);
    });
  }
  view(id: string, token: string) {
    const workspace = this.store.loadStudio(id, hashValue(token));
    return studioViewSchema.parse({
      workspace,
      catalog: officialCatalog,
      guideCompatibility: Object.fromEntries(
        workspace.games.map((g) => [g.identity.id, guideRepresentable(g)]),
      ),
    });
  }
  command(id: string, token: string, input: CreatorCommand) {
    this.store.transaction(() => {
      const state = this.store.loadStudio(id, hashValue(token));
      const fp = fingerprint(input);
      if (this.store.studioReceipt(id, input.commandId, fp)) return;
      if (state.version !== input.expectedVersion)
        throw new SessionError("VERSION_CONFLICT", 409);
      const next = decideCreator(state, input.operation, {
        id: randomUUID(),
        at: new Date().toISOString(),
      });
      this.store.saveStudio(next);
      this.store.acknowledgeStudio(id, input.commandId, fp);
    });
    return this.view(id, token);
  }
  manifest(id: string, token: string, gameId: string, version: string) {
    const state = this.store.loadStudio(id, hashValue(token));
    return exportManifest(findRelease(state, gameId, version));
  }
  testSession(
    id: string,
    token: string,
    input: z.infer<typeof creatorTestSchema>,
  ) {
    const state = this.store.loadStudio(id, hashValue(token));
    let prepared: PreparedGame;
    if (input.version === "draft") {
      const draft = state.games.find(
        (g) => g.identity.id === input.gameId,
      )?.draft;
      if (!draft) throw new SessionError("GAME_NOT_FOUND", 404);
      if (
        input.draftRevision !== undefined &&
        input.draftRevision !== draft.revision
      )
        throw new SessionError("VERSION_CONFLICT", 409);
      prepared = {
        definition: draft.definition,
        assets: draft.assets.flatMap((a) => (a.binding ? [a.binding] : [])),
      };
    } else {
      const source = findRelease(state, input.gameId, input.version);
      prepared = {
        definition: source.release.definition,
        assets: source.release.assets.flatMap((a) =>
          a.binding ? [a.binding] : [],
        ),
      };
    }
    // Preserve complete Unicode characters when adapting the studio title to the lobby limit.
    let title = "";
    for (const character of prepared.definition.title) {
      if (title.length + character.length > 32) break;
      title += character;
    }
    return this.sessions.create(
      input.sessionToken,
      {
        requestId: input.requestId,
        title,
        hostName: "GM · Studio",
        gameId: prepared.definition.id,
      },
      prepared,
    );
  }
}
