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
import { CopyLink } from "./copy-link";
export function CreatorLaboratory({ id }: { id: string }) {
  const confirm = useConfirm();
  const [lab, setLab] = useState<CreatorLab | null>(null),
    [loaded, setLoaded] = useState(false),
    [role, setRole] = useState("gm"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const flight = useRef(false);
  useEffect(() => {
    try {
      setLab(readLab(id));
    } catch {
      setError(
        "L’accès à cet essai ne peut pas être retrouvé. Ouvrez son lien privé ou créez un nouveau test.",
      );
    }
    setLoaded(true);
  }, [id]);
  async function run(task: (d: CreatorLab) => Promise<CreatorLab>) {
    if (!lab || flight.current) return false;
    flight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await task(structuredClone(lab));
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
  return (
    <CreatorFrame>
      <div className="creator-page-title">
        <div>
          <span className="eyebrow">LABORATOIRE PRIVÉ</span>
          <h1>
            {lab?.mode === "invite" ? "Votre partie" : "Testez votre jeu"}
          </h1>
          <p>
            {lab?.mode === "invite"
              ? "Invitez vos joueurs avant de préparer la partie."
              : "Agissez comme un joueur et regardez le résultat sur le plateau."}
          </p>
        </div>
        <Link
          className="secondary-button"
          href={lab?.returnTo ?? "/creator/library"}
        >
          {lab?.returnTo === "/creator/play"
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
          dans votre bibliothèque pour créer un nouveau test.
        </p>
      ) : (
        <>
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
            <Link className="text-link" href={lab.returnTo}>
              Créer un nouveau test depuis le jeu
            </Link>
          </div>
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
                onChange={(e) => setRole(e.target.value)}
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
              onChange={setRole}
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
          <LabView
            key={`${id}:${audience}`}
            id={id}
            audience={audience}
            lab={lab}
            onPrepared={() => setLab({ ...lab, ready: true })}
          />
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
              Un test rapide contient des joueurs de démonstration. Pour inviter
              de vraies personnes, lancez le jeu depuis la bibliothèque :
              l’effectif restera ouvert avant préparation.
            </p>
          </details>
        </>
      )}
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
          <PublicSession view={view} standalone />
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
