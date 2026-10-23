"use client";

import { useState } from "react";
import type { GameId, ParticipationMode } from "@extension-twitch/contracts";
import { findGame, games, publicDemo } from "../lib/demo";
import { GameArt } from "./game-art";
import { Icon } from "./icon";
import { ServerStatus } from "./server-status";
import { StagePreview } from "./stage-preview";

const modes = [
  {
    id: "hosted",
    label: "Animé",
    description: "Vous pilotez les actions depuis la régie.",
  },
  {
    id: "connected",
    label: "Connecté",
    description: "Les joueurs utiliseront leur interface individuelle.",
  },
  {
    id: "hybrid",
    label: "Hybride",
    description: "Joueurs connectés et actions du GM pourront coexister.",
  },
] as const;

export function Studio() {
  const [gameId, setGameId] = useState<GameId>("undercover");
  const [mode, setMode] = useState<ParticipationMode>("hybrid");
  const game = findGame(gameId);
  const selectedMode = modes.find((item) => item.id === mode) ?? modes[2];

  return (
    <div className="studio-shell">
      <a className="skip-link" href="#main">
        Aller à la régie
      </a>
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Extension Twitch — accueil">
          <span className="brand-symbol">
            x<span>t</span>
            <i />
          </span>
          <span>
            extension
            <span className="brand-sub">
              twitch<span className="brand-studio">STUDIO</span>
            </span>
          </span>
        </a>
        <div className="workspace-label">VOTRE ESPACE CRÉATEUR</div>
        <nav aria-label="Navigation principale">
          <a className="nav-item active" href="#main">
            <Icon name="grid" />
            Régie
            <span className="nav-indicator" />
          </a>
          <a className="nav-item" href="#plateau">
            <Icon name="screen" />
            Plateau & overlay
          </a>
          <a className="nav-item" href="#participants">
            <Icon name="people" />
            Participants
          </a>
          <a className="nav-item" href="#interactions">
            <Icon name="spark" />
            Interactions
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <span className="tiny-label">LE STUDIO EST À VOUS</span>
            <p>Imaginez votre prochaine émission.</p>
            <span>Sans compte. Sans connexion Twitch.</span>
          </div>
          <div className="profile">
            <span className="profile-avatar">GM</span>
            <div>
              Game Master<small>Espace de démonstration</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="studio-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Studio</span>
            <span className="breadcrumb-slash">/</span>
            <span>Régie</span>
          </div>
          <ServerStatus />
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="live-mark" />
                LES GRANDS SHOWS COMMENCENT ICI
              </div>
              <h1>
                À vous de jouer<span>.</span>
              </h1>
              <p>
                Votre émission, vos règles. Un seul endroit pour tout
                orchestrer.
              </p>
            </div>
            <span className="demo-badge">
              <span className="status-dot" />
              Mode démonstration
            </span>
          </div>
          <div className="section-heading">
            <h2>
              <span className="step-number">01</span>Choisissez votre jeu
            </h2>
            <span>3 expériences · un même studio</span>
          </div>
          <div
            className="game-picker"
            aria-label="Choix du jeu de démonstration"
          >
            {games.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`game-card ${item.theme} ${gameId === item.id ? "selected" : ""}`}
                aria-pressed={gameId === item.id}
                onClick={() => setGameId(item.id)}
              >
                <div className="game-card-top">
                  <span className="game-category">{item.category}</span>
                  <span className="selection-mark">
                    {gameId === item.id ? <Icon name="check" /> : <span />}
                  </span>
                </div>
                <GameArt symbol={item.symbol} />
                <h3>{item.shortTitle}</h3>
                <p>{item.description}</p>
                <div className="game-card-bottom">
                  <span>Règles à définir</span>
                  <Icon name="arrow" />
                </div>
              </button>
            ))}
          </div>

          <section
            className="production-section"
            id="plateau"
            aria-labelledby="plateau-title"
          >
            <div className="section-heading">
              <h2 id="plateau-title">
                <span className="step-number">02</span>Installez votre plateau
              </h2>
              <span>Votre prochain rendez-vous</span>
            </div>
            <div className="production-grid">
              <div className="preview-panel">
                <div className="panel-top">
                  <span>
                    <Icon name="screen" />
                    Aperçu du programme
                  </span>
                  <span className="format-tag">16:9</span>
                </div>
                <StagePreview gameId={gameId} />
                <div className="preview-footer">
                  <span>
                    <span className="status-dot" />
                    Visuel de démonstration
                  </span>
                  <a
                    href={`/overlay?game=${gameId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir l’overlay <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
              <div className="setup-panel">
                <span className="eyebrow">DANS LES COULISSES</span>
                <h3>Préparer l’émission</h3>
                <p className="setup-intro">
                  Un aperçu du studio, avant le premier direct.
                </p>
                <div className="setup-detail">
                  <span>Émission</span>
                  <strong>{publicDemo.title}</strong>
                </div>
                <div className="setup-detail">
                  <span>Jeu sélectionné</span>
                  <strong aria-live="polite">{game.shortTitle}</strong>
                </div>
                <fieldset className="mode-field">
                  <legend>Mode de participation</legend>
                  <div className="mode-options">
                    {modes.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        aria-pressed={mode === item.id}
                        onClick={() => setMode(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <p aria-live="polite">{selectedMode.description}</p>
                </fieldset>
                <a
                  className="primary-button"
                  href={`/overlay?game=${gameId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir l’overlay démo
                  <Icon name="arrow" />
                </a>
                <p className="setup-footnote">
                  Sélection locale d’aperçu. Aucune session créée.
                </p>
              </div>
            </div>
          </section>

          <section id="participants" aria-labelledby="participants-title">
            <div className="section-heading">
              <h2 id="participants-title">
                <span className="step-number">03</span>Les invités du plateau
                <span className="count-badge">06</span>
              </h2>
              <span>Participants fictifs</span>
            </div>
            <div className="participants-grid">
              {publicDemo.participants.map((participant, index) => (
                <div className="participant-card" key={participant.id}>
                  <span className={`avatar avatar-${index}`}>
                    {participant.initials}
                  </span>
                  <div>
                    <strong>{participant.name}</strong>
                    <small>Joueur simulé</small>
                  </div>
                  <span className="participant-index">0{index + 1}</span>
                </div>
              ))}
            </div>
            <a className="text-link" href="/player">
              Découvrir l’aperçu joueur <span aria-hidden="true">↗</span>
            </a>
          </section>

          <section id="interactions" aria-labelledby="interactions-title">
            <div className="section-heading">
              <h2 id="interactions-title">
                <span className="step-number">04</span>Et le public entre en jeu
              </h2>
              <span>Intégrations futures</span>
            </div>
            <div className="interaction-grid">
              <article className="interaction-card">
                <span className="interaction-icon mint">
                  <Icon name="people" />
                </span>
                <div>
                  <h3>La voix du public</h3>
                  <p>Votes, choix collectifs et événements gratuits.</p>
                </div>
                <span className="future-tag">À venir</span>
              </article>
              <article className="interaction-card">
                <span className="interaction-icon violet">
                  <Icon name="spark" />
                </span>
                <div>
                  <h3>Une touche de Bits</h3>
                  <p>Des interactions sous le contrôle du Game Master.</p>
                </div>
                <span className="future-tag">Désactivé</span>
              </article>
            </div>
          </section>
          <footer className="studio-footer">
            <span>
              <span className="footer-spark">✦</span> Pensé pour vos directs.
              Construit pour vos idées.
            </span>
            <span>Socle technique · v0.1</span>
            <p>
              Données fictives. Jeux non jouables à ce stade. Aucune connexion
              Twitch ni transaction réelle.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
