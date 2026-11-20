"use client";

import type { StudioSessionView } from "@extension-twitch/contracts/sessions";
import { createUndercoverTvLayout } from "@extension-twitch/contracts/undercover-layout";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { twitchChatEmbedUrl } from "@extension-twitch/contracts/twitch";
import { UndercoverTvMask } from "./undercover-tv-overlay.js";
import "../app/broadcast-tv.css";
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
  twitchChannel = "",
}: {
  view: StudioSessionView | null;
  connection: string;
  error?: string;
  rehearsal?: boolean;
  initialChat?: boolean;
  chatMessages?: StudioChatMessage[];
  twitchChannel?: string;
}) {
  const [chatVisible, setChatVisible] = useState(initialChat);
  const [page, setPage] = useState(0);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [videoError, setVideoError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const studioLayout = createUndercoverTvLayout();
  const position = (
    id: "header" | "phase" | "round" | "players" | "vote" | "result",
  ): CSSProperties => {
    const rect = studioLayout.widgets[id];
    return {
      left: `${rect.x / 19.2}%`,
      top: `${rect.y / 10.8}%`,
      width: `${rect.width / 19.2}%`,
      height: `${rect.height / 10.8}%`,
    };
  };
  const speaker =
    state === "discussion" && game?.turns?.current
      ? game.turns.current
      : undefined;
  const speakerSlot = speaker
    ? (view?.participants.findIndex((player) => player.id === speaker) ?? -1) +
      1
    : 0;

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = videoStream;
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [videoStream]);

  useEffect(
    () => () => videoStream?.getTracks().forEach((track) => track.stop()),
    [videoStream],
  );

  async function selectVideoSource(source: "display" | "camera") {
    setVideoError("");
    try {
      const media = navigator.mediaDevices;
      const stream =
        source === "display"
          ? await media?.getDisplayMedia?.({ video: true, audio: false })
          : await media?.getUserMedia?.({
              video: { aspectRatio: 16 / 9 },
              audio: false,
            });
      if (!stream) throw new Error("unsupported");
      videoStream?.getTracks().forEach((track) => track.stop());
      const [track] = stream.getVideoTracks();
      track?.addEventListener("ended", () => setVideoStream(null), {
        once: true,
      });
      setVideoStream(stream);
    } catch (failure) {
      if (
        failure instanceof DOMException &&
        (failure.name === "NotAllowedError" || failure.name === "AbortError")
      )
        setVideoError(
          "Sélection annulée. Choisissez une source pour afficher le retour vidéo.",
        );
      else
        setVideoError(
          "Cette source vidéo n’est pas disponible. Ouvrez le Retour Studio sur localhost avec un navigateur compatible.",
        );
    }
  }

  return (
    <main
      className={`studio-return ${showChat ? "studio-with-chat" : "studio-full-video"}`}
      data-testid="studio-return"
      data-state={state}
      data-rehearsal={rehearsal}
      data-version={view?.version ?? 0}
    >
      <div className="studio-video" aria-label="Zone du retour caméra">
        {videoStream ? (
          <div className="studio-video-active">
            <video
              ref={videoRef}
              className="studio-video-feed"
              autoPlay
              muted
              playsInline
              aria-label="Retour vidéo sélectionné"
            />
            <button
              className="studio-video-change"
              onClick={() => {
                videoStream.getTracks().forEach((track) => track.stop());
                setVideoStream(null);
              }}
            >
              Changer la source vidéo
            </button>
          </div>
        ) : (
          <div className="studio-video-neutral">
            <span>RETOUR VIDÉO</span>
            <small>
              Affichez le projecteur d’une scène OBS propre ou la caméra du
              plateau.
            </small>
            <div className="studio-video-actions">
              <button onClick={() => void selectVideoSource("display")}>
                Afficher une fenêtre OBS
              </button>
              <button onClick={() => void selectVideoSource("camera")}>
                Utiliser la caméra
              </button>
            </div>
            {videoError && (
              <p className="studio-video-error" role="alert">
                {videoError}
              </p>
            )}
          </div>
        )}
      </div>
      <section
        className="studio-safe-overlay broadcast-overlay broadcast-tv"
        aria-label="Informations partagées avec le plateau"
        data-connection={connection}
      >
        <div
          className="tv-header tv-pill"
          data-widget="header"
          style={position("header")}
        >
          <UndercoverTvMask />
          <h2>UNDERCOVER</h2>
        </div>
        <div
          className="tv-phase tv-pill"
          data-widget="phase"
          style={position("phase")}
        >
          <strong>{phase}</strong>
          {game?.turns && (
            <span className="tv-turn">
              Tour {game.turns.round}/{game.turns.total}
            </span>
          )}
        </div>
        <div
          className="tv-round tv-pill"
          data-widget="round"
          style={position("round")}
        >
          <span>{view?.participants.length ?? 0} joueurs</span>
          <span className="tv-connection">{connectionLabel(connection)}</span>
        </div>
        {state !== "reveal" && (
          <div
            className={`tv-lower${state === "discussion" ? " tv-speaker-group" : ""}`}
            data-widget={
              state === "vote"
                ? "vote"
                : state === "result"
                  ? "result"
                  : "players"
            }
            style={
              state === "vote"
                ? position("vote")
                : state === "result"
                  ? position("result")
                  : position("players")
            }
            aria-live="polite"
          >
            {speaker ? (
              <div className="tv-event tv-speaker">
                <span className="tv-speaker-number">{speakerSlot}</span>
                <div>
                  <p>Au tour de</p>
                  <strong title={name(speaker)}>{name(speaker)}</strong>
                </div>
              </div>
            ) : (
              <div
                className={`tv-event${state === "vote" ? " tv-vote-counter" : ""}`}
              >
                <p>{state === "vote" ? "Le vote est ouvert" : phase}</p>
                <strong>{instruction}</strong>
              </div>
            )}
          </div>
        )}
      </section>

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
            <strong>{rehearsal ? "RÉPÉTITION" : "CHAÎNE TWITCH"}</strong>
            <button
              className="studio-chat-close"
              onClick={() => setChatVisible(false)}
            >
              Masquer
            </button>
          </header>
          {!rehearsal && twitchChannel ? (
            <TwitchChatEmbed channel={twitchChannel} />
          ) : chatMessages.length ? (
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
      {state !== "reveal" && !showChat && (
        <button
          className="studio-chat-toggle"
          onClick={() => setChatVisible((visible) => !visible)}
        >
          Afficher le chat
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

function TwitchChatEmbed({ channel }: { channel: string }) {
  const [parent, setParent] = useState("");
  useEffect(() => setParent(window.location.hostname), []);
  const source = twitchChatEmbedUrl(channel, parent);
  if (!source)
    return (
      <div className="studio-chat-empty">
        <strong>Connexion au chat Twitch…</strong>
      </div>
    );
  return (
    <iframe
      className="studio-chat-frame"
      title={`Chat Twitch de ${channel}`}
      src={source}
      sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals"
    />
  );
}
