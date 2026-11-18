"use client";

import type { StudioSessionView } from "@extension-twitch/contracts/sessions";
import { useMemo, useState } from "react";
import "../app/studio-return.css";

export interface StudioChatMessage {
  id: string;
  author: string;
  message: string;
}

function connectionLabel(connection: string) {
  if (connection === "connected" || connection === "preview")
    return "Synchronisé";
  if (connection === "reconnecting") return "Reconnexion…";
  if (connection === "denied") return "Plateau indisponible";
  return "Connexion…";
}

export function StudioReturnCanvas({
  view,
  connection,
  error = "",
  rehearsal = false,
  initialChat = false,
  chatMessages = [],
}: {
  view: StudioSessionView | null;
  connection: string;
  error?: string;
  rehearsal?: boolean;
  initialChat?: boolean;
  chatMessages?: StudioChatMessage[];
}) {
  const [chatVisible, setChatVisible] = useState(initialChat);
  const [page, setPage] = useState(0);
  const game = view?.studioGame;
  const reveal = game?.outcome ? (game.reveal ?? []) : [];
  const pageSize = reveal.length === 6 ? 6 : 3;
  const pages = Math.max(1, Math.ceil(reveal.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const visibleCards = reveal.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );
  const active =
    view?.participants.filter((player) => player.active).length ?? 0;
  const name = (participantId?: string) =>
    view?.participants.find((player) => player.id === participantId)?.name ??
    "Joueur";
  const state = useMemo(() => {
    if (game?.outcome) return "reveal";
    if (game?.ballot?.status === "open") return "vote";
    if (game?.ballot?.status === "resolved") return "result";
    if (game?.phase.id === "discussion") return "discussion";
    if (!game?.dealt) return "waiting";
    return "transition";
  }, [game]);
  const phase =
    state === "reveal"
      ? "Révélation finale"
      : state === "vote"
        ? "Vote du plateau"
        : state === "result"
          ? game?.ballot?.tied
            ? "Égalité"
            : "Résultat du vote"
          : state === "discussion"
            ? "Discussion"
            : state === "waiting"
              ? "Attente"
              : "Transition";
  const instruction =
    state === "vote"
      ? `${game?.ballot?.received ?? 0} votes reçus sur ${game?.ballot?.total ?? 0}`
      : state === "result"
        ? game?.ballot?.tied
          ? "Égalité : personne n’est éliminé."
          : `${name(game?.ballot?.eliminated)} quitte la partie. Son rôle reste secret.`
        : state === "discussion" && game?.turns?.current
          ? `À ${name(game.turns.current)} de donner son indice`
          : state === "transition"
            ? `La discussion reprend · ${active} joueurs encore en jeu`
            : "La partie va commencer";
  const showChat = chatVisible && state !== "reveal";

  return (
    <main
      className={`studio-return ${showChat ? "studio-with-chat" : "studio-full-video"}`}
      data-testid="studio-return"
      data-state={state}
      data-rehearsal={rehearsal}
      data-version={view?.version ?? 0}
    >
      <div className="studio-video" aria-label="Zone du retour caméra">
        <div className="studio-video-neutral">
          <span>RETOUR CAMÉRA</span>
          <small>Aucune source vidéo navigateur configurée</small>
        </div>
      </div>
      <header className="studio-topbar">
        <div className="studio-brand">
          <span className="studio-mask" aria-hidden="true">
            ◒
          </span>
          <strong>UNDERCOVER</strong>
        </div>
        <div className="studio-phase">
          <strong>{phase}</strong>
          {game?.turns && (
            <span>
              TOUR {game.turns.round}/{game.turns.total}
            </span>
          )}
        </div>
        <div className="studio-status">
          <span>{view?.participants.length ?? 0} JOUEURS</span>
          <span className={`studio-sync ${connection}`}>
            <i /> {connectionLabel(connection)}
          </span>
        </div>
      </header>

      {state !== "reveal" && (
        <section className="studio-lower" aria-live="polite">
          <span>
            {state === "discussion" ? "JOUEUR ACTIF" : "ÉTAT DU PLATEAU"}
          </span>
          {state === "discussion" && game?.turns?.current && (
            <h1>{name(game.turns.current)}</h1>
          )}
          <p>{instruction}</p>
        </section>
      )}

      {state === "reveal" && (
        <section
          className="studio-reveal"
          aria-label="Révélation finale durable"
        >
          <div className="studio-reveal-heading">
            <span>DÉNOUEMENT VALIDÉ</span>
            <h1>{game?.outcome?.label}</h1>
            <p>Cet écran reste affiché jusqu’à l’action du Game Master.</p>
          </div>
          <div className="studio-reveal-grid" data-player-count={reveal.length}>
            {visibleCards.map((card, index) => (
              <article
                key={card.participantId}
                data-testid="studio-reveal-card"
              >
                <div className="studio-card-number">
                  {String(currentPage * pageSize + index + 1).padStart(2, "0")}
                </div>
                <strong title={card.name}>{card.name}</strong>
                <span title={card.content.label}>{card.content.label}</span>
                <small>{card.role}</small>
              </article>
            ))}
          </div>
          {pages > 1 && (
            <div className="studio-pagination">
              <button
                aria-label="Groupe précédent"
                disabled={currentPage === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
              >
                ‹
              </button>
              <span>
                Groupe {currentPage + 1} sur {pages}
              </span>
              <button
                aria-label="Groupe suivant"
                disabled={currentPage === pages - 1}
                onClick={() =>
                  setPage((value) => Math.min(pages - 1, value + 1))
                }
              >
                ›
              </button>
            </div>
          )}
        </section>
      )}

      {showChat && (
        <aside className="studio-chat" aria-label="Chat Twitch">
          <header>
            <span>CHAT TWITCH</span>
            <strong>{rehearsal ? "RÉPÉTITION" : "EN DIRECT"}</strong>
          </header>
          {chatMessages.length ? (
            <ol>
              {chatMessages.map((message) => (
                <li key={message.id}>
                  <strong>@{message.author}</strong>
                  <p>{message.message}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="studio-chat-empty">
              <strong>Chat momentanément indisponible</strong>
              <p>Le retour du jeu continue normalement.</p>
            </div>
          )}
        </aside>
      )}
      {state !== "reveal" && (
        <button
          className="studio-chat-toggle"
          onClick={() => setChatVisible((visible) => !visible)}
        >
          {showChat ? "Masquer le chat" : "Afficher le chat"}
        </button>
      )}
      <footer>
        <span>
          {rehearsal ? "Répétition avant direct" : "Retour Studio"} ·
          Informations partagées avec le plateau
        </span>
        <span>1920×1080 · 16:9</span>
      </footer>
      {(connection === "reconnecting" || error) && (
        <div className="studio-reconnecting" role="status">
          <strong>
            {error ? "Plateau momentanément indisponible" : "Reconnexion…"}
          </strong>
          <p>Les informations du plateau vont se remettre à jour.</p>
        </div>
      )}
    </main>
  );
}
