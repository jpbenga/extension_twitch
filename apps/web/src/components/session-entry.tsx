"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  accessTokenSchema,
  createSessionSchema,
  invitationCodeSchema,
  joinSessionSchema,
  sessionAccessSchema,
} from "@extension-twitch/contracts/sessions";
import { gameIdSchema } from "@extension-twitch/contracts";
import {
  accessKey,
  commandId,
  post,
  randomToken,
  RequestFailure,
} from "../lib/session-client";

interface PendingEntry {
  token: string;
  input: {
    requestId: string;
    name?: string;
    title?: string;
    hostName?: string;
    gameId?: string;
  };
}

export function SessionEntry({ invitationCode }: { invitationCode?: string }) {
  const joining = invitationCode !== undefined;
  const [title, setTitle] = useState("Mon émission");
  const [hostName, setHostName] = useState("Game Master");
  const [gameId, setGameId] = useState("undercover");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef<PendingEntry | null>(null);
  const inFlight = useRef(false);
  const pendingKey = `xt:entry:${invitationCode ?? "create"}`;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(pendingKey);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("token" in parsed) ||
        !("input" in parsed)
      )
        return;
      const token = accessTokenSchema.parse(parsed.token);
      if (joining) {
        const input = joinSessionSchema.parse(parsed.input);
        pending.current = { token, input };
        setName(input.name);
      } else {
        const input = createSessionSchema.parse(parsed.input);
        pending.current = { token, input };
        setTitle(input.title);
        setHostName(input.hostName);
        setGameId(input.gameId);
      }
      setUncertain(true);
    } catch {
      setError(
        "Le brouillon local ne peut pas être restauré. Vérifiez le stockage de cet onglet.",
      );
    }
  }, [pendingKey, joining]);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const input = joining
        ? joinSessionSchema.parse({ requestId: commandId(), name })
        : createSessionSchema.parse({
            requestId: commandId(),
            title,
            hostName,
            gameId: gameIdSchema.parse(gameId),
          });
      const request = pending.current ?? { token: randomToken(), input };
      sessionStorage.setItem(pendingKey, JSON.stringify(request));
      pending.current = request;
      const path = joining
        ? `/invitations/${encodeURIComponent(invitationCode)}/join`
        : "/sessions";
      const result = sessionAccessSchema.parse(
        await post(path, request.token, request.input),
      );
      const role = joining ? `player:${result.participantId}` : "gm";
      sessionStorage.setItem(accessKey(result.sessionId, role), request.token);
      sessionStorage.removeItem(pendingKey);
      window.location.assign(
        joining
          ? `/sessions/${result.sessionId}/player/${result.participantId}`
          : `/sessions/${result.sessionId}/gm`,
      );
    } catch (failure) {
      if (failure instanceof RequestFailure && failure.status < 500) {
        pending.current = null;
        sessionStorage.removeItem(pendingKey);
        setUncertain(false);
      } else if (pending.current) setUncertain(true);
      setError(
        failure instanceof RequestFailure
          ? failure.message
          : pending.current
            ? "La confirmation n’est pas arrivée. Réessayez pour récupérer le même accès, sans doublon."
            : "Vérifiez les champs et autorisez le stockage privé de cet onglet.",
      );
      setBusy(false);
    } finally {
      inFlight.current = false;
    }
  }

  function openInvitation(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    let value = code.trim();
    if (value.includes("://")) {
      try {
        value = new URL(value).pathname.split("/").at(-1) ?? "";
      } catch {
        value = "";
      }
    }
    if (!invitationCodeSchema.safeParse(value).success) {
      setError(
        "Collez le code complet ou le lien d’invitation fourni par le GM.",
      );
      return;
    }
    window.location.assign(`/join/${encodeURIComponent(value)}`);
  }

  return (
    <main className="session-home session-shell">
      {process.env.NODE_ENV !== "production" && (
        <Link className="text-link" href="/lab">
          Ouvrir le laboratoire de développement ↗
        </Link>
      )}
      <header className="session-header">
        <Link className="session-brand" href="/">
          xt
          <span>
            Extension Twitch <small>STUDIO</small>
          </span>
        </Link>
        <Link href="/demo">Maquette visuelle ↗</Link>
      </header>
      <div className="lobby-heading">
        <span className="eyebrow">VOTRE PLATEAU, ENSEMBLE</span>
        <h1>
          {joining
            ? "Votre place vous attend."
            : "Votre émission commence ici."}
        </h1>
        <p>
          Sessions réelles · salon d’attente synchronisé · sans compte Twitch.
        </p>
      </div>
      <div className={`entry-grid ${joining ? "single" : ""}`}>
        <section className="lobby-panel">
          <h2>{joining ? "Rejoindre le plateau" : "Créer ma session"}</h2>
          <p>
            {joining
              ? "Choisissez un nom reconnaissable pour le GM. Un accès personnel sera créé dans cet onglet."
              : "Créez votre accès Game Master, puis invitez vos joueurs."}
          </p>
          <form onSubmit={(event) => void submit(event)} className="lobby-form">
            {joining ? (
              <label>
                Votre nom
                <input
                  name="playerName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={1}
                  maxLength={32}
                  required
                  autoComplete="nickname"
                  disabled={busy || uncertain}
                />
              </label>
            ) : (
              <>
                <label>
                  Nom de l’émission
                  <input
                    name="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={32}
                    required
                    disabled={busy || uncertain}
                  />
                </label>
                <label>
                  Votre nom de Game Master
                  <input
                    name="hostName"
                    value={hostName}
                    onChange={(event) => setHostName(event.target.value)}
                    maxLength={32}
                    required
                    autoComplete="nickname"
                    disabled={busy || uncertain}
                  />
                </label>
                <label>
                  Jeu prévu
                  <select
                    name="gameId"
                    value={gameId}
                    onChange={(event) => setGameId(event.target.value)}
                    disabled={busy || uncertain}
                  >
                    <option value="undercover">Undercover</option>
                    <option value="auctions">Enchères de personnages</option>
                    <option value="spy">Qui est l’espion ?</option>
                  </select>
                </label>
              </>
            )}
            <button className="primary-button" disabled={busy}>
              {busy
                ? "Enregistrement…"
                : uncertain
                  ? "Réessayer la même demande"
                  : joining
                    ? "Rejoindre la session"
                    : "Créer ma session"}
            </button>
          </form>
          <p className="lobby-hint">
            Votre accès privé reste dans cet onglet. Conservez ensuite votre
            lien de récupération.
          </p>
        </section>
        {!joining && (
          <section className="lobby-panel">
            <span className="eyebrow">VOUS ÊTES INVITÉ ?</span>
            <h2>Rejoindre une émission</h2>
            <form onSubmit={openInvitation} className="lobby-form">
              <label>
                Code ou lien d’invitation
                <input
                  name="invitation"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Collez l’invitation du GM"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <button className="secondary-button">Ouvrir l’invitation</button>
            </form>
            <p className="lobby-hint">
              Chaque inscription crée une identité distincte. Une invitation ne
              donne jamais accès à la régie.
            </p>
          </section>
        )}
      </div>
      {error && (
        <p className="lobby-error" role="alert">
          {error}
        </p>
      )}
      <aside className="lobby-scope">
        <strong>Jalon A · le salon est ouvert</strong>
        <p>
          Créez une session, rejoignez à plusieurs et vérifiez les états « prêt
          » sur le plateau. Les règles, les mots secrets, les votes et le
          lancement d’une partie arriveront au jalon C.
        </p>
      </aside>
    </main>
  );
}
