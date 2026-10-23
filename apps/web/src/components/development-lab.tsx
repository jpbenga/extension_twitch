"use client";

import Link from "next/link";
import { useState } from "react";
import { gameExamplesSchema } from "@extension-twitch/contracts/game-definition";
import {
  gmSessionSchema,
  sessionAccessSchema,
  sessionViewSchema,
  type GmSessionView,
} from "@extension-twitch/contracts/sessions";
import {
  commandId,
  randomToken,
  post,
  readResponse,
} from "../lib/session-client";

interface Demo {
  gmToken: string;
  gm: GmSessionView;
  players: { name: string; id: string; token: string }[];
}
export function DevelopmentLab() {
  const [demo, setDemo] = useState<Demo | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [example, setExample] = useState("collective-pulse");
  const [origin, setOrigin] = useState("");
  async function create() {
    setBusy(true);
    setMessage("");
    try {
      const definitions = gameExamplesSchema.parse(
        await readResponse(await fetch("/api/server/game-examples")),
      );
      const definition = definitions.find((d) => d.id === example);
      if (!definition) throw new Error("Exemple indisponible");
      const gmToken = randomToken();
      const created = sessionAccessSchema.parse(
        await post("/sessions", gmToken, {
          requestId: commandId(),
          title: "Démo · Laboratoire",
          hostName: "GM fictif",
          gameId: definition.id,
        }),
      );
      const privatePath = `/sessions/${created.sessionId}/private`;
      const readGm = async () =>
        gmSessionSchema.parse(
          await readResponse(
            await fetch(`/api/server${privatePath}`, {
              headers: { Authorization: `Bearer ${gmToken}` },
              cache: "no-store",
            }),
          ),
        );
      let gm = await readGm();
      const players: Demo["players"] = [];
      for (const name of ["Fictif · Nova", "Fictif · Atlas"]) {
        const token = randomToken();
        const joined = sessionAccessSchema.parse(
          await post(`/invitations/${gm.invitationCode}/join`, token, {
            requestId: commandId(),
            name,
          }),
        );
        if (!joined.participantId) throw new Error("Identité absente");
        players.push({ name, id: joined.participantId, token });
      }
      gm = await readGm();
      gm = gmSessionSchema.parse(
        await post(`/sessions/${gm.sessionId}/commands`, gmToken, {
          commandId: commandId(),
          expectedVersion: gm.version,
          command: {
            type: "game.configure",
            definition,
            configuration: {},
            assets: [],
          },
        }),
      );
      setDemo({ gmToken, gm, players });
      setOrigin(new URL(gm.publicUrl).origin);
      setMessage(
        "Session créée par les API réelles. Ouvrez les vues puis pilotez les actions dans la régie.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Création impossible. Réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function probe() {
    if (!demo) return;
    setBusy(true);
    try {
      const player = demo.players[0]!;
      const latest = sessionViewSchema.parse(
        await readResponse(
          await fetch(`/api/server/sessions/${demo.gm.sessionId}/private`, {
            headers: { Authorization: `Bearer ${player.token}` },
            cache: "no-store",
          }),
        ),
      );
      await post(`/sessions/${demo.gm.sessionId}/commands`, player.token, {
        commandId: commandId(),
        expectedVersion: latest.version,
        command: { type: "session.rename", title: "Usurpation refusée" },
      });
      setMessage("Erreur : une opération GM a été acceptée pour un joueur.");
    } catch (e) {
      setMessage(
        e instanceof Error && "status" in e && e.status === 403
          ? "Refus attendu : le serveur interdit au joueur de renommer la session (403)."
          : "Test interrompu : ouvrez les vues pour vérifier les accès.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="session-shell session-entry">
      <Link className="text-link" href="/">
        ← Accueil
      </Link>
      <header className="lobby-heading">
        <span className="eyebrow">DÉVELOPPEMENT UNIQUEMENT</span>
        <h1>Le laboratoire</h1>
        <p>
          De vrais clients, de vraies commandes. Chaque invité fictif possède
          son propre accès privé. Ce laboratoire conserve leurs accès en mémoire
          dans cet onglet : ne le partagez pas.
        </p>
      </header>
      <section className="lobby-panel">
        <h2>Créer un essai</h2>
        <label className="role-assignment">
          Expérience
          <select
            value={example}
            disabled={busy}
            onChange={(e) => setExample(e.target.value)}
          >
            <option value="collective-pulse">Impulsion collective</option>
            <option value="answer-box">La boîte à réponses</option>
          </select>
        </label>
        <button
          className="primary-button"
          disabled={busy}
          onClick={() => void create()}
        >
          {busy ? "Préparation…" : "Créer une démonstration réelle"}
        </button>
        <p className="lobby-hint">
          Deux joueurs fictifs sont inscrits avant l’installation de la
          définition. Pour utiliser un téléphone, lancez npm run dev:lan et
          ouvrez /lab depuis l’adresse réseau.
        </p>
      </section>
      {message && (
        <p className="lobby-notice" role="status">
          {message}
        </p>
      )}
      {demo && (
        <section className="lobby-panel lab-links">
          <h2>Ouvrir les interfaces</h2>
          <a
            className="primary-button"
            target="_blank"
            rel="noopener noreferrer"
            href={`${origin}/sessions/${demo.gm.sessionId}/gm#access=${demo.gmToken}`}
          >
            Régie GM ↗
          </a>
          {demo.players.map((p) => (
            <a
              className="secondary-button"
              key={p.id}
              target="_blank"
              rel="noopener noreferrer"
              href={`${origin}/sessions/${demo.gm.sessionId}/player/${p.id}#access=${p.token}`}
            >
              {p.name} ↗
            </a>
          ))}
          <a
            className="secondary-button"
            href={demo.gm.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Plateau public ↗
          </a>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => void probe()}
          >
            Tester une action interdite
          </button>
          <p>
            Dans la régie : « Rejouer cette expérience » conserve les joueurs ;
            « Réinitialiser le salon » révoque leurs accès et retire la
            définition. Rechargez ce laboratoire pour effacer ses liens privés
            en mémoire.
          </p>
        </section>
      )}
      <p className="lobby-hint">
        Validation humaine iPhone en attente. Aucune connexion Twitch, aucun
        média transféré et aucun paiement.
      </p>
    </main>
  );
}
