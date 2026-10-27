"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SessionView } from "@extension-twitch/contracts/sessions";
import { useSession, type SessionAudience } from "../lib/use-session";
import { findGame } from "../lib/demo";
import { GamePanel } from "./game-panel";
import { useLegacyTools } from "./legacy-tools";
import { ProductFrame } from "./product-frame";
import { CopyLink } from "./copy-link";
import { PublicSession } from "./public-session";
import { useConfirm } from "./ui/feedback";
import { Badge } from "./ui/primitives";
type RoomPane = "session" | "players" | "game" | "board";
const sections: { id: RoomPane; label: string }[] = [
  { id: "session", label: "Session" },
  { id: "players", label: "Joueurs" },
  { id: "game", label: "Jeu" },
  { id: "board", label: "Plateau" },
];
export function SessionRoom({
  id,
  audience,
}: {
  id: string;
  audience: SessionAudience;
}) {
  const legacyTools = useLegacyTools();
  const session = useSession(id, audience),
    confirm = useConfirm();
  const { view, connection, error, busy, retryAvailable, token } = session;
  const [title, setTitle] = useState(""),
    [pane, setPane] = useState<RoomPane>("session");
  const locked = busy || connection !== "connected" || retryAvailable;
  const connectionLabel =
    connection === "connected"
      ? "Synchronisé"
      : connection === "denied"
        ? "Accès indisponible"
        : connection === "reconnecting"
          ? "Reconnexion… Actions suspendues."
          : "Connexion à la session…";
  useEffect(() => {
    const sync = () => {
      const id = location.hash.slice(1);
      if (sections.some((s) => s.id === id)) setPane(id as RoomPane);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (view?.publicGame && !sections.some((s) => `#${s.id}` === location.hash))
      setPane("game");
  }, [view?.publicGame?.runId]);
  function navigate(next: RoomPane) {
    setPane(next);
    history.replaceState(null, "", `#${next}`);
    if (view?.publicGame && matchMedia("(max-width: 999px)").matches)
      window.scrollTo({ top: 0, behavior: "instant" });
    else document.getElementById(next)?.scrollIntoView();
  }
  if (audience === "public")
    return (
      <main className="public-session-page">
        <div className={`session-connection ${connection}`} role="status">
          {connectionLabel}
        </div>
        {error && (
          <p className="lobby-error" role="alert">
            {error}
          </p>
        )}
        {view ? (
          <PublicSession view={view} standalone />
        ) : (
          <p className="empty-lobby">En attente du plateau…</p>
        )}
      </main>
    );
  const gm = view?.audience === "gm" ? view : null;
  const me =
    view?.audience === "player"
      ? view.participants.find((p) => p.id === view.participantId)
      : null;
  const privateUrl =
    view && token
      ? `${gm ? new URL(gm.publicUrl).origin : window.location.origin}/sessions/${id}/${gm ? "gm" : `player/${me?.id}`}#access=${token}`
      : "";
  const playing = !!view?.publicGame;
  if (
    gm?.preparedGame?.definitionId === "undercover" &&
    !playing &&
    !legacyTools
  )
    return (
      <ProductFrame>
        <div
          className={`session-connection ${connection}`}
          role="status"
          data-testid="session-connection"
        >
          {connectionLabel}
        </div>
        <section className="lobby-heading">
          <span className="eyebrow">RÉGIE · PRÉPARATION</span>
          <h1>Invitez vos joueurs</h1>
          <p>
            Partagez l’invitation, puis préparez Undercover quand tous les
            joueurs sont présents.
          </p>
        </section>
        {error && (
          <p className="lobby-error" role="alert">
            {error}
          </p>
        )}
        {retryAvailable && (
          <button
            className="secondary-button"
            disabled={busy || connection !== "connected"}
            onClick={() => void session.send()}
          >
            Réessayer la commande
          </button>
        )}
        <section className="lobby-panel">
          <CopyLink label="Invitation des joueurs" value={gm.joinUrl} />
          <p className="invitation-code">
            Code : <strong>{gm.invitationCode}</strong>
          </p>
          <h2>{gm.participants.length} joueur(s) inscrit(s)</h2>
          <p>
            De 3 à 12 joueurs, avec moins d’Undercover que de civils. Les
            réglages choisis sont conservés.
          </p>
          <ParticipantList
            view={gm}
            disabled={locked}
            remove={(participantId) =>
              void confirm({
                title: "Retirer ce joueur ?",
                description:
                  "Son accès sera révoqué. Il devra être invité à nouveau pour revenir.",
                confirmLabel: "Retirer le joueur",
                tone: "danger",
                onConfirm: () =>
                  session.send({ type: "participant.remove", participantId }),
              })
            }
          />
          <button
            className="primary-button"
            disabled={
              locked ||
              gm.participants.length < 3 ||
              gm.participants.length > 12
            }
            onClick={() => void session.send({ type: "game.use-prepared" })}
          >
            Préparer la partie
          </button>
        </section>
        <details className="lobby-panel">
          <summary>Ma régie et mon plateau</summary>
          <CopyLink
            label="Accès privé GM — ne pas partager avec les joueurs"
            value={privateUrl}
            privateLink
          />
          <CopyLink
            label="Lien du plateau pour OBS ou un navigateur"
            value={gm.publicUrl}
          />
        </details>
      </ProductFrame>
    );
  return (
    <main className="session-shell session-room" data-playing={playing}>
      <header className="session-header">
        <Link className="session-brand" href="/">
          xt
          <span>
            Extension Twitch <small>STUDIO</small>
          </span>
        </Link>
        <Badge tone={gm ? "primary" : "success"}>
          {audience === "gm" ? "GAME MASTER" : "JOUEUR"}
        </Badge>
      </header>
      <nav className="room-navigation" aria-label="Navigation de la session">
        {(playing ? [sections[2]!, sections[1]!, sections[3]!] : sections).map(
          (s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={
                pane === s.id ||
                (playing && pane === "session" && s.id === "game")
                  ? "page"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                navigate(s.id);
              }}
            >
              {playing && s.id === "game" ? "Partie" : s.label}
            </a>
          ),
        )}
      </nav>
      <div
        className={`session-connection ${connection}`}
        role="status"
        data-testid="session-connection"
      >
        <span className="status-dot" />
        {connectionLabel}
      </div>
      {error && (
        <p className="lobby-error" role="alert">
          {error}
        </p>
      )}
      {retryAvailable && (
        <div className="lobby-warning">
          <p>
            Une commande attend sa confirmation. Réessayez pour obtenir son
            résultat sans la doubler.
          </p>
          <button
            className="secondary-button"
            disabled={busy || connection !== "connected"}
            onClick={() => void session.send()}
          >
            Réessayer la commande
          </button>
        </div>
      )}
      {!view && (
        <section className="lobby-panel">
          <h1>
            {connection === "denied"
              ? "Votre accès privé est nécessaire"
              : "Ouverture du salon…"}
          </h1>
          <p>
            Utilisez le lien privé de récupération dans ce navigateur. Pour une
            nouvelle inscription, demandez une invitation au GM.
          </p>
          <Link className="text-link" href="/">
            Retour à l’accueil
          </Link>
        </section>
      )}
      {view && (
        <>
          <section className="lobby-heading room-context" id="session">
            {playing ? (
              <>
                <h1>{view.publicGame!.title}</h1>
                {view.title !== view.publicGame!.title && (
                  <p className="lobby-hint">{view.title}</p>
                )}
              </>
            ) : (
              <>
                <span className="eyebrow">{findGame(view.gameId).title}</span>
                <h1>{view.title}</h1>
              </>
            )}
            <div className="room-context-meta">
              <Badge
                tone={
                  view.publicGame?.play
                    ? view.publicGame.play.outcome
                      ? "info"
                      : !view.publicGame.play.dealt
                        ? "primary"
                        : view.publicGame.play.ballot?.status === "open"
                          ? "vote"
                          : "success"
                    : "neutral"
                }
              >
                {view.publicGame?.phase.label ?? "Salon d’attente"}
              </Badge>
              <Badge>{view.participants.length} joueurs</Badge>
            </div>
            {!playing && (
              <p>
                {gm
                  ? "Vos invités rejoignent le plateau en temps réel."
                  : `Bienvenue ${me?.name ?? "sur le plateau"}. Votre identité est personnelle à cet accès.`}
              </p>
            )}
          </section>
          {playing && (
            <div
              className="room-pane"
              data-active={pane === "game"}
              data-room-pane="game"
            >
              <GamePanel view={view} locked={locked} send={session.send} />
            </div>
          )}
          <div
            className="room-pane"
            data-active={pane === "session" || (playing && pane === "game")}
            data-room-pane="session"
          >
            <details
              className="room-settings"
              open={!playing || pane === "session" ? true : undefined}
            >
              <summary hidden={!playing}>
                Accès et réglages de la partie
              </summary>
              {gm ? (
                <section className="lobby-panel">
                  <h2>Inviter et observer</h2>
                  <details className="room-session-details">
                    <summary>Informations de la session</summary>
                    <span className="lobby-hint">
                      Mise à jour {view.version} ·{" "}
                      {playing
                        ? "Joueurs inscrits pour cette partie"
                        : view.admissionOpen
                          ? "Invitations ouvertes"
                          : "Invitations fermées"}
                    </span>
                  </details>
                  {playing && (
                    <p>
                      La partie est préparée : les inscriptions sont fermées
                      pour cette partie. Rejouer conserve les joueurs.
                    </p>
                  )}
                  <CopyLink label="Invitation des joueurs" value={gm.joinUrl} />
                  <p className="invitation-code">
                    Code : <strong>{gm.invitationCode}</strong>
                  </p>
                  <a
                    className="secondary-button"
                    href={gm.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir le plateau public ↗
                  </a>
                  <CopyLink
                    label="Lien du plateau pour OBS ou un navigateur"
                    value={gm.publicUrl}
                  />
                  <details>
                    <summary>Conserver mon accès Game Master</summary>
                    <p>
                      Ce lien donne le contrôle de la session. Gardez-le pour
                      vous ; il permet de retrouver la régie sur un autre
                      appareil.
                    </p>
                    <CopyLink
                      label="Accès privé GM — ne pas partager avec les joueurs"
                      value={privateUrl}
                      privateLink
                    />
                  </details>
                </section>
              ) : (
                <section className="lobby-panel player-action">
                  {!view.publicGame?.play && (
                    <>
                      <h2>
                        {me?.ready
                          ? "Vous êtes prêt."
                          : "Prêt à rejoindre le show ?"}
                      </h2>
                      <p>
                        Ce statut est envoyé au serveur et visible par le GM et
                        les spectateurs.
                      </p>
                      <button
                        className="primary-button"
                        disabled={locked}
                        onClick={() =>
                          void session.send({
                            type: "participant.ready",
                            ready: !me?.ready,
                          })
                        }
                      >
                        {busy
                          ? "Enregistrement…"
                          : me?.ready
                            ? "Je ne suis plus prêt"
                            : "Je suis prêt"}
                      </button>
                      <p className="lobby-hint">
                        Les informations privées de l’expérience apparaissent
                        dans la section Jeu.
                      </p>
                    </>
                  )}
                  <details>
                    <summary>Conserver mon accès joueur</summary>
                    <CopyLink
                      label="Lien privé joueur — ne pas partager"
                      value={privateUrl}
                      privateLink
                    />
                  </details>
                </section>
              )}
              {!playing && (
                <GamePanel view={view} locked={locked} send={session.send} />
              )}
              {gm && (
                <section className="lobby-panel">
                  <h2>Préparation de la session</h2>
                  <form
                    className="lobby-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void session.send({ type: "session.rename", title });
                    }}
                  >
                    <label>
                      Nouveau nom de l’émission
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={32}
                        disabled={locked}
                      />
                    </label>
                    <button
                      className="secondary-button"
                      disabled={locked || !title.trim()}
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
                        consequences: [
                          "L’invitation sera renouvelée.",
                          "Votre accès GM et le lien public seront conservés.",
                        ],
                        confirmLabel: "Réinitialiser le salon",
                        tone: "danger",
                        onConfirm: () =>
                          session.send({ type: "session.reset" }),
                      })
                    }
                  >
                    Réinitialiser le salon
                  </button>
                </section>
              )}
              <section className="lobby-panel">
                <h2>Journal de la session</h2>
                <ol className="session-events">
                  {[...view.events].reverse().map((e) => (
                    <li key={e.version}>
                      <span>#{e.version}</span>
                      <p>{e.message}</p>
                      <time dateTime={e.at}>
                        {new Date(e.at).toLocaleTimeString("fr", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </li>
                  ))}
                </ol>
                <p className="lobby-hint">
                  Les 20 derniers événements. La présence réseau est éphémère ;
                  elle ne modifie pas la version persistée.
                </p>
              </section>
              <aside className="lobby-scope">
                <strong>Ce qui reste à venir</strong>
                <p>
                  Undercover dispose d’une variante jouable avec distribution,
                  votes et victoire. Enchères et Qui est l’espion restent à
                  construire. Aucun paiement ni connexion Twitch.
                </p>
              </aside>
            </details>
          </div>
          <section
            className="lobby-panel room-pane"
            id="players"
            data-active={pane === "players"}
            data-room-pane="players"
          >
            <h2>
              Les invités{" "}
              <span className="count-badge">{view.participants.length}</span>
            </h2>
            <ParticipantList
              view={view}
              disabled={locked}
              remove={
                gm && !playing
                  ? (participantId) => {
                      void confirm({
                        title: "Retirer ce joueur ?",
                        description:
                          "Son accès sera révoqué. Il devra être invité à nouveau pour revenir.",
                        confirmLabel: "Retirer le joueur",
                        tone: "danger",
                        onConfirm: () =>
                          session.send({
                            type: "participant.remove",
                            participantId,
                          }),
                      });
                    }
                  : undefined
              }
            />
          </section>
          <section
            id="board"
            className="lobby-board room-pane"
            data-active={pane === "board"}
            data-room-pane="board"
          >
            <h2>Le plateau public</h2>
            {gm && view.gameId === "undercover" && (
              <Link
                className="secondary-button"
                href={`/sessions/${id}/overlay`}
              >
                Personnaliser l’overlay
              </Link>
            )}
            <PublicSession view={view} />
          </section>
          {gm && !playing && (
            <div className="room-actions">
              <>
                <button
                  className="primary-button"
                  disabled={locked}
                  onClick={() =>
                    void session.send({
                      type: "session.admission",
                      open: !gm.admissionOpen,
                    })
                  }
                >
                  {busy
                    ? "Enregistrement…"
                    : gm.admissionOpen
                      ? "Fermer les invitations"
                      : "Ouvrir les invitations"}
                </button>
                <a
                  className="secondary-button"
                  href={gm.joinUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Invitation ↗
                </a>
              </>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function ParticipantList({
  view,
  disabled,
  remove,
}: {
  view: SessionView;
  disabled: boolean;
  remove: ((id: string) => void) | undefined;
}) {
  return (
    <>
      {view.participants.length === 0 && (
        <p className="empty-lobby">
          Aucun invité pour le moment. Partagez l’invitation.
        </p>
      )}
      <ul className="lobby-players">
        {view.participants.map((player) => (
          <li key={player.id}>
            <span className="avatar">
              {[...player.name].slice(0, 2).join("").toLocaleUpperCase("fr")}
            </span>
            <div>
              <strong>{player.name}</strong>
              <span>
                {view.publicGame?.play
                  ? !view.publicGame.play.dealt
                    ? "En attente"
                    : view.publicGame.play.roster.find(
                          (p) => p.id === player.id,
                        )?.active
                      ? "En jeu"
                      : "Éliminé"
                  : player.ready
                    ? "Prêt"
                    : "En préparation"}{" "}
                · {player.connected ? "Connecté" : "Hors ligne"}
              </span>
            </div>
            {remove && (
              <button
                className="secondary-button"
                disabled={disabled}
                aria-label={`Retirer ${player.name}`}
                onClick={() => remove(player.id)}
              >
                Retirer
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
