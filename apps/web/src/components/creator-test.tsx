"use client";
import { useEffect, useRef, useState } from "react";
import {
  gmSessionSchema,
  sessionAccessSchema,
  sessionViewSchema,
  type GmSessionView,
} from "@extension-twitch/contracts/sessions";
import {
  commandId,
  post,
  randomToken,
  readResponse,
  RequestFailure,
} from "../lib/session-client";
import { CopyLink } from "./copy-link";
interface Player {
  id: string;
  name: string;
  token: string;
}
export function CreatorTest({ link }: { link: string }) {
  const url = new URL(link),
    token = new URLSearchParams(url.hash.slice(1)).get("access") ?? "",
    id = url.pathname.split("/")[2]!;
  const [gm, setGm] = useState<GmSessionView | null>(null),
    [players, setPlayers] = useState<Player[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const flight = useRef(false),
    joins = useRef<{ name: string; token: string; requestId: string }[]>([]);
  const readGm = async () =>
    gmSessionSchema.parse(
      await readResponse(
        await fetch(`/api/server/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ),
    );
  useEffect(() => {
    void readGm()
      .then(setGm)
      .catch(() =>
        setError("Session indisponible. Réessayez depuis le lien GM."),
      );
  }, [link]); // eslint not used; the link pins the session identity.
  async function run(task: () => Promise<void>) {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Opération interrompue. Réessayez : les identifiants de reprise sont conservés.",
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  async function addPlayers() {
    await run(async () => {
      const latest = await readGm();
      if (latest.game)
        throw new Error(
          "La partie est installée. Recommencez une nouvelle démonstration pour changer les participants.",
        );
      if (!joins.current.length)
        joins.current = ["Fictif · Nova", "Fictif · Atlas"].map((name) => ({
          name,
          token: randomToken(),
          requestId: commandId(),
        }));
      const added: Player[] = [];
      for (const pending of joins.current) {
        const joined = sessionAccessSchema.parse(
          await post(
            `/invitations/${latest.invitationCode}/join`,
            pending.token,
            { requestId: pending.requestId, name: pending.name },
          ),
        );
        if (!joined.participantId) throw new Error("Identité joueur absente.");
        added.push({
          id: joined.participantId,
          name: pending.name,
          token: pending.token,
        });
        setPlayers([...added]);
      }
      setGm(await readGm());
      setMessage(
        "Deux identités fictives distinctes sont inscrites par les API normales. Vous pouvez ouvrir leurs interfaces.",
      );
    });
  }
  async function install() {
    await run(async () => {
      const latest = await readGm();
      if (latest.game) {
        setGm(latest);
        setMessage(
          "La définition est déjà installée. Poursuivez dans la régie.",
        );
        return;
      }
      if (!latest.participants.length)
        throw new Error(
          "Ajoutez des joueurs fictifs ou invitez un participant avant installation.",
        );
      const next = gmSessionSchema.parse(
        await post(`/sessions/${id}/commands`, token, {
          commandId: commandId(),
          expectedVersion: latest.version,
          command: { type: "game.use-prepared" },
        }),
      );
      setGm(next);
      setMessage(
        "Définition exacte installée. Ouvrez la régie pour lancer la première transition.",
      );
    });
  }
  async function probe() {
    await run(async () => {
      const p = players[0];
      if (!p) return;
      const view = sessionViewSchema.parse(
        await readResponse(
          await fetch(`/api/server/sessions/${id}/private`, {
            headers: { Authorization: `Bearer ${p.token}` },
            cache: "no-store",
          }),
        ),
      );
      try {
        await post(`/sessions/${id}/commands`, p.token, {
          commandId: commandId(),
          expectedVersion: view.version,
          command: { type: "session.rename", title: "Interdit" },
        });
        throw new Error("Anomalie : action GM acceptée.");
      } catch (e) {
        if (e instanceof RequestFailure && e.status === 403)
          setMessage(
            "Refus attendu (403) : le joueur ne peut pas renommer la session.",
          );
        else throw e;
      }
    });
  }
  return (
    <section className="lobby-panel creator-test" id="creator-test">
      <span className="eyebrow">ESSAI ISOLÉ · VÉRITABLE MOTEUR</span>
      <h2>Votre test est prêt</h2>
      <p>
        Votre définition est figée pour cet essai. Invitez des participants
        réels, ou ajoutez deux identités fictives. Installez ensuite le jeu,
        puis pilotez ses actions dans la régie.
      </p>
      {error && (
        <p className="lobby-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="lobby-notice" role="status">
          {message}
        </p>
      )}
      <div className="studio-inline">
        <button
          className="secondary-button"
          disabled={busy || !!gm?.game || players.length === 2}
          onClick={() => void addPlayers()}
        >
          Ajouter deux joueurs fictifs
        </button>
        <button
          className="primary-button"
          disabled={busy || !gm || !!gm.game}
          onClick={() => void install()}
        >
          {busy ? "Préparation…" : "Installer le jeu pour cet essai"}
        </button>
      </div>
      <div className="lab-links">
        <a
          className="primary-button"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir la régie du test ↗
        </a>
        {players.map((p) => (
          <a
            className="secondary-button"
            key={p.id}
            href={`${url.origin}/sessions/${id}/player/${p.id}#access=${p.token}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {p.name} ↗
          </a>
        ))}
        <a
          className="secondary-button"
          href={`${url.origin}/sessions/${id}/public`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Plateau du test ↗
        </a>
      </div>
      {gm && (
        <CopyLink
          label="Invitation du test pour un autre appareil"
          value={gm.joinUrl}
        />
      )}
      <button
        className="secondary-button"
        disabled={busy || !players.length}
        onClick={() => void probe()}
      >
        Vérifier le refus d’une action GM
      </button>
      <button
        className="secondary-button"
        onClick={() =>
          document
            .getElementById("creator-editor")
            ?.scrollIntoView({ block: "start" })
        }
      >
        Revenir à l’éditeur
      </button>
      <p className="lobby-hint">
        Ces liens joueurs sont privés et distincts. Conservez-les avant
        rechargement. « Rejouer cette expérience » dans la régie réinitialise
        les valeurs en conservant les joueurs. Pour figer une nouvelle
        définition, préparez un autre test depuis l’éditeur. Aucun privilège de
        développement n’est utilisé.
      </p>
    </section>
  );
}
