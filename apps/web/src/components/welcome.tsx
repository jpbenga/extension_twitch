"use client";
import Link from "next/link";
import { useState } from "react";
import { officialGames } from "@extension-twitch/contracts/official-games";
import { ThemeControl } from "./application-theme";
import {
  useRecentSession,
  type RecentSession,
  type ResumeStatus,
} from "./resume-session";
import { HomeIcon } from "./home-icon";
import { invitationInputError, parseInvitationCode } from "../lib/invitation";

const game = officialGames[0]!;
const artwork =
  "https://lh3.googleusercontent.com/aida/AEtjO1XhaPMrq9CmLht9JCFHkRPZipkkkjgJSGeTu72iUyTTzvdtQblnpqMxf3__2Dx07IAboxYtaWUzOPOGZF5IBFpMtrJkb6zKvI6Z5oCcfXtj9j5ui8woVbGjlnMy6703U60L4ANyZvSbdIj14nAbXQ3phj_yRgy5RBMAX8_6DTvLMJDcBh8weAfFcBmgnaBV5SL4NRWJRXds1J-Zg9WcW1xq6F3hjGBBnsZTdvFLuThC7MGPHEYdsStl4Jo";

export function Welcome() {
  const { recent, status } = useRecentSession();
  const [artLoaded, setArtLoaded] = useState(false);
  return (
    <div className="home-page" data-testid="home-page">
      <header className="home-header">
        <Link
          className="home-brand"
          href="/"
          aria-label="Extension Twitch — Accueil"
        >
          <span>
            <HomeIcon name="game" />
          </span>
          Extension Twitch
        </Link>
        <ThemeControl icon={<HomeIcon name="palette" />} />
      </header>
      <main className={`home-content ${recent ? "has-resume" : ""}`}>
        <h1>Votre prochaine partie commence ici.</h1>
        <div className="home-main">
          {recent && <Recovery recent={recent} status={status} />}
          <article
            className="home-feature"
            aria-labelledby="home-undercover-title"
          >
            <div className="home-artwork" aria-hidden="true">
              {!artLoaded && (
                <div className="home-art-reference">
                  <img
                    src="/home/undercover-reference.png"
                    alt=""
                    width="2560"
                    height="2048"
                  />
                </div>
              )}
              <img
                className={`home-art-original ${artLoaded ? "is-loaded" : ""}`}
                src={artwork}
                alt=""
                referrerPolicy="no-referrer"
                onLoad={() => setArtLoaded(true)}
                width="1024"
                height="1024"
              />
            </div>
            <div className="home-badges">
              <div>
                <span>
                  <HomeIcon name="people" />
                  3–12 joueurs
                </span>
                <span>
                  <HomeIcon name="screen" />
                  Compatible OBS
                </span>
              </div>
              <span className="home-featured">En vedette</span>
            </div>
            <div className="home-feature-body">
              <h2 id="home-undercover-title">{game.title}</h2>
              <p className="home-description">{game.description}</p>
              <div className="home-feature-actions">
                <Link
                  className={
                    recent
                      ? "home-button home-button-secondary"
                      : "home-button home-button-primary"
                  }
                  href="/play/undercover"
                  aria-label="Préparer une partie Undercover"
                >
                  Préparer une partie <HomeIcon name="arrow" />
                </Link>
                <details className="home-discover">
                  <summary>
                    Découvrir le jeu <HomeIcon name="info" />
                  </summary>
                  <div>
                    <p>{game.concept}</p>
                    <p>
                      Format de démonstration jouable. Les règles et le rythme
                      continuent d’être affinés avec vos retours.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </article>
          <aside
            className="home-access"
            aria-label="Retrouver ou rejoindre une partie"
          >
            {!recent && <Recovery recent={recent} status={status} />}
            <Invitation />
          </aside>
        </div>
        <section className="home-future" aria-labelledby="home-future-title">
          <h2 id="home-future-title">Bientôt</h2>
          <div>
            {officialGames.slice(1).map((g) => (
              <article key={g.id}>
                <span className="home-future-name">
                  <span className="home-future-icon">
                    <HomeIcon name={g.id === "auctions" ? "gavel" : "eye"} />
                  </span>
                  {g.title}
                </span>
                <span className="home-coming" aria-label="À venir, non jouable">
                  À venir
                </span>
              </article>
            ))}
          </div>
        </section>
        <footer className="home-footer">
          <span>Extension Twitch</span>
          <Link href="/play">Choisir un jeu</Link>
        </footer>
      </main>
    </div>
  );
}

function Recovery({
  recent,
  status,
}: {
  recent: RecentSession | null;
  status: ResumeStatus;
}) {
  return (
    <section
      className="home-panel home-recovery"
      aria-labelledby="home-recovery-title"
      data-status={status}
    >
      <div className="home-recovery-heading">
        <span className="home-panel-kicker">
          <HomeIcon name="key" />
          <span>Espace animateur</span>
        </span>
        <h2 id="home-recovery-title">
          {recent ? recent.title : "Déjà une partie ?"}
        </h2>
      </div>
      <div className="home-recovery-action">
        {recent ? (
          <Link
            className="home-button home-button-primary"
            href={
              recent.lab
                ? `/play/lab/${recent.id}`
                : `/sessions/${recent.id}/gm`
            }
          >
            Reprendre ma partie <HomeIcon name="arrow" />
          </Link>
        ) : status === "checking" ? (
          <p className="home-checking" role="status">
            Vérification de votre accès…
          </p>
        ) : (
          <>
            {status === "unavailable" && (
              <p className="home-context" role="status">
                Cet accès n’est pas disponible dans cet onglet.
              </p>
            )}
            {status === "finished" && (
              <p className="home-context" role="status">
                Votre dernière partie est terminée.
              </p>
            )}
            <details className="home-recovery-help">
              <summary aria-label="Retrouver ma partie">
                <span className="home-label-desktop">Retrouver ma partie</span>
                <span className="home-label-mobile">Retrouver</span>{" "}
                <HomeIcon name="arrow" />
              </summary>
              <p>
                Ouvrez votre lien privé GM ou joueur conservé lors de la
                préparation. Sur un autre appareil, utilisez ce même lien.
              </p>
              <p>
                Revenir à l’accueil n’arrête pas la partie. Aucun compte ni
                récupération par e-mail pour le moment.
              </p>
            </details>
          </>
        )}
        {recent && (
          <details className="home-private-help">
            <summary>Sur un autre appareil ?</summary>
            <p>
              Ouvrez le lien privé GM ou joueur que vous avez conservé. Les
              accès de cet onglet ne se retrouvent pas automatiquement sur votre
              téléphone.
            </p>
          </details>
        )}
      </div>
    </section>
  );
}

function Invitation() {
  const [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [opening, setOpening] = useState(false);
  return (
    <section
      className="home-panel home-invitation"
      aria-labelledby="home-invitation-title"
    >
      <div>
        <span className="home-panel-kicker">
          <HomeIcon name="people" />
          <span>Accès joueur</span>
        </span>
        <h2 id="home-invitation-title">Vous êtes invité ?</h2>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (opening) return;
          const invitation = parseInvitationCode(code);
          if (invitation === null) {
            setError(invitationInputError);
            return;
          }
          setError("");
          setOpening(true);
          window.location.assign(`/join/${encodeURIComponent(invitation)}`);
        }}
      >
        <label className="sr-only" htmlFor="home-invitation-code">
          Code ou lien d’invitation
        </label>
        <div className="home-invitation-row">
          <input
            id="home-invitation-code"
            name="invitation"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError("");
            }}
            placeholder="Code d’invitation"
            required
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={opening}
            aria-invalid={!!error}
            aria-describedby={error ? "home-invitation-error" : undefined}
          />
          <button
            className="home-button home-button-secondary"
            disabled={opening}
            aria-busy={opening}
          >
            {opening ? "Ouverture…" : "Rejoindre"}
          </button>
        </div>
        {error && (
          <p className="home-error" role="alert" id="home-invitation-error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
