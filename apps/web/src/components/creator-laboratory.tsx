"use client";
import Link from "next/link";
import { SegmentedControl } from "./ui/primitives";
import { useConfirm } from "./ui/feedback";
import { useEffect, useRef, useState } from "react";
import { CreatorFrame } from "./creator-frame";
import {
  readLab,
  saveLab,
  prepareLab,
  restartLab,
  labGm,
  labCommand,
  probePlayerAccess,
  type CreatorLab,
} from "../lib/creator-lab";
import { useSession, type SessionAudience } from "../lib/use-session";
import { GamePanel } from "./game-panel";
import { PublicSession } from "./public-session";
import { requestMessage } from "../lib/session-client";
import { SpectatorTest } from "./spectator-test";
import { BroadcastFeed } from "./broadcast-feed";
import { CopyLink } from "./copy-link";
import { OfficialLaboratory } from "./official-laboratory";
export function CreatorLaboratory({
  id,
  context = "creator",
}: {
  id: string;
  context?: "creator" | "play";
}) {
  const confirm = useConfirm();
  const [lab, setLab] = useState<CreatorLab | null>(null),
    [loaded, setLoaded] = useState(false),
    [role, setRole] = useState("gm"),
    [compare, setCompare] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const flight = useRef(false);
  useEffect(() => {
    try {
      const saved = readLab(id);
      setLab(saved);
      const selected = sessionStorage.getItem(`xt:lab-perspective:${id}`);
      if (
        selected &&
        (selected === "gm" ||
          selected === "public" ||
          saved?.players.some((p) => `player:${p.id}` === selected))
      )
        setRole(selected);
    } catch {
      setError(
        "L’accès à cet essai ne peut pas être retrouvé. Ouvrez son lien privé ou créez un nouveau test.",
      );
    }
    setLoaded(true);
  }, [id]);
  function changeRole(next: string) {
    try {
      sessionStorage.setItem(`xt:lab-perspective:${id}`, next);
    } catch {
      setError(
        "Ce point de vue reste utilisable, mais ne pourra pas être retrouvé après rechargement dans cet onglet.",
      );
    }
    setRole(next);
  }
  async function run(task: (d: CreatorLab) => Promise<CreatorLab>) {
    if (!lab || flight.current) return false;
    flight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      // A dialog can retain an older callback after an uncertain response.
      // Reload the persisted receipt before retrying instead of restarting from
      // the stale React snapshot captured when the confirmation opened.
      const current = readLab(id) ?? lab;
      const next = await task(structuredClone(current));
      saveLab(next);
      setLab(next);
      return true;
    } catch (e) {
      // Keep the persisted receipt after an uncertain result, including restart.
      try {
        setLab(readLab(id));
      } catch {
        /* The current view remains usable. */
      }
      setError(
        requestMessage(
          e,
          "La préparation a été interrompue. Vérifiez la connexion puis réessayez : ce même essai sera repris.",
        ),
      );
      return false;
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  const person = lab?.players.find((p) => `player:${p.id}` === role),
    audience = role as SessionAudience;
  if (["play"].includes(context))
    return (
      <OfficialLaboratory
        id={id}
        lab={lab}
        loaded={loaded}
        role={role}
        changeRole={changeRole}
        compare={compare}
        setCompare={setCompare}
        busy={busy}
        error={error}
        notice={notice}
        run={run}
        setNotice={setNotice}
        setError={setError}
      >
        {lab && (
          <LabView
            key={`${id}:${audience}`}
            id={id}
            audience={audience}
            lab={lab}
            onPrepared={() => setLab({ ...lab, ready: true })}
          />
        )}
      </OfficialLaboratory>
    );
  return (
    <CreatorFrame context={context}>
      <div className={context === "play" ? "lab-focused" : ""}>
        <div className="creator-page-title">
          <div>
            <span className="eyebrow">LABORATOIRE PRIVÉ</span>
            <h1>
              {lab?.mode === "invite"
                ? "Votre partie"
                : context === "play"
                  ? "Laboratoire Undercover"
                  : "Testez votre jeu"}
            </h1>
            <p>
              {lab?.mode === "invite"
                ? "Invitez vos joueurs avant de préparer la partie."
                : "Agissez comme un joueur et regardez le résultat sur le plateau."}
            </p>
          </div>
          <Link
            className="secondary-button"
            href={
              context === "play"
                ? "/play/undercover"
                : (lab?.returnTo ?? "/creator/library")
            }
          >
            {context === "play" ||
            lab?.returnTo === "/creator/play" ||
            lab?.returnTo.startsWith("/play")
              ? "Changer de jeu ou créer une nouvelle partie"
              : "Retour à l’édition"}
          </Link>
        </div>
        {error && (
          <p role="alert" className="lobby-error">
            {error}
          </p>
        )}
        {!loaded ? (
          <p>Ouverture de l’essai…</p>
        ) : !lab ? (
          <p>
            Les accès à cet essai ne sont pas dans cet onglet. Retrouvez le jeu
            dans le catalogue pour créer une nouvelle partie.
          </p>
        ) : (
          <>
            {lab.mode === "quick" && !lab.ready && (
              <div className="lobby-warning">
                <p>
                  La préparation n’est pas terminée. Reprenez-la sans créer une
                  autre partie.
                </p>
                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={() => void run(prepareLab)}
                >
                  Reprendre la préparation
                </button>
              </div>
            )}
            {lab.players.length > 2 ? (
              <label className="lab-role-tabs">
                Point de vue
                <select
                  aria-label="Perspective du laboratoire"
                  value={role}
                  onChange={(e) => changeRole(e.target.value)}
                >
                  <option value="gm">Game Master</option>
                  {lab.players
                    .filter((p) => p.id)
                    .map((p, i) => (
                      <option value={`player:${p.id}`} key={p.id}>
                        Joueur {i + 1}
                      </option>
                    ))}
                  <option value="public">Spectateur</option>
                </select>
              </label>
            ) : (
              <SegmentedControl
                label="Vue du laboratoire"
                value={role}
                onChange={changeRole}
                options={[
                  { value: "gm", label: "Game Master" },
                  ...lab.players
                    .filter((p) => p.id)
                    .map((p, i) => ({
                      value: `player:${p.id}`,
                      label: `Joueur ${i + 1}`,
                    })),
                  { value: "public", label: "Spectateur" },
                ]}
              />
            )}
            <p className="lab-identity" role="status">
              {lab.mode === "quick" ? "Mode test — " : "Vous consultez — "}Vous
              incarnez{" "}
              {role === "gm"
                ? "le Game Master"
                : role === "public"
                  ? "le Spectateur (informations publiques uniquement)"
                  : `Joueur ${lab.players.findIndex((p) => p.id === person?.id) + 1} · ${person?.name}`}
              .
            </p>
            <div className="lab-quick-access">
              {" "}
              <CopyLink
                label="Votre régie privée"
                value={`${location.origin}/sessions/${id}/gm#access=${lab.token}`}
                privateLink
                compact
                buttonLabel="Copier le lien privé GM pour mon iPhone"
              />
              <a
                className="secondary-button"
                href={`/sessions/${id}/stream?from=lab`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Répétition avant direct ↗
              </a>
            </div>
            <label className="creator-check lab-compare-control">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              Afficher le plateau à côté sur ordinateur
            </label>
            <div
              className={`lab-perspectives ${compare && role !== "public" ? "is-comparing" : ""}`}
            >
              <LabView
                key={`${id}:${audience}`}
                id={id}
                audience={audience}
                lab={lab}
                onPrepared={() => setLab({ ...lab, ready: true })}
              />
              {compare && role !== "public" && <PublicMirror id={id} />}
            </div>
            <details className="lab-device-access">
              <summary>iPhone, OBS et accès aux différentes vues</summary>
              <div className="lab-access-links">
                {lab.gameId === "undercover" && (
                  <Link
                    className="secondary-button"
                    href={`/sessions/${id}/overlay`}
                  >
                    Personnaliser l’overlay
                  </Link>
                )}

                <a
                  className="text-link"
                  href={`/sessions/${id}/obs`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source OBS transparente ↗
                </a>
                <a
                  className="text-link"
                  href={`/sessions/${id}/gm#access=${lab.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir la régie sur cet appareil
                </a>
                <a
                  className="text-link"
                  href={`/sessions/${id}/public`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir le plateau spectateur ↗
                </a>
              </div>
              <p className="lobby-hint">
                Sur l’iPhone, ouvrez le lien privé GM. Gardez cet onglet sur
                l’ordinateur pour incarner les joueurs. Ces accès sont
                confidentiels.
              </p>
            </details>
            <div className="creator-lab-tools">
              <button
                className="secondary-button"
                disabled={busy || !lab.ready}
                onClick={() =>
                  void confirm({
                    title: "Recommencer la partie ?",
                    description:
                      "Les votes et résultats seront effacés. Les joueurs conserveront leur accès à cette partie.",
                    confirmLabel: "Recommencer",
                    tone: "warning",
                    onConfirm: () => run(restartLab),
                  })
                }
              >
                Recommencer le test
              </button>
              <Link
                className="text-link"
                href={context === "play" ? "/play/undercover" : lab.returnTo}
              >
                Créer un nouveau test depuis le jeu
              </Link>
            </div>
            <details className="creator-private">
              <summary>Accès individuels des joueurs de démonstration</summary>
              <p>
                Chaque lien ouvre uniquement ce joueur. Sur un même ordinateur,
                le sélecteur évite de multiplier les connexions. Ne partagez
                jamais le laboratoire avec un participant.
              </p>
              {lab.players
                .filter((p) => p.id)
                .map((p, i) => (
                  <div className="lab-person-access" key={p.id}>
                    <button
                      className="secondary-button"
                      onClick={() => changeRole(`player:${p.id}`)}
                    >
                      Incarner Joueur {i + 1}
                    </button>
                    <a
                      className="text-link"
                      href={`/sessions/${id}/player/${p.id}#access=${p.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ouvrir Joueur {i + 1} séparément
                    </a>
                    <CopyLink
                      compact
                      privateLink
                      label={`Accès privé de Joueur ${i + 1}`}
                      buttonLabel={`Copier le lien de Joueur ${i + 1}`}
                      value={`${location.origin}/sessions/${id}/player/${p.id}#access=${p.token}`}
                    />
                  </div>
                ))}
            </details>
            {lab.players.length > 0 && (
              <details className="creator-private">
                <summary>Vérifier les permissions (avancé)</summary>
                <p>
                  Vérifiez qu’un joueur ne peut pas renommer la partie, même en
                  envoyant une commande de gestion au serveur.
                </p>
                <button
                  className="secondary-button"
                  disabled={busy || !lab.ready}
                  onClick={() =>
                    void run(async (d) => {
                      const denied = await probePlayerAccess(d);
                      if (denied)
                        setNotice(
                          "Accès correctement protégé : le serveur refuse cette action de gestion au joueur.",
                        );
                      else
                        setError(
                          "Cette action de gestion a été acceptée pour un joueur. Arrêtez le test et signalez ce problème.",
                        );
                      return d;
                    })
                  }
                >
                  Vérifier le refus d’une action de gestion
                </button>
                {notice && <p role="status">{notice}</p>}
              </details>
            )}
            <details className="creator-private">
              <summary>Ouvrir cette vue sur un autre écran</summary>
              <p>
                Le sélecteur est recommandé dans un même navigateur. Pour
                plusieurs vues simultanées, utilisez différents navigateurs ou
                appareils. Le laboratoire vous permet d’essayer plusieurs rôles.
                Un vrai joueur doit recevoir uniquement son invitation ou son
                propre accès.
              </p>
              <a
                className="secondary-button"
                href={
                  role === "public"
                    ? `/sessions/${id}/public`
                    : role === "gm"
                      ? `/sessions/${id}/gm#access=${lab.token}`
                      : `/sessions/${id}/player/${person?.id}#access=${person?.token}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir la vue sélectionnée
              </a>
              <p>
                Un test rapide contient des joueurs de démonstration. Pour
                inviter de vraies personnes, choisissez « Inviter de vrais
                participants » : l’effectif restera ouvert avant préparation.
              </p>
            </details>
          </>
        )}
      </div>
    </CreatorFrame>
  );
}
function LabView({
  id,
  audience,
  lab,
  onPrepared,
}: {
  id: string;
  audience: SessionAudience;
  lab: CreatorLab;
  onPrepared: () => void;
}) {
  const session = useSession(id, audience);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const view = session.view;
  async function install() {
    setBusy(true);
    setError("");
    try {
      const latest = await labGm(lab);
      if (!latest.participants.length)
        throw new Error(
          "Au moins un joueur doit rejoindre la partie. Partagez l’invitation ci-dessous.",
        );
      await labCommand(lab, {
        type: "game.use-prepared",
        configuration: lab.configuration ?? {},
      });
      lab.ready = true;
      saveLab(lab);
      onPrepared();
    } catch (e) {
      setError(
        requestMessage(
          e,
          "La partie n’a pas pu être préparée. Vérifiez la connexion puis réessayez.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="lab-role-view"
      aria-label={
        audience === "public"
          ? "Vue spectateur"
          : audience === "gm"
            ? "Vue Game Master"
            : "Vue joueur"
      }
    >
      <p
        className={`connection-badge ${session.connection}`}
        data-testid="session-connection"
      >
        {session.connection === "connected"
          ? "Synchronisé"
          : session.connection === "reconnecting"
            ? "Reconnexion…"
            : session.connection === "denied"
              ? "Accès indisponible"
              : "Connexion…"}
      </p>
      {(session.error || error) && (
        <p role="alert" className="lobby-error">
          {session.error || error}
        </p>
      )}
      {session.retryAvailable && (
        <button
          className="secondary-button"
          disabled={session.busy}
          onClick={() => void session.send()}
        >
          Réessayer mon action
        </button>
      )}
      {view &&
        (audience === "public" ? (
          <>
            <PublicSession view={view} />
            <SpectatorTest id={id} />
          </>
        ) : (
          <>
            {view.audience === "gm" && !view.game ? (
              <section className="lobby-panel">
                <h2>Invitez vos joueurs</h2>
                <CopyLink label="Invitation des joueurs" value={view.joinUrl} />
                <p>{view.participants.length} joueur(s) inscrit(s)</p>
                <ul>
                  {view.participants.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
                <button
                  className="primary-button"
                  disabled={busy || view.participants.length === 0}
                  onClick={() => void install()}
                >
                  Préparer la partie
                </button>
              </section>
            ) : (
              <GamePanel
                hideRestart
                view={view}
                locked={
                  session.busy ||
                  session.retryAvailable ||
                  session.connection !== "connected"
                }
                send={session.send}
              />
            )}
          </>
        ))}
    </section>
  );
}

/** Independent public fetch/stream: never derive an observer view from private state. */
function PublicMirror({ id }: { id: string }) {
  return (
    <aside className="lab-public-mirror" aria-label="Plateau public comparatif">
      <h2>Aperçu de l’émission</h2>
      <p className="lobby-hint">Scène fictive · données publiques uniquement</p>
      <BroadcastFeed id={id} scene />
    </aside>
  );
}
