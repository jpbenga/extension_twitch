"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  undercoverSettingsSchema,
  type UndercoverSettings,
} from "@extension-twitch/contracts/official-games";
import { sessionAccessSchema } from "@extension-twitch/contracts/sessions";
import { NumberInput } from "./creator-fields";
import { ProductFrame } from "./product-frame";
import {
  post,
  commandId,
  randomToken,
  RequestFailure,
  requestMessage,
} from "../lib/session-client";
import { prepareLab, saveLab, type CreatorLab } from "../lib/creator-lab";

const pendingKey = "xt:official:pending";
const settingsKey = "xt:official:undercover:settings";
type Pending = {
  requestId: string;
  token: string;
  settings: UndercoverSettings;
  mode: "quick" | "invite";
  count: number;
};
export function OfficialGameSetup() {
  const router = useRouter(),
    flight = useRef(false);
  const [settings, setSettings] = useState<UndercoverSettings>(
    undercoverSettingsSchema.parse({}),
  );
  const [mode, setMode] = useState<"quick" | "invite">("quick"),
    [count, setCount] = useState(4);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const waiting = sessionStorage.getItem(pendingKey);
      if (waiting) {
        const attempt = JSON.parse(waiting) as Pending;
        setSettings(undercoverSettingsSchema.parse(attempt.settings));
        setMode(attempt.mode);
        setCount(attempt.count);
      }
      const saved = !waiting && sessionStorage.getItem(settingsKey);
      if (saved) {
        const result = undercoverSettingsSchema.safeParse(
          JSON.parse(saved) as unknown,
        );
        if (result.success) setSettings(result.data);
      }
    } catch {
      setError(
        "Le stockage de cet onglet est indisponible. Autorisez-le avant de lancer une partie.",
      );
    }
    setReady(true);
  }, []);
  function change<K extends keyof UndercoverSettings>(
    key: K,
    value: UndercoverSettings[K],
  ) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      sessionStorage.setItem(settingsKey, JSON.stringify(next));
    } catch {
      setError("Vos réglages ne peuvent pas être conservés dans cet onglet.");
    }
  }
  async function launch() {
    if (flight.current) return;
    setError("");
    const parsed = undercoverSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      setError(
        "Vérifiez les limites indiquées et choisissez deux mots différents, non vides (80 caractères maximum).",
      );
      return;
    }
    if (
      mode === "quick" &&
      (!Number.isInteger(count) ||
        count < 3 ||
        count > 12 ||
        settings["undercover-count"] * 2 >= count)
    ) {
      setError(
        "Prévoyez de 3 à 12 joueurs, avec moins d’Undercover que de civils.",
      );
      return;
    }
    flight.current = true;
    setBusy(true);
    try {
      const raw = sessionStorage.getItem(pendingKey);
      const saved: Pending | null = raw ? (JSON.parse(raw) as Pending) : null;
      // Uncertain responses must be retried with the exact request and credential.
      if (
        saved &&
        JSON.stringify({
          settings: saved.settings,
          mode: saved.mode,
          count: saved.count,
        }) !== JSON.stringify({ settings: parsed.data, mode, count })
      ) {
        setError(
          "Une préparation attend sa confirmation. Retrouvez vos réglages précédents pour la reprendre : ils viennent d’être restaurés.",
        );
        setSettings(saved.settings);
        setMode(saved.mode);
        setCount(saved.count);
        return;
      }
      const attempt: Pending = saved ?? {
        requestId: commandId(),
        token: randomToken(),
        settings: parsed.data,
        mode,
        count,
      };
      sessionStorage.setItem(pendingKey, JSON.stringify(attempt));
      const access = sessionAccessSchema.parse(
        await post("/official-games/undercover/sessions", attempt.token, {
          requestId: attempt.requestId,
          settings: attempt.settings,
        }),
      );
      const lab: CreatorLab = {
        sessionId: access.sessionId,
        token: attempt.token,
        gameId: "undercover",
        returnTo: "/play/undercover",
        mode: attempt.mode,
        demoPlayers: attempt.count,
        configuration: attempt.settings,
        players: [],
        ready: false,
        initialPhase: "preparation",
        started: false,
      };
      saveLab(lab);
      sessionStorage.removeItem(pendingKey);
      try {
        await prepareLab(lab);
      } catch {
        /* Exact pending commands are resumed by the laboratory. */
      }
      router.push(
        lab.mode === "invite"
          ? `/sessions/${lab.sessionId}/gm`
          : `/play/lab/${lab.sessionId}`,
      );
    } catch (e) {
      if (e instanceof RequestFailure && e.status < 500)
        sessionStorage.removeItem(pendingKey);
      setError(
        requestMessage(
          e,
          "La préparation n’a pas été confirmée. Vérifiez la connexion puis réessayez : la même demande sera reprise.",
        ),
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <ProductFrame>
      <div className="creator-page-title">
        <div>
          <span className="eyebrow">JOUER · PRÉPARER UNE PARTIE</span>
          <h1>Préparer Undercover</h1>
          <p>Choisissez quelques réglages, puis prenez les commandes.</p>
        </div>
        <Link href="/play" className="text-link">
          Changer de jeu
        </Link>
      </div>
      <section className="lobby-panel official-game-card game-undercover">
        <span className="eyebrow">RÈGLES DE DÉMONSTRATION</span>
        <details>
          <summary>Comment se déroule cette partie ?</summary>
          <p>
            Mots privés → indices oraux → vote unique → résultat. Pas de vote
            pour soi. Une égalité n’élimine personne. Les civils gagnent quand
            tous les Undercover sont éliminés ; les Undercover gagnent à la
            parité. Les camps sont révélés après élimination, les mots seulement
            à la fin. La limite de manches peut conduire à une partie nulle.
          </p>
        </details>
        {error && (
          <p role="alert" className="lobby-error">
            {error}
          </p>
        )}
        <form
          className="lobby-form"
          onSubmit={(e) => {
            e.preventDefault();
            void launch();
          }}
        >
          <label>
            Comment souhaitez-vous jouer ?
            <select
              aria-label="Comment souhaitez-vous jouer ?"
              value={mode}
              onChange={(e) => setMode(e.target.value as "quick" | "invite")}
              disabled={busy}
            >
              <option value="quick">
                Tester seul avec des joueurs de démonstration
              </option>
              <option value="invite">Inviter de vrais participants</option>
            </select>
          </label>
          {mode === "quick" ? (
            <label>
              Joueurs de démonstration
              <NumberInput
                label="Joueurs de démonstration"
                min={3}
                max={12}
                value={count}
                onChange={setCount}
                disabled={busy}
              />
            </label>
          ) : (
            <p>
              Partagez l’invitation, attendez vos 3 à 12 joueurs, puis préparez
              la partie depuis la régie.
            </p>
          )}
          <label>
            Mot des civils
            <input
              aria-label="Mot des civils"
              value={settings["civil-word"]}
              maxLength={80}
              onChange={(e) => change("civil-word", e.target.value)}
              disabled={busy}
            />
            <small>Information privée, réservée à la préparation GM.</small>
          </label>
          <label>
            Mot des Undercover
            <input
              aria-label="Mot des Undercover"
              value={settings["undercover-word"]}
              maxLength={80}
              onChange={(e) => change("undercover-word", e.target.value)}
              disabled={busy}
            />
          </label>
          <label>
            Nombre d’Undercover
            <NumberInput
              label="Nombre d’Undercover"
              min={1}
              max={5}
              value={settings["undercover-count"]}
              onChange={(value) => change("undercover-count", value)}
              disabled={busy}
            />
            <small>De 1 à 5, toujours moins que les civils.</small>
          </label>
          <label>
            Tours d’indices avant chaque vote
            <NumberInput
              label="Tours d’indices avant chaque vote"
              min={1}
              max={5}
              value={settings["clue-rounds"]}
              onChange={(value) => change("clue-rounds", value)}
              disabled={busy}
            />
            <small>
              De 1 à 5. Chaque joueur actif parle une fois par tour.
            </small>
          </label>
          <details>
            <summary>Limite de la partie</summary>
            <label>
              Maximum de manches
              <NumberInput
                label="Maximum de manches"
                min={1}
                max={30}
                value={settings["round-limit"]}
                onChange={(value) => change("round-limit", value)}
                disabled={busy}
              />
              <small>
                De 1 à 30, puis partie nulle si aucun camp n’a gagné.
              </small>
            </label>
          </details>
          <button
            className="primary-button"
            disabled={!ready || busy}
            aria-busy={busy}
          >
            {busy
              ? "Préparation de la partie…"
              : mode === "quick"
                ? "Lancer une partie de démonstration"
                : "Créer une partie avec mes invités"}
          </button>
        </form>
      </section>
    </ProductFrame>
  );
}
