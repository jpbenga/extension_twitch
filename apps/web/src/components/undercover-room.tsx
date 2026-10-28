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
import { StitchHeader } from "./stitch-frame";
import {
  GmGamePanel,
  GmRoster,
  GmDisclosure,
  GmPrivateInfo,
  GmJournal,
  GmReplay,
  gmHeading,
} from "./gm-game-panel";

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
    [rename, setRename] = useState(""),
    [settingsOpen, setSettingsOpen] = useState(false);
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
    <main
      className="session-shell experience-shell gm-studio"
      data-experience="gm"
    >
      <StitchHeader host />
      <div className="gm-workspace">
        {feedback}
        <div className="operating-header gm-page-heading">
          <div>
            <span className="eyebrow">
              UNDERCOVER · RÉGIE PRIVÉE DU MENEUR DE JEU
            </span>
            <h1>
              <span className="gm-desktop-title">
                {gm.game?.play
                  ? settingsOpen
                    ? "Accès et réglages"
                    : pane === "players"
                      ? "Les joueurs"
                      : pane === "board"
                        ? "Le plateau public"
                        : gmHeading(gm.game).title
                  : "Undercover"}
              </span>
              <span className="gm-mobile-title">Undercover</span>
            </h1>
            {gm.game?.play && (
              <p className="gm-desktop-description">
                {pane === "players"
                  ? "L’effectif reste fixe pendant la partie. Une déconnexion ne retire pas un joueur."
                  : pane === "board"
                    ? "Le véritable rendu public, synchronisé avec votre émission."
                    : gmHeading(gm.game).description}
              </p>
            )}
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
              aria-label={name}
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
          {gm.game?.play && gm.game.definitionId === "undercover" ? (
            <GmGamePanel
              view={gm}
              game={gm.game}
              locked={locked}
              send={send}
              hideSecondary
            />
          ) : (
            <>
              <GamePanel view={gm} locked={locked} send={send} />
              <details className="operation-secondary">
                <summary>Accès et réglages de la partie</summary>
                <p>
                  Les inscriptions sont fermées pour cette partie. Rejouer
                  conserve les joueurs.
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
            </>
          )}
        </section>
        <section className="experience-pane" hidden={pane !== "players"}>
          {gm.game?.play ? (
            <>
              <div className="gm-game-grid gm-players-grid">
                <section className="gm-card">
                  <div className="gm-card-heading">
                    <span className="gm-kicker">
                      TABLE DE JEU · EFFECTIF FIGÉ
                    </span>
                    <span>
                      {view.participants.filter((p) => p.connected).length} /{" "}
                      {view.participants.length} connectés
                    </span>
                  </div>
                  <h2>Effectif figé en régie</h2>
                  <p>
                    L’effectif est figé depuis la préparation. Une déconnexion
                    ne retire pas un joueur.
                  </p>
                  <p className="gm-note">
                    Un joueur hors ligne conserve son accès à la partie.
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => navigate("game")}
                  >
                    Revenir à la partie
                  </button>
                </section>
                <GmRoster view={gm} game={gm.game} />
              </div>
            </>
          ) : (
            <Roster view={gm} />
          )}
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
        {gm.game?.play && gm.game.definitionId === "undercover" && (
          <div
            className="gm-secondary gm-room-secondary"
            hidden={pane === "board"}
          >
            <GmPrivateInfo view={gm} game={gm.game} />
            <GmJournal view={gm} />
            <GmSettings
              view={gm}
              locked={locked}
              send={send}
              privateUrl={privateUrl}
              onOpenChange={setSettingsOpen}
            />
          </div>
        )}
      </div>
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

function GmSettings({
  view,
  locked,
  send,
  privateUrl,
  onOpenChange,
}: {
  view: GmSessionView;
  locked: boolean;
  send: Send;
  privateUrl: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const confirm = useConfirm();
  const [title, setTitle] = useState(view.title);
  return (
    <GmDisclosure
      title="Accès et réglages de la partie"
      className="gm-settings"
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <button
        type="button"
        className="secondary-button gm-settings-back"
        onClick={(e) => {
          const detail = e.currentTarget.closest("details");
          if (detail) detail.open = false;
        }}
      >
        Revenir à la partie
      </button>
      <div className="gm-settings-grid">
        <section className="gm-card">
          <span className="gm-kicker">IDENTITÉ DE L’ÉMISSION</span>
          <h2>Paramètres d’émission</h2>
          <form
            className="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send({ type: "session.rename", title });
            }}
          >
            <label>
              Nom de l’émission
              <input
                aria-label="Nouveau nom de l’émission"
                value={title}
                maxLength={32}
                required
                disabled={locked}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <small>{title.length} / 32 caractères</small>
            <button
              className="primary-button"
              disabled={locked || !title.trim()}
            >
              Renommer la session
            </button>
          </form>
        </section>
        <section className="gm-card">
          <span className="gm-kicker">ACCÈS CONFIDENTIEL</span>
          <h2>Lien privé de régie</h2>
          <p>Ne partagez pas cet accès avec les joueurs.</p>
          <CopyLink
            label="Accès privé GM — ne pas partager avec les joueurs"
            value={privateUrl}
            privateLink
            buttonLabel="Copier mon accès GM"
          />
        </section>
        <section className="gm-card gm-lifecycle">
          <h2>Zone de session</h2>
          {view.game && !view.game.play?.outcome && (
            <>
              <GmReplay game={view.game} locked={locked} send={send} />
              <p>
                Conserve les joueurs et leurs accès. Ouvre une confirmation.
              </p>
            </>
          )}
          <div className="gm-danger-zone">
            <button
              className="danger-button"
              disabled={locked}
              onClick={() =>
                void confirm({
                  title: "Réinitialiser le salon ?",
                  description:
                    "Tous les joueurs seront retirés et leurs accès révoqués. Cette action est irréversible.",
                  consequences: [
                    "Le salon sera vidé et l’invitation renouvelée.",
                  ],
                  confirmLabel: "Réinitialiser le salon",
                  tone: "danger",
                  presentation: "stitch",
                  onConfirm: () => send({ type: "session.reset" }),
                })
              }
            >
              Réinitialiser le salon
            </button>
            <p>
              Retire tous les joueurs et révoque leurs accès. Ouvre une
              confirmation.
            </p>
          </div>
        </section>
      </div>
    </GmDisclosure>
  );
}
