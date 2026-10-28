"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  GmSessionView,
  SessionView,
  LobbyAction,
} from "@extension-twitch/contracts/sessions";
import { ThemeControl } from "./application-theme";
import { CopyLink } from "./copy-link";
import { GamePanel } from "./game-panel";
import { BroadcastFeed } from "./broadcast-feed";
import { Badge } from "./ui/primitives";
import { useConfirm } from "./ui/feedback";
import { StitchLobby } from "./stitch-lobby";
import { UndercoverCompanion } from "./undercover-companion";
import { supportsUndercoverCompanion } from "../lib/undercover-companion";

type Send = (action?: LobbyAction) => Promise<boolean>;
export function UndercoverRoom({
  view,
  connection,
  error,
  busy,
  retryAvailable,
  send,
  privateUrl,
}: {
  view: SessionView;
  connection: string;
  error: string;
  busy: boolean;
  retryAvailable: boolean;
  send: Send;
  privateUrl: string;
}) {
  const confirm = useConfirm(),
    gm = view.audience === "gm" ? view : null;
  const [pane, setPane] = useState("game"),
    [rename, setRename] = useState("");
  const playing = !!view.publicGame,
    play = view.publicGame?.play,
    locked = busy || retryAvailable || connection !== "connected";
  useEffect(() => {
    const sync = () => {
      const hash = location.hash.slice(1);
      if (["game", "players", "board", "session"].includes(hash))
        setPane(hash === "session" ? "game" : hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const label =
    connection === "connected"
      ? "Synchronisé"
      : connection === "reconnecting"
        ? "Reconnexion… Actions suspendues."
        : connection === "denied"
          ? "Accès indisponible"
          : "Connexion…";
  function navigate(next: string) {
    setPane(next);
    history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const feedback = (
    <>
      <div className="experience-status">
        <span
          className={`session-connection ${connection}`}
          data-testid="session-connection"
          role="status"
        >
          {label}
        </span>
        {gm && <span>{view.participants.length} joueurs</span>}
      </div>
      {error && (
        <p className="lobby-error" role="alert">
          {error}
        </p>
      )}
      {retryAvailable && (
        <div className="lobby-warning">
          <p>Une action attend sa confirmation. Vos données sont conservées.</p>
          <button
            className="secondary-button"
            disabled={busy || connection !== "connected"}
            onClick={() => void send()}
          >
            Réessayer la commande
          </button>
        </div>
      )}
    </>
  );
  const head = (
    <header className="experience-top">
      <Link className="session-brand" href="/">
        xt
        <span>
          Extension Twitch<small>{gm ? "RÉGIE" : "MON COMPAGNON"}</small>
        </span>
      </Link>
      <ThemeControl />
    </header>
  );
  if (view.audience === "player" && !supportsUndercoverCompanion(view.game))
    return (
      <main
        className="session-shell experience-shell companion-shell"
        data-experience="player"
      >
        {head}
        {feedback}
        <div className="companion-identity">
          <h1>
            {view.participants.find((p) => p.id === view.participantId)?.name ??
              "Votre partie"}
          </h1>
          <p>{view.title}</p>
        </div>
        <GamePanel view={view} locked={locked} send={send} />
        <details className="operation-secondary">
          <summary>Conserver mon accès joueur</summary>
          <CopyLink
            label="Lien privé joueur — ne pas partager"
            value={privateUrl}
            privateLink
          />
        </details>
      </main>
    );
  if (view.audience === "player")
    return (
      <UndercoverCompanion
        view={view}
        locked={locked}
        send={send}
        privateUrl={privateUrl}
        feedback={{ connection, error, busy, retryAvailable }}
      />
    );
  if (gm && !playing && gm.preparedGame)
    return (
      <StitchLobby
        view={gm}
        connection={connection}
        error={error}
        busy={busy}
        retryAvailable={retryAvailable}
        send={send}
        privateUrl={privateUrl}
      />
    );
  if (!gm) return null;
  return (
    <main className="session-shell experience-shell" data-experience="gm">
      {head}
      {feedback}
      <div className="operating-header">
        <div>
          <span className="eyebrow">VOTRE PARTIE</span>
          <h1>Undercover</h1>
        </div>
        <Badge
          tone={play?.outcome ? "info" : play?.dealt ? "success" : "primary"}
        >
          {play?.outcome
            ? "Terminée"
            : play?.dealt
              ? "En cours"
              : "Préparation"}
        </Badge>
      </div>
      <nav className="operation-tabs" aria-label="Navigation de la session">
        {[
          ["game", "Partie"],
          ["players", "Joueurs"],
          ["board", "Plateau"],
        ].map(([id, name]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={pane === id ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              navigate(id!);
            }}
          >
            {name}
          </a>
        ))}
      </nav>
      <section className="experience-pane" hidden={pane !== "game"}>
        <GamePanel view={gm} locked={locked} send={send} />
        <details className="operation-secondary">
          <summary>Accès et réglages de la partie</summary>
          <p>
            Les inscriptions sont fermées pour cette partie. Rejouer conserve
            les joueurs.
          </p>
          <CopyLink
            label="Accès privé GM — ne pas partager avec les joueurs"
            value={privateUrl}
            privateLink
          />
          <form
            className="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send({ type: "session.rename", title: rename });
            }}
          >
            <label>
              Nouveau nom de l’émission
              <input
                value={rename}
                maxLength={32}
                required
                disabled={locked}
                onChange={(e) => setRename(e.target.value)}
              />
            </label>
            <button
              className="secondary-button"
              disabled={locked || !rename.trim()}
            >
              Renommer la session
            </button>
          </form>
          <button
            className="danger-button"
            disabled={locked}
            onClick={() =>
              void confirm({
                title: "Réinitialiser le salon ?",
                description:
                  "Les joueurs seront retirés et leurs accès révoqués. Cette action est irréversible.",
                confirmLabel: "Réinitialiser le salon",
                tone: "danger",
                onConfirm: () => send({ type: "session.reset" }),
              })
            }
          >
            Réinitialiser le salon
          </button>
        </details>
      </section>
      <section className="experience-pane" hidden={pane !== "players"}>
        <h2>
          Les invités{" "}
          <span className="count-badge">{view.participants.length}</span>
        </h2>
        <Roster view={gm} />
        <p className="lobby-hint">
          L’effectif reste le même pendant la partie. Les états de connexion ne
          constituent pas un vote.
        </p>
      </section>
      <section className="experience-pane gm-board" hidden={pane !== "board"}>
        <h2>Le plateau public</h2>
        <p className="lobby-hint">
          Même rendu que dans OBS, informations publiques uniquement.
        </p>
        <BroadcastFeed id={view.sessionId} />
        <div className="layout-actions">
          <a
            className="secondary-button"
            href={`/sessions/${view.sessionId}/stream`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Aperçu de l’émission ↗
          </a>
          <Link
            className="text-link"
            href={`/sessions/${view.sessionId}/overlay`}
          >
            Personnaliser l’overlay
          </Link>
        </div>
        <CopyLink
          label="Source OBS transparente"
          value={`${new URL(gm.publicUrl).origin}/sessions/${view.sessionId}/obs`}
        />
      </section>
    </main>
  );
}
function Roster({
  view,
  remove,
  disabled = false,
}: {
  view: SessionView;
  remove?: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="lobby-players">
      {view.participants.map((p) => {
        const state = view.publicGame?.play?.roster.find((r) => r.id === p.id);
        return (
          <li key={p.id}>
            <span className="avatar">
              {p.name.slice(0, 2).toLocaleUpperCase("fr")}
            </span>
            <div>
              <strong>{p.name}</strong>
              <span>
                {state
                  ? state.active
                    ? view.publicGame?.play?.dealt
                      ? "En jeu"
                      : "En attente"
                    : "Éliminé"
                  : p.ready
                    ? "Prêt"
                    : "En préparation"}{" "}
                · {p.connected ? "Connecté" : "Hors ligne"}
              </span>
            </div>
            {remove && (
              <button
                className="secondary-button"
                disabled={disabled}
                aria-label={`Retirer ${p.name}`}
                onClick={() => remove(p.id)}
              >
                Retirer
              </button>
            )}
          </li>
        );
      })}
      {view.participants.length === 0 && (
        <li>Aucun joueur inscrit. Partagez votre invitation.</li>
      )}
    </ul>
  );
}
