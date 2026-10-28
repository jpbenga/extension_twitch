"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeControl } from "./application-theme";
import { HomeIcon } from "./home-icon";
import "../app/stitch-surfaces.css";

export type SessionFeedbackProps = {
  connection: string;
  error: string;
  busy: boolean;
  retryAvailable: boolean;
  send: () => Promise<boolean>;
};
export function StitchHeader({
  name,
  host = false,
}: {
  name?: string;
  host?: boolean;
}) {
  return (
    <header className="stitch-header">
      <Link href="/" className="stitch-brand" aria-label="Retour à l’accueil">
        <HomeIcon name="game" />
        <span>
          {host ? "Extension Twitch" : "UNDERCOVER"}
          {host && <small>Meneur de jeu</small>}
        </span>
      </Link>
      {name ? (
        <span className="stitch-identity">
          <span aria-hidden="true">●</span>
          {name}
        </span>
      ) : host ? (
        <ThemeControl icon={<HomeIcon name="palette" />} />
      ) : (
        <Link href="/" className="stitch-quiet">
          Retour à l’accueil
        </Link>
      )}
    </header>
  );
}
export function SessionFeedback({
  connection,
  error,
  busy,
  retryAvailable,
  send,
}: SessionFeedbackProps) {
  return (
    <div className="stitch-feedback">
      <span
        className={`session-connection ${connection}`}
        data-testid="session-connection"
        role="status"
      >
        {connection === "connected"
          ? "Synchronisé"
          : connection === "denied"
            ? "Accès indisponible"
            : connection === "reconnecting"
              ? "Reconnexion… Actions suspendues."
              : "Connexion…"}
      </span>
      {error && (
        <p role="alert" className="stitch-error lobby-error">
          {error}
        </p>
      )}
      {retryAvailable && (
        <div className="stitch-error">
          <p>Une action attend sa confirmation. Vos données sont conservées.</p>
          <button
            className="stitch-button"
            disabled={busy || connection !== "connected"}
            onClick={() => void send()}
          >
            Réessayer la commande
          </button>
        </div>
      )}
    </div>
  );
}
export function StitchDisclosure({
  title,
  icon = "people",
  children,
}: {
  title: string;
  icon?: Parameters<typeof HomeIcon>[0]["name"];
  children: ReactNode;
}) {
  return (
    <details className="stitch-disclosure">
      <summary>
        <HomeIcon name={icon} />
        <span>{title}</span>
        <HomeIcon name="chevron" />
      </summary>
      <div className="stitch-disclosure-content">{children}</div>
    </details>
  );
}
export function AccessRequired({
  error,
  connection,
}: {
  error: string;
  connection: string;
}) {
  return (
    <main
      className="stitch-page stitch-companion"
      data-experience="player-access"
    >
      <div className="stitch-phone">
        <StitchHeader />
        <div className="stitch-access-body">
          <span
            className={`session-connection ${connection}`}
            data-testid="session-connection"
            role="status"
          >
            {connection === "denied"
              ? "Accès indisponible"
              : connection === "reconnecting"
                ? "Reconnexion… Actions suspendues."
                : "Connexion…"}
          </span>
          <span className="stitch-symbol">
            <HomeIcon name="lock" />
          </span>
          <h1>
            {connection === "denied"
              ? "Votre accès privé est nécessaire"
              : "Ouverture de votre partie…"}
          </h1>
          <p>
            {connection === "denied"
              ? "Ouvrez votre lien privé de récupération dans ce navigateur. Pour une nouvelle inscription, demandez une invitation au Game Master."
              : "Nous retrouvons votre accès personnel."}
          </p>
          {error && (
            <p className="stitch-error lobby-error" role="alert">
              {error}
            </p>
          )}
          <Link href="/" className="stitch-button">
            Retour à l’accueil
          </Link>
        </div>
        <p className="stitch-footnote">
          Undercover · Accès participant sécurisé
        </p>
      </div>
    </main>
  );
}
