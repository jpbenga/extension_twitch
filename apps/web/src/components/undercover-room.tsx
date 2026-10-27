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
    gm = view.audience === "gm" ? view : null,
    me =
      view.audience === "player"
        ? view.participants.find((p) => p.id === view.participantId)
        : null;
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
  if (!gm)
    return (
      <main
        className="session-shell experience-shell companion-shell"
        data-experience="player"
      >
        {head}
        {feedback}
        <div className="companion-identity">
          <div>
            <span className="eyebrow">UNDERCOVER</span>
            <h1>{me?.name ?? "Votre partie"}</h1>
            {view.title !== "Undercover" && (
              <p className="lobby-hint">{view.title}</p>
            )}
          </div>
          <Badge
            tone={
              play?.roster.find((p) => p.id === me?.id)?.active === false
                ? "vote"
                : "success"
            }
          >
            {!play?.dealt
              ? "En attente"
              : play.roster.find((p) => p.id === me?.id)?.active === false
                ? "Éliminé"
                : "En jeu"}
          </Badge>
        </div>
        {playing ? (
          <GamePanel view={view} locked={locked} send={send} />
        ) : (
          <section className="lobby-panel">
            <h2>
              {me?.ready ? "Vous êtes prêt." : "Bienvenue dans la partie"}
            </h2>
            <p>
              Le Game Master prépare Undercover. Gardez cette page ouverte :
              votre mot apparaîtra ici.
            </p>
            <button
              className="primary-button"
              disabled={locked}
              onClick={() =>
                void send({ type: "participant.ready", ready: !me?.ready })
              }
            >
              {me?.ready ? "Je ne suis plus prêt" : "Je suis prêt"}
            </button>
          </section>
        )}
        {!playing && (
          <details className="operation-secondary">
            <summary>Qui participe ?</summary>
            <Roster view={view} />
          </details>
        )}
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
  const minimumPlayers = gm?.preparedGame?.minimumPlayers ?? 3,
    maximumPlayers = gm?.preparedGame?.maximumPlayers ?? 12;
  if (!playing && gm.preparedGame)
    return (
      <main className="session-shell experience-shell" data-experience="salon">
        {head}
        {feedback}
        <div className="saloon-intro">
          <div>
            <span className="eyebrow">UNDERCOVER</span>
            <h1>Votre salon</h1>
            <p>Invitez vos joueurs, puis préparez la partie.</p>
          </div>
        </div>
        <div className="saloon-main">
          <section>
            <CopyLink
              label="Invitation des joueurs"
              value={gm.joinUrl}
              buttonLabel="Copier le lien d’invitation"
            />
            <ShareInvitation url={gm.joinUrl} />
            <p className="invitation-code">
              Code : <strong>{gm.invitationCode}</strong>
            </p>
            <div className="saloon-count">
              {gm.participants.length} joueur(s) inscrit(s)
            </div>
            <p className="lobby-hint">
              {gm.participants.filter((p) => p.connected).length} connecté(s)
              actuellement. Le statut Prêt est un repère, pas une obligation.
            </p>
            <Roster view={gm} />
            <button
              className="primary-button"
              disabled={
                locked ||
                gm.participants.length < minimumPlayers ||
                gm.participants.length > maximumPlayers
              }
              onClick={() => void send({ type: "game.use-prepared" })}
            >
              Préparer la partie
            </button>
            <p className="lobby-hint">
              {minimumPlayers}–{maximumPlayers} joueurs pour votre répartition.
              Cette étape ferme les inscriptions ; vous distribuerez les mots
              juste après.
            </p>
          </section>
          <aside>
            <details className="operation-secondary">
              <summary>Gérer les invités</summary>
              <Roster
                view={gm}
                remove={(id) =>
                  void confirm({
                    title: "Retirer ce joueur ?",
                    description:
                      "Son accès sera révoqué. Il devra être invité à nouveau pour revenir.",
                    confirmLabel: "Retirer le joueur",
                    tone: "danger",
                    onConfirm: () =>
                      send({ type: "participant.remove", participantId: id }),
                  })
                }
                disabled={locked}
              />
              <button
                className="secondary-button"
                disabled={locked}
                onClick={() =>
                  void send({
                    type: "session.admission",
                    open: !gm.admissionOpen,
                  })
                }
              >
                {gm.admissionOpen
                  ? "Fermer les invitations"
                  : "Ouvrir les invitations"}
              </button>
            </details>
            <details className="operation-secondary">
              <summary>Ma régie et mon plateau</summary>
              <CopyLink
                label="Accès privé GM — ne pas partager avec les joueurs"
                value={privateUrl}
                privateLink
              />
              <CopyLink
                label="Source OBS transparente"
                value={`${new URL(gm.publicUrl).origin}/sessions/${view.sessionId}/obs`}
              />
            </details>
          </aside>
        </div>
      </main>
    );
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
function ShareInvitation({ url }: { url: string }) {
  const [available, setAvailable] = useState(false),
    [error, setError] = useState("");
  useEffect(() => setAvailable(typeof navigator.share === "function"), []);
  if (!available) return null;
  return (
    <>
      <button
        className="secondary-button"
        onClick={async () => {
          try {
            await navigator.share({
              title: "Rejoindre ma partie Undercover",
              url,
            });
            setError("");
          } catch (e) {
            if (!(e instanceof DOMException && e.name === "AbortError"))
              setError(
                "Le partage n’a pas abouti. Utilisez Copier le lien d’invitation.",
              );
          }
        }}
      >
        Partager l’invitation
      </button>
      {error && <p role="status">{error}</p>}
    </>
  );
}
