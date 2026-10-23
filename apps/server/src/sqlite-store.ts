import {
  studioWorkspaceSchema,
  type StudioWorkspace,
} from "@extension-twitch/contracts/creator";
import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { LobbyState, SessionActor } from "@extension-twitch/engine";
import { SessionError } from "@extension-twitch/engine";

export class SqliteStore {
  private readonly db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    this.db.exec(
      "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
    );
    const version = this.db.prepare("PRAGMA user_version").get()?.user_version;
    if (typeof version !== "number" || version > 2)
      throw new Error("Unsupported database schema");
    this.transaction(() =>
      this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, invitation_hash TEXT NOT NULL UNIQUE, state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS credentials (
        session_id TEXT NOT NULL REFERENCES sessions(id), token_hash TEXT NOT NULL,
        participant_id TEXT, role TEXT NOT NULL CHECK(role IN ('gm','player')),
        PRIMARY KEY(session_id, token_hash)
      );
      CREATE TABLE IF NOT EXISTS receipts (
        scope TEXT NOT NULL, command_id TEXT NOT NULL, fingerprint TEXT NOT NULL, result TEXT NOT NULL,
        PRIMARY KEY(scope, command_id)
      );
      CREATE TABLE IF NOT EXISTS events (
        session_id TEXT NOT NULL REFERENCES sessions(id), version INTEGER NOT NULL, event TEXT NOT NULL,
        PRIMARY KEY(session_id, version)
      );
      CREATE TABLE IF NOT EXISTS creator_workspaces (
        id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
        bootstrap_fingerprint TEXT NOT NULL, state TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS creator_receipts (
        workspace_id TEXT NOT NULL REFERENCES creator_workspaces(id), command_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL, PRIMARY KEY(workspace_id,command_id)
      );
      PRAGMA user_version=2;
    `),
    );
  }

  transaction<T>(work: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  load(id: string): LobbyState {
    const row = this.db
      .prepare("SELECT state FROM sessions WHERE id=?")
      .get(id);
    if (!row) throw new SessionError("SESSION_NOT_FOUND", 404);
    return JSON.parse(String(row.state)) as LobbyState;
  }
  findInvitation(hash: string): LobbyState {
    const row = this.db
      .prepare("SELECT id FROM sessions WHERE invitation_hash=?")
      .get(hash);
    if (!row) throw new SessionError("INVITATION_NOT_FOUND", 404);
    return this.load(String(row.id));
  }
  save(state: LobbyState, invitationHash: string, create = false) {
    if (create)
      this.db
        .prepare("INSERT INTO sessions(id,invitation_hash,state) VALUES(?,?,?)")
        .run(state.id, invitationHash, JSON.stringify(state));
    else
      this.db
        .prepare("UPDATE sessions SET invitation_hash=?,state=? WHERE id=?")
        .run(invitationHash, JSON.stringify(state), state.id);
    const event = state.events.at(-1);
    if (!event) throw new Error("Missing event");
    this.db
      .prepare("INSERT INTO events(session_id,version,event) VALUES(?,?,?)")
      .run(state.id, event.version, JSON.stringify(event));
  }
  authorize(id: string, hash: string): SessionActor {
    const row = this.db
      .prepare(
        "SELECT role,participant_id FROM credentials WHERE session_id=? AND token_hash=?",
      )
      .get(id, hash);
    if (row?.role === "gm") return { role: "gm" };
    if (row?.role === "player" && typeof row.participant_id === "string")
      return { role: "player", participantId: row.participant_id };
    throw new SessionError("ACCESS_DENIED", 401);
  }
  grant(id: string, hash: string, actor: SessionActor) {
    this.db
      .prepare(
        "INSERT INTO credentials(session_id,token_hash,participant_id,role) VALUES(?,?,?,?)",
      )
      .run(
        id,
        hash,
        actor.role === "player" ? actor.participantId : null,
        actor.role,
      );
  }
  revoke(id: string, participantId?: string) {
    if (participantId)
      this.db
        .prepare(
          "DELETE FROM credentials WHERE session_id=? AND participant_id=?",
        )
        .run(id, participantId);
    else
      this.db
        .prepare("DELETE FROM credentials WHERE session_id=? AND role='player'")
        .run(id);
  }
  receipt(
    scope: string,
    commandId: string,
    fingerprint: string,
  ): { sessionId: string; participantId?: string } | null {
    const row = this.db
      .prepare(
        "SELECT fingerprint,result FROM receipts WHERE scope=? AND command_id=?",
      )
      .get(scope, commandId);
    if (!row) return null;
    if (row.fingerprint !== fingerprint)
      throw new SessionError("COMMAND_ID_REUSED", 409);
    return JSON.parse(String(row.result)) as {
      sessionId: string;
      participantId?: string;
    };
  }
  acknowledge(
    scope: string,
    commandId: string,
    fingerprint: string,
    result: { sessionId: string; participantId?: string },
  ) {
    this.db
      .prepare(
        "INSERT INTO receipts(scope,command_id,fingerprint,result) VALUES(?,?,?,?)",
      )
      .run(scope, commandId, fingerprint, JSON.stringify(result));
  }
  studioBootstrap(hash: string, fingerprint: string): StudioWorkspace | null {
    const row = this.db
      .prepare(
        "SELECT state,bootstrap_fingerprint FROM creator_workspaces WHERE token_hash=?",
      )
      .get(hash);
    if (!row) return null;
    if (row.bootstrap_fingerprint !== fingerprint)
      throw new SessionError("COMMAND_ID_REUSED", 409);
    return studioWorkspaceSchema.parse(
      JSON.parse(String(row.state)) as unknown,
    );
  }
  createStudio(state: StudioWorkspace, hash: string, fingerprint: string) {
    this.db
      .prepare(
        "INSERT INTO creator_workspaces(id,token_hash,bootstrap_fingerprint,state) VALUES(?,?,?,?)",
      )
      .run(state.id, hash, fingerprint, JSON.stringify(state));
  }
  loadStudio(id: string, hash: string): StudioWorkspace {
    const row = this.db
      .prepare(
        "SELECT state FROM creator_workspaces WHERE id=? AND token_hash=?",
      )
      .get(id, hash);
    if (!row) throw new SessionError("ACCESS_DENIED", 401);
    return studioWorkspaceSchema.parse(
      JSON.parse(String(row.state)) as unknown,
    );
  }
  saveStudio(state: StudioWorkspace) {
    this.db
      .prepare("UPDATE creator_workspaces SET state=? WHERE id=?")
      .run(JSON.stringify(state), state.id);
  }
  studioReceipt(id: string, commandId: string, fingerprint: string): boolean {
    const row = this.db
      .prepare(
        "SELECT fingerprint FROM creator_receipts WHERE workspace_id=? AND command_id=?",
      )
      .get(id, commandId);
    if (!row) return false;
    if (row.fingerprint !== fingerprint)
      throw new SessionError("COMMAND_ID_REUSED", 409);
    return true;
  }
  acknowledgeStudio(id: string, commandId: string, fingerprint: string) {
    this.db
      .prepare(
        "INSERT INTO creator_receipts(workspace_id,command_id,fingerprint) VALUES(?,?,?)",
      )
      .run(id, commandId, fingerprint);
  }
  close() {
    this.db.close();
  }
}
