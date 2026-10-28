"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  prepareLab,
  restartLab,
  probePlayerAccess,
  type CreatorLab,
} from "../lib/creator-lab";
import { ThemeControl } from "./application-theme";
import { BroadcastFeed } from "./broadcast-feed";
import { CopyLink } from "./copy-link";
import { HomeIcon } from "./home-icon";
import { useConfirm } from "./ui/feedback";
import "../app/stitch-surfaces.css";
import "../app/stitch-lab.css";

type LaboratoryProps = {
  id: string;
  lab: CreatorLab | null;
  loaded: boolean;
  role: string;
  changeRole: (role: string) => void;
  compare: boolean;
  setCompare: (compare: boolean) => void;
  busy: boolean;
  error: string;
  notice: string;
  run: (task: (lab: CreatorLab) => Promise<CreatorLab>) => Promise<boolean>;
  setNotice: (notice: string) => void;
  setError: (error: string) => void;
  children: ReactNode;
};

/** QA envelope only. The selected private panel and public renderer remain independent. */
export function OfficialLaboratory({
  id,
  lab,
  loaded,
  role,
  changeRole,
  compare,
  setCompare,
  busy,
  error,
  notice,
  run,
  setNotice,
  setError,
  children,
}: LaboratoryProps) {
  const confirm = useConfirm();
  const shell = useRef<HTMLElement>(null);
  const [origin, setOrigin] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  useEffect(() => setOrigin(window.location.origin), []);
  const players = lab?.players.filter((person) => person.id) ?? [];
  const selectedIndex = players.findIndex(
    (person) => `player:${person.id}` === role,
  );
  const identity =
    role === "gm"
      ? "le Game Master"
      : role === "public"
        ? "le Spectateur (informations publiques uniquement)"
        : `Joueur ${selectedIndex + 1} · ${players[selectedIndex]?.name ?? ""}`;
  const preparing = lab?.mode === "quick" && !lab.ready;
  const wide = compare || expanded.length > 0 || preparing;
  function disclosure(name: string, open: boolean) {
    setExpanded((previous) =>
      open
        ? [...new Set([...previous, name])]
        : previous.filter((entry) => entry !== name),
    );
  }
  function closeTools() {
    shell.current
      ?.querySelectorAll<HTMLDetailsElement>(
        "details.lab-stitch-disclosure[open]",
      )
      .forEach((panel) => {
        panel.open = false;
      });
    setExpanded([]);
  }
  function incarnate(next: string) {
    changeRole(next);
    closeTools();
    requestAnimationFrame(() =>
      shell.current
        ?.querySelector<HTMLSelectElement>(".lab-stitch-selector select")
        ?.focus(),
    );
  }
  const gmLink = `${origin}/sessions/${id}/gm#access=${lab?.token ?? ""}`;
  return (
    <main
      ref={shell}
      className={`stitch-page stitch-lab session-shell ${wide ? "is-wide" : ""} ${expanded.length > 0 ? "has-open-tools" : ""} ${preparing ? "is-preparing" : ""}`}
      data-experience="laboratory"
      data-testid="official-laboratory"
    >
      <header className="lab-stitch-header">
        <Link
          className="lab-stitch-brand"
          href="/"
          aria-label="Retour à l’accueil"
        >
          <span className="lab-stitch-monogram" aria-hidden="true">
            xt
          </span>
          <span>
            <small>LABORATOIRE</small>
            <strong>Undercover</strong>
          </span>
        </Link>
        <div className="lab-stitch-header-actions">
          <ThemeControl icon={<HomeIcon name="palette" />} />
          <Link href="/play/undercover" className="lab-stitch-new">
            Nouveau test depuis Undercover
          </Link>
        </div>
      </header>
      {!loaded ? (
        <div className="lab-stitch-content">
          <p role="status">Ouverture de l’essai…</p>
        </div>
      ) : !lab ? (
        <div className="lab-stitch-unavailable">
          <span className="stitch-kicker">LABORATOIRE PRIVÉ · QA</span>
          <section
            className="lab-stitch-card"
            aria-labelledby="lab-unavailable-title"
          >
            <span className="lab-stitch-lock">
              <HomeIcon name="lock" />
            </span>
            <h1 id="lab-unavailable-title">Accès à cet essai indisponible</h1>
            <p>
              Les accès à cet essai ne sont pas dans cet onglet. Ouvrez son lien
              privé ou créez un nouveau test depuis Undercover.
            </p>
            {error && (
              <p className="stitch-error" role="alert">
                {error}
              </p>
            )}
            <Link
              href="/play/undercover"
              className="stitch-button stitch-primary"
            >
              Retour à Undercover <HomeIcon name="arrow" />
            </Link>
            <p className="lab-stitch-security">
              <HomeIcon name="lock" />
              <span>
                <strong>
                  Ne partagez pas le laboratoire avec un participant.
                </strong>{" "}
                Chaque rôle dispose de son propre accès privé.
              </span>
            </p>
          </section>
          <p className="lab-stitch-note">
            L’absence d’accès dans cet onglet ne supprime pas la partie.
          </p>
        </div>
      ) : (
        <div className="lab-stitch-content">
          <div className="lab-stitch-title">
            <span className="stitch-kicker">LABORATOIRE PRIVÉ · QA</span>
            <h1>
              {preparing
                ? "Reprendre votre essai"
                : expanded.length > 0
                  ? "Accès et outils de test"
                  : "Laboratoire Undercover"}
            </h1>
            <p>Testez un point de vue à la fois.</p>
          </div>
          {error && (
            <p className="stitch-error lobby-error" role="alert">
              {error}
            </p>
          )}
          <div className="lab-stitch-workspace">
            <div className="lab-stitch-main-column">
              {preparing && (
                <section
                  className="lab-stitch-card lab-stitch-resume"
                  aria-label="Préparation interrompue"
                >
                  <div className="lab-stitch-callout">
                    <HomeIcon name="info" />
                    <div>
                      <strong>La préparation n’est pas terminée.</strong>
                      <p>Vérifiez la connexion, puis reprenez ce même essai.</p>
                    </div>
                  </div>
                  <button
                    className="stitch-button stitch-primary"
                    disabled={busy}
                    onClick={() => void run(prepareLab)}
                  >
                    {busy
                      ? "Préparation en cours…"
                      : "Reprendre la préparation"}
                  </button>
                  <p>
                    <HomeIcon name="check" /> Les joueurs déjà inscrits sont
                    conservés.
                  </p>
                </section>
              )}
              <section
                className="lab-stitch-card lab-stitch-perspective"
                aria-label="Choisir un point de vue"
              >
                <div className="lab-stitch-selector">
                  <label htmlFor={`lab-perspective-${id}`}>POINT DE VUE</label>
                  <select
                    id={`lab-perspective-${id}`}
                    aria-label="Perspective du laboratoire"
                    value={role}
                    onChange={(event) => incarnate(event.target.value)}
                  >
                    <option value="gm">Game Master</option>
                    {players.map((person, index) => (
                      <option value={`player:${person.id}`} key={person.id}>
                        Joueur {index + 1}
                      </option>
                    ))}
                    <option value="public">Spectateur</option>
                  </select>
                </div>
                <div
                  className="lab-identity lab-stitch-identity"
                  role="status"
                  aria-live="polite"
                >
                  <HomeIcon name={role === "public" ? "eye" : "people"} />
                  <span>Mode test — Vous incarnez {identity}.</span>
                  <span className="lab-stitch-private-label">
                    {role === "public" ? "Vue publique" : "Vue privée active"}
                  </span>
                </div>
                {preparing && (
                  <p className="lab-stitch-callout">
                    <HomeIcon name="lock" /> La partie sera disponible après
                    préparation.
                  </p>
                )}
                <div className="lab-stitch-shortcuts">
                  <CopyLink
                    label="Votre régie privée"
                    value={gmLink}
                    privateLink
                    compact
                    buttonLabel="Copier le lien privé GM pour mon iPhone"
                  />
                  <a
                    className="stitch-button"
                    href={`/sessions/${id}/stream`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Aperçu de l’émission <HomeIcon name="arrow" />
                  </a>
                  <label className="lab-compare-control lab-stitch-compare">
                    <input
                      type="checkbox"
                      aria-label="Afficher le plateau à côté sur ordinateur"
                      checked={compare}
                      onChange={(event) => {
                        if (event.target.checked) closeTools();
                        setCompare(event.target.checked);
                      }}
                    />
                    Comparer avec l’émission
                  </label>
                </div>
              </section>
              <div
                className={`lab-perspectives lab-stitch-stage ${compare && role !== "public" ? "is-comparing" : ""}`}
              >
                {children}
                {compare && role !== "public" && (
                  <aside
                    className="lab-public-mirror lab-stitch-public"
                    aria-label="Plateau public comparatif"
                  >
                    <div className="lab-stitch-public-title">
                      <div>
                        <h2>Aperçu de l’émission</h2>
                        <p>Vue publique · scène fictive · aucun flux Twitch</p>
                      </div>
                      <span>OBS 1080P</span>
                    </div>
                    <BroadcastFeed id={id} scene />
                  </aside>
                )}
              </div>
            </div>
            <div className="lab-stitch-disclosures">
              <details
                className="lab-stitch-disclosure"
                open={preparing || undefined}
                onToggle={(event) =>
                  disclosure("access", event.currentTarget.open)
                }
              >
                <summary>
                  <HomeIcon name="chevron" />
                  <strong>Accès aux vues</strong>
                  <span>Liens individuels</span>
                </summary>
                <div className="lab-stitch-disclosure-body">
                  <p className="lab-stitch-callout">
                    <HomeIcon name="info" /> Chaque joueur reçoit uniquement son
                    accès privé. Ne partagez jamais le laboratoire avec un
                    participant.
                  </p>
                  <a
                    className="lab-stitch-layout-link"
                    href={
                      role === "public"
                        ? `/sessions/${id}/public`
                        : role === "gm"
                          ? gmLink
                          : `${origin}/sessions/${id}/player/${players[selectedIndex]?.id}#access=${players[selectedIndex]?.token}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ouvrir la vue sélectionnée <HomeIcon name="arrow" />
                  </a>
                  <div className="lab-stitch-access-row">
                    <div>
                      <strong>Régie Game Master</strong>
                      <p>Contrôle de la partie et distribution.</p>
                    </div>
                    <div className="lab-stitch-row-actions">
                      <a
                        className="stitch-button"
                        href={gmLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ouvrir la régie sur cet appareil
                      </a>
                      <CopyLink
                        compact
                        privateLink
                        label="Accès privé GM"
                        buttonLabel="Copier le lien privé GM"
                        value={gmLink}
                      />
                    </div>
                  </div>
                  {players.map((person, index) => {
                    const link = `${origin}/sessions/${id}/player/${person.id}#access=${person.token}`;
                    return (
                      <div
                        className="lab-stitch-access-row lab-person-access"
                        key={person.id}
                      >
                        <div>
                          <strong>
                            Joueur {index + 1} · {person.name}
                          </strong>
                          <p>
                            {role === `player:${person.id}`
                              ? "Perspective sélectionnée"
                              : "Compagnon privé individuel"}
                          </p>
                        </div>
                        <div className="lab-stitch-row-actions">
                          <button
                            className="stitch-button"
                            onClick={() => incarnate(`player:${person.id}`)}
                          >
                            Incarner Joueur {index + 1}
                          </button>
                          <a
                            className="stitch-button"
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ouvrir Joueur {index + 1} séparément
                          </a>
                          <CopyLink
                            compact
                            privateLink
                            label={`Accès privé de Joueur ${index + 1}`}
                            buttonLabel={`Copier le lien de Joueur ${index + 1}`}
                            value={link}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {[
                    {
                      title: "Spectateur public",
                      description:
                        "Informations publiques uniquement, en lecture seule.",
                      path: "public",
                      label: "Voir le plateau spectateur",
                    },
                    {
                      title: "Aperçu de l’émission",
                      description:
                        "Scène fictive et véritable plateau synchronisé.",
                      path: "stream",
                      label: "Ouvrir l’aperçu de l’émission",
                    },
                    {
                      title: "Source OBS transparente",
                      description:
                        "Même rendu public, sans fond de scène ni commandes.",
                      path: "obs",
                      label: "Source OBS transparente",
                    },
                  ].map((view) => (
                    <div className="lab-stitch-access-row" key={view.path}>
                      <div>
                        <strong>{view.title}</strong>
                        <p>{view.description}</p>
                      </div>
                      <a
                        className="stitch-button"
                        href={`/sessions/${id}/${view.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {view.label} <HomeIcon name="arrow" />
                      </a>
                    </div>
                  ))}
                  {lab.gameId === "undercover" && (
                    <Link
                      className="lab-stitch-layout-link"
                      href={`/sessions/${id}/overlay`}
                    >
                      Personnaliser l’overlay <HomeIcon name="arrow" />
                    </Link>
                  )}
                </div>
              </details>
              <details
                className="lab-stitch-disclosure"
                onToggle={(event) =>
                  disclosure("tools", event.currentTarget.open)
                }
              >
                <summary>
                  <HomeIcon name="chevron" />
                  <strong>Outils de test</strong>
                  <span>Actions secondaires</span>
                </summary>
                <div className="lab-stitch-disclosure-body">
                  <div className="lab-stitch-access-row">
                    <div>
                      <strong>Recommencer le test</strong>
                      <p>
                        Efface les votes et résultats. Les joueurs conservent
                        leur accès.
                      </p>
                    </div>
                    <button
                      className="stitch-button"
                      disabled={busy || !lab.ready}
                      onClick={() =>
                        void confirm({
                          title: "Recommencer le test ?",
                          description:
                            "Les votes et résultats seront effacés. Les joueurs conserveront leur accès à cette partie.",
                          consequences: [
                            "Même session de jeu · mêmes accès joueurs conservés.",
                            "La prochaine distribution sera lancée par le Game Master.",
                          ],
                          confirmLabel: "Recommencer",
                          tone: "neutral",
                          presentation: "stitch",
                          onConfirm: () => run(restartLab),
                        })
                      }
                    >
                      Recommencer le test
                    </button>
                  </div>
                  <Link
                    className="lab-stitch-layout-link"
                    href="/play/undercover"
                  >
                    Créer un nouveau test depuis le jeu{" "}
                    <HomeIcon name="arrow" />
                  </Link>
                </div>
              </details>
              {players.length > 0 && (
                <details
                  className="lab-stitch-disclosure"
                  onToggle={(event) =>
                    disclosure("permissions", event.currentTarget.open)
                  }
                >
                  <summary>
                    <HomeIcon name="chevron" />
                    <strong>Vérifier les permissions · avancé</strong>
                    <span>Contrôle d’accès</span>
                  </summary>
                  <div className="lab-stitch-disclosure-body">
                    <div className="lab-stitch-access-row">
                      <div>
                        <strong>
                          Vérifier qu’un joueur ne peut pas renommer la partie.
                        </strong>
                        <p>
                          Envoie réellement une commande de gestion avec l’accès
                          du premier joueur.
                        </p>
                      </div>
                      <button
                        className="stitch-button"
                        disabled={busy || !lab.ready}
                        onClick={() =>
                          void run(async (current) => {
                            const denied = await probePlayerAccess(current);
                            if (denied)
                              setNotice(
                                "Accès correctement protégé : le serveur refuse cette action de gestion au joueur.",
                              );
                            else
                              setError(
                                "Cette action de gestion a été acceptée pour un joueur. Arrêtez le test et signalez ce problème.",
                              );
                            return current;
                          })
                        }
                      >
                        {busy
                          ? "Vérification en cours…"
                          : "Vérifier le refus d’une action de gestion"}
                      </button>
                    </div>
                    {notice && (
                      <p className="lab-stitch-probe-result" role="status">
                        <HomeIcon name="check" />
                        {notice}
                      </p>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
      <footer className="lab-stitch-footer">
        Laboratoire privé · Outils de test Undercover
      </footer>
    </main>
  );
}
