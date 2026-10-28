"use client";
import { useEffect, useState } from "react";
import type {
  GmSessionView,
  LobbyAction,
} from "@extension-twitch/contracts/sessions";
import { CopyLink } from "./copy-link";
import { useConfirm } from "./ui/feedback";
import { HomeIcon } from "./home-icon";
import {
  SessionFeedback,
  StitchDisclosure,
  StitchHeader,
  type SessionFeedbackProps,
} from "./stitch-frame";

type Props = Omit<SessionFeedbackProps, "send"> & {
  view: GmSessionView;
  privateUrl: string;
  send: (action?: LobbyAction) => Promise<boolean>;
};
export function StitchLobby({ view, privateUrl, send, ...feedback }: Props) {
  const confirm = useConfirm();
  const min = view.preparedGame?.minimumPlayers ?? 3;
  const max = view.preparedGame?.maximumPlayers ?? 12;
  const count = view.participants.length;
  const valid = count >= min && count <= max;
  const locked =
    feedback.busy ||
    feedback.retryAvailable ||
    feedback.connection !== "connected";
  const rounds = view.preparedGame?.clueRounds;
  return (
    <main
      className="stitch-page stitch-lobby"
      data-experience="salon"
      data-ready={valid}
    >
      <StitchHeader host />
      <div className="stitch-lobby-content">
        <SessionFeedback {...feedback} send={() => send()} />
        <div className="stitch-lobby-title">
          <div>
            <span className="stitch-kicker">UNDERCOVER</span>
            <h1>Votre salon</h1>
            <p>Invitez vos joueurs, puis préparez la partie.</p>
          </div>
          <div className="stitch-counters">
            <span className="stitch-pill">
              {count} {count === 1 ? "joueur inscrit" : "joueurs inscrits"}
            </span>
            <small>
              {view.participants.filter((p) => p.connected).length} connecté(s)
            </small>
          </div>
        </div>
        <div className="stitch-lobby-grid">
          <section
            className="stitch-card stitch-invitation"
            aria-label="Inviter les joueurs"
          >
            <h2 className="stitch-kicker">INVITATION DIRECTE</h2>
            {!view.admissionOpen && (
              <p className="stitch-hint">
                Les invitations sont fermées. Vous pouvez les rouvrir dans Gérer
                les invités.
              </p>
            )}
            <CopyLink
              label="Invitation des joueurs"
              value={view.joinUrl}
              buttonLabel="Copier le lien d’invitation"
            />
            <div className="stitch-code invitation-code">
              <span>Code de salon</span>
              <strong>{view.invitationCode}</strong>
            </div>
            <ShareInvitation url={view.joinUrl} />
          </section>
          <section className="stitch-card stitch-participants">
            <div className="stitch-card-title">
              <h2 className="stitch-kicker">JOUEURS INSCRITS</h2>
              <span>{count} au total</span>
            </div>
            <LobbyRoster view={view} />
            {count > 0 && (
              <p className="stitch-hint">
                Le statut « Prêt » est indicatif. Les joueurs hors ligne restent
                inscrits.
              </p>
            )}
          </section>
          <div className="stitch-lobby-settings">
            <StitchDisclosure title="Gérer les invités">
              <LobbyRoster
                view={view}
                disabled={locked}
                remove={(participantId) =>
                  void confirm({
                    title: "Retirer ce joueur ?",
                    description:
                      "Son accès sera révoqué. Il devra être invité à nouveau pour revenir.",
                    confirmLabel: "Retirer le joueur",
                    tone: "danger",
                    onConfirm: () =>
                      send({ type: "participant.remove", participantId }),
                  })
                }
              />
              <button
                className="stitch-button"
                disabled={locked}
                onClick={() =>
                  void send({
                    type: "session.admission",
                    open: !view.admissionOpen,
                  })
                }
              >
                {view.admissionOpen
                  ? "Fermer les invitations"
                  : "Ouvrir les invitations"}
              </button>
            </StitchDisclosure>
            <StitchDisclosure title="Ma régie et mon plateau" icon="screen">
              <CopyLink
                label="Accès privé GM — ne pas partager avec les joueurs"
                value={privateUrl}
                privateLink
              />
              <CopyLink
                label="Source OBS transparente"
                value={`${new URL(view.publicUrl).origin}/sessions/${view.sessionId}/obs`}
              />
            </StitchDisclosure>
          </div>
          <section
            className="stitch-lobby-prepare stitch-card"
            aria-label="Configuration de la partie"
          >
            <div>
              <span className="stitch-kicker">
                {valid ? "CONFIGURATION PRÊTE" : "CONFIGURATION PRÉVUE"}
              </span>
              <p>
                {count > 0 && `${count} joueurs · `}Classique
                {rounds
                  ? ` · ${rounds} tour${rounds > 1 ? "s" : ""} d’indices`
                  : " · Réglages enregistrés"}
              </p>
            </div>
            <div>
              <button
                className="stitch-button stitch-primary"
                disabled={locked || !valid}
                aria-busy={feedback.busy}
                aria-describedby="lobby-prepare-hint"
                onClick={() => void send({ type: "game.use-prepared" })}
              >
                <HomeIcon name="arrow" />
                {feedback.busy ? "Préparation…" : "Préparer la partie"}
              </button>
              <p id="lobby-prepare-hint" className="stitch-hint">
                {valid
                  ? "Ferme les inscriptions. Les mots seront distribués ensuite."
                  : `Prévoyez ${min} à ${max} joueurs inscrits pour cette répartition.`}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
export function LobbyRoster({
  view,
  remove,
  disabled = false,
}: {
  view: Pick<GmSessionView, "participants">;
  remove?: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="stitch-roster lobby-players">
      {view.participants.map((p) => (
        <li key={p.id}>
          <span className="stitch-avatar" aria-hidden="true">
            {p.name.slice(0, 1).toLocaleUpperCase("fr")}
          </span>
          <div>
            <strong>{p.name}</strong>
            <small className={p.connected ? "stitch-online" : ""}>
              {p.connected ? "Connecté" : "Hors ligne"}
            </small>
          </div>
          <span className={`stitch-pill ${p.ready ? "stitch-ready" : ""}`}>
            {p.ready ? "Prêt" : "En préparation"}
          </span>
          {remove && (
            <button
              className="stitch-button"
              disabled={disabled}
              aria-label={`Retirer ${p.name}`}
              onClick={() => remove(p.id)}
            >
              Retirer
            </button>
          )}
        </li>
      ))}
      {view.participants.length === 0 && (
        <li className="stitch-empty">
          <HomeIcon name="people" />
          <strong>Vos joueurs apparaîtront ici.</strong>
          <p>
            Partagez le lien d’invitation pour leur permettre de rejoindre la
            partie.
          </p>
        </li>
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
    <div className="stitch-share">
      <button
        className="stitch-button"
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
    </div>
  );
}
