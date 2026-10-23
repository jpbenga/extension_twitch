"use client";

import Link from "next/link";
import { useState } from "react";
import type { SessionView } from "@extension-twitch/contracts/sessions";
import { useSession, type SessionAudience } from "../lib/use-session";
import { findGame } from "../lib/demo";
import { GamePanel } from "./game-panel";
import { CopyLink } from "./copy-link";
import { PublicSession } from "./public-session";

export function SessionRoom({
  id,
  audience,
}: {
  id: string;
  audience: SessionAudience;
}) {
  const session = useSession(id, audience);
  const { view, connection, error, busy, notice, retryAvailable, token } =
    session;
  const [title, setTitle] = useState("");
  const locked = busy || connection !== "connected" || retryAvailable;
  const connectionLabel =
    connection === "connected"
      ? "Synchronisé"
      : connection === "denied"
        ? "Accès indisponible"
        : connection === "reconnecting"
          ? "Reconnexion… Actions suspendues."
          : "Connexion à la session…";

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
      ? view.participants.find((player) => player.id === view.participantId)
      : null;
  const privateUrl =
    view && token
      ? `${gm ? new URL(gm.publicUrl).origin : window.location.origin}/sessions/${id}/${gm ? "gm" : `player/${me?.id}`}#access=${token}`
      : "";

  return (
    <main className="session-shell session-room">
      <header className="session-header">
        <Link className="session-brand" href="/">
          xt
          <span>
            Extension Twitch <small>STUDIO</small>
          </span>
        </Link>
        <span className="role-badge">
          {audience === "gm" ? "GAME MASTER" : "JOUEUR"}
        </span>
      </header>
      <nav className="room-navigation" aria-label="Navigation de la session">
        <a href="#session">Session</a>
        <a href="#players">Joueurs</a>
        <a href="#game">Jeu</a>
        <a href="#board">Plateau</a>
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
      {notice && (
        <p className="lobby-notice" role="status">
          {notice}
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
          <section className="lobby-heading" id="session">
            <span className="eyebrow">
              {view.publicGame?.title ?? findGame(view.gameId).title} ·{" "}
              {view.publicGame?.phase.label ?? "SALON D’ATTENTE"}
            </span>
            <h1>{view.title}</h1>
            <p>
              {gm
                ? "Vos invités rejoignent le plateau en temps réel."
                : `Bienvenue ${me?.name ?? "sur le plateau"}. Votre identité est personnelle à cet accès.`}
            </p>
            <span className="lobby-hint">
              Version {view.version} ·{" "}
              {view.publicGame
                ? "Effectif figé pour cette expérience"
                : view.admissionOpen
                  ? "Invitations ouvertes"
                  : "Invitations fermées"}
            </span>
          </section>
          {view.publicGame && (
            <GamePanel view={view} locked={locked} send={session.send} />
          )}
          {gm ? (
            <section className="lobby-panel">
              <h2>Inviter et observer</h2>
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
                  Ce lien donne le contrôle de la session. Gardez-le pour vous ;
                  il permet de retrouver la régie sur un autre appareil.
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
              <h2>
                {me?.ready ? "Vous êtes prêt." : "Prêt à rejoindre le show ?"}
              </h2>
              <p>
                Ce statut est envoyé au serveur et visible par le GM et les
                spectateurs.
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
                Les informations privées de l’expérience apparaissent dans la
                section Jeu.
              </p>
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
          {!view.publicGame && (
            <GamePanel view={view} locked={locked} send={session.send} />
          )}
          <section className="lobby-panel" id="players">
            <h2>
              Les invités{" "}
              <span className="count-badge">{view.participants.length}</span>
            </h2>
            <ParticipantList
              view={view}
              disabled={locked}
              remove={
                gm && !view.publicGame
                  ? (participantId) => {
                      if (
                        window.confirm(
                          "Retirer ce joueur et révoquer son accès ?",
                        )
                      )
                        void session.send({
                          type: "participant.remove",
                          participantId,
                        });
                    }
                  : undefined
              }
            />
          </section>
          {gm && (
            <section className="lobby-panel">
              <h2>Préparation de la session</h2>
              <form
                className="lobby-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void session.send({ type: "session.rename", title });
                }}
              >
                <label>
                  Nouveau nom de l’émission
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
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
                onClick={() => {
                  if (
                    window.confirm(
                      "Réinitialiser le salon ? Tous les joueurs seront retirés, leurs accès révoqués et l’invitation renouvelée. Votre accès GM et le lien public seront conservés.",
                    )
                  )
                    void session.send({ type: "session.reset" });
                }}
              >
                Réinitialiser le salon
              </button>
            </section>
          )}
          <section id="board" className="lobby-board">
            <h2>Le plateau public</h2>
            <PublicSession view={view} />
          </section>
          <section className="lobby-panel">
            <h2>Journal de la session</h2>
            <ol className="session-events">
              {[...view.events].reverse().map((event) => (
                <li key={event.version}>
                  <span>#{event.version}</span>
                  <p>{event.message}</p>
                  <time dateTime={event.at}>
                    {new Date(event.at).toLocaleTimeString("fr", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ol>
            <p className="lobby-hint">
              Les 20 derniers événements. La présence réseau est éphémère ; elle
              ne modifie pas la version persistée.
            </p>
          </section>
          <aside className="lobby-scope">
            <strong>Ce qui reste à venir</strong>
            <p>
              Les jeux officiels, votes, distribution aléatoire et conditions de
              victoire restent à construire. Les exemples utilisent le moteur
              réel. Aucun paiement ni connexion Twitch.
            </p>
          </aside>
          {gm && (
            <div className="room-actions">
              <button
                className="primary-button"
                disabled={locked || !!view.publicGame}
                onClick={() =>
                  void session.send({
                    type: "session.admission",
                    open: !gm.admissionOpen,
                  })
                }
              >
                {busy
                  ? "Enregistrement…"
                  : view.publicGame
                    ? "Effectif figé pour la partie"
                    : gm.admissionOpen
                      ? "Fermer les invitations"
                      : "Ouvrir les invitations"}
              </button>
              <a
                className="secondary-button"
                href={view.publicGame ? "#game" : gm.joinUrl}
                target={view.publicGame ? undefined : "_blank"}
                rel="noreferrer"
              >
                {view.publicGame ? "Commandes du jeu" : "Invitation ↗"}
              </a>
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
                {player.ready ? "Prêt" : "En préparation"} ·{" "}
                {player.connected ? "Connecté" : "Hors ligne"}
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
