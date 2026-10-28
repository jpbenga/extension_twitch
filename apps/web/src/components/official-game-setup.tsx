"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  undercoverSettingsSchema,
  type UndercoverSettings,
} from "@extension-twitch/contracts/official-games";
import { sessionAccessSchema } from "@extension-twitch/contracts/sessions";
import {
  createUndercoverLayout,
  undercoverLayoutSchema,
  maximumUndercover,
  type UndercoverLayout,
} from "@extension-twitch/contracts/undercover-layout";
import { UndercoverLayoutEditor } from "./undercover-layout-editor";
import { layoutPreparationPreview } from "../lib/layout-preview";
import {
  applicationDefaultTheme,
  themeIdSchema,
  type ThemeId,
} from "@extension-twitch/contracts/themes";
import { BroadcastThemeSelect } from "./application-theme";
import { NumberInput } from "./creator-fields";
import { HomeIcon } from "./home-icon";
import { ThemeControl } from "./application-theme";
import "../app/stitch-surfaces.css";
import "../app/prepare-undercover.css";
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
  overlayLayout?: UndercoverLayout;
  broadcastTheme?: ThemeId;
};
export function OfficialGameSetup() {
  const router = useRouter(),
    flight = useRef(false);
  const [settings, setSettings] = useState<UndercoverSettings>(
    undercoverSettingsSchema.parse({}),
  );
  const [overlayLayout, setOverlayLayout] = useState<UndercoverLayout>(
    createUndercoverLayout(),
  );
  const [broadcastTheme, setBroadcastTheme] = useState<ThemeId>(
    applicationDefaultTheme,
  );
  const [mode, setMode] = useState<"quick" | "invite">("quick"),
    [count, setCount] = useState(4);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [pendingMode, setPendingMode] = useState<Pending["mode"] | null>(null);
  const errorBox = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorBox.current?.focus();
  }, [error]);
  useEffect(() => {
    try {
      const waiting = sessionStorage.getItem(pendingKey);
      if (waiting) {
        const attempt = JSON.parse(waiting) as Pending;
        setSettings(undercoverSettingsSchema.parse(attempt.settings));
        setMode(attempt.mode);
        setPendingMode(attempt.mode);
        setCount(attempt.count);
        if (attempt.broadcastTheme)
          setBroadcastTheme(themeIdSchema.parse(attempt.broadcastTheme));
        if (attempt.overlayLayout)
          setOverlayLayout(undercoverLayoutSchema.parse(attempt.overlayLayout));
      }
      const preferences =
        !waiting &&
        sessionStorage.getItem("xt:official:undercover:preferences");
      if (preferences) {
        const p = JSON.parse(preferences) as { count: number; mode: string };
        if (Number.isInteger(p.count) && p.count >= 3 && p.count <= 12)
          setCount(p.count);
        if (p.mode === "quick" || p.mode === "invite") setMode(p.mode);
      }
      const savedTheme =
        !waiting &&
        sessionStorage.getItem("xt:official:undercover:broadcast-theme");
      if (savedTheme && themeIdSchema.safeParse(savedTheme).success)
        setBroadcastTheme(themeIdSchema.parse(savedTheme));
      const savedLayout =
        !waiting && sessionStorage.getItem("xt:official:undercover:layout");
      if (savedLayout)
        setOverlayLayout(
          undercoverLayoutSchema.parse(JSON.parse(savedLayout) as unknown),
        );
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
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(
        "xt:official:undercover:preferences",
        JSON.stringify({ mode, count }),
      );
    } catch {
      setError("Vos choix ne peuvent pas être conservés dans cet onglet.");
    }
  }, [ready, mode, count]);
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
  function changeLayout(next: UndercoverLayout) {
    setOverlayLayout(next);
    try {
      sessionStorage.setItem(
        "xt:official:undercover:layout",
        JSON.stringify(next),
      );
    } catch {
      setError("La disposition ne peut pas être conservée dans cet onglet.");
    }
  }
  async function launch(launchMode: Pending["mode"]) {
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
      !Number.isInteger(count) ||
      count < 3 ||
      count > 12 ||
      (launchMode === "quick" && settings["undercover-count"] * 2 >= count)
    ) {
      setError(
        "Prévoyez de 3 à 12 joueurs, avec moins d’Undercover que de civils.",
      );
      return;
    }
    flight.current = true;
    setBusy(true);
    try {
      let raw: string | null;
      try {
        raw = sessionStorage.getItem(pendingKey);
      } catch {
        setError(
          "Le stockage de cet onglet est indisponible. Autorisez-le avant de lancer une partie.",
        );
        return;
      }
      const saved: Pending | null = raw ? (JSON.parse(raw) as Pending) : null;
      // Uncertain responses must be retried with the exact request and credential.
      if (
        saved &&
        JSON.stringify({
          settings: saved.settings,
          mode: saved.mode,
          count: saved.count,
          overlayLayout: saved.overlayLayout ?? createUndercoverLayout(),
          broadcastTheme: saved.broadcastTheme ?? applicationDefaultTheme,
        }) !==
          JSON.stringify({
            settings: parsed.data,
            mode: launchMode,
            count,
            overlayLayout,
            broadcastTheme,
          })
      ) {
        setError(
          "Une préparation attend sa confirmation. Retrouvez vos réglages précédents pour la reprendre : ils viennent d’être restaurés.",
        );
        setSettings(saved.settings);
        setMode(saved.mode);
        setCount(saved.count);
        setOverlayLayout(saved.overlayLayout ?? createUndercoverLayout());
        setBroadcastTheme(saved.broadcastTheme ?? applicationDefaultTheme);
        return;
      }
      const attempt: Pending = saved ?? {
        requestId: commandId(),
        token: randomToken(),
        settings: parsed.data,
        mode: launchMode,
        count,
        overlayLayout,
        broadcastTheme,
      };
      try {
        sessionStorage.setItem(pendingKey, JSON.stringify(attempt));
      } catch {
        setError(
          "La préparation ne peut pas être conservée dans cet onglet. Autorisez le stockage puis réessayez.",
        );
        return;
      }
      setMode(attempt.mode);
      setPendingMode(attempt.mode);
      const access = sessionAccessSchema.parse(
        await post("/official-games/undercover/sessions", attempt.token, {
          requestId: attempt.requestId,
          settings: attempt.settings,
          ...(attempt.broadcastTheme
            ? { broadcastTheme: attempt.broadcastTheme }
            : {}),
          ...(attempt.overlayLayout
            ? { overlayLayout: attempt.overlayLayout }
            : {}),
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
      setPendingMode(null);
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
      if (e instanceof RequestFailure && e.status < 500) {
        try {
          sessionStorage.removeItem(pendingKey);
          setPendingMode(null);
        } catch {
          // Keep the uncertain receipt when storage cannot confirm its removal.
        }
      }
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
    <main
      className="stitch-page prepare-undercover"
      data-experience="preparation"
    >
      <header className="stitch-header">
        <div className="prepare-header-inner">
          <Link href="/" className="stitch-brand">
            <span className="prepare-brand-mark">
              <HomeIcon name="game" />
            </span>
            <span>Extension Twitch</span>
          </Link>
          <ThemeControl icon={<HomeIcon name="palette" />} />
        </div>
      </header>
      <div className="prepare-workspace">
        <nav className="prepare-back" aria-label="Fil d’Ariane">
          <Link href="/play">
            <span aria-hidden="true">‹</span>
            <span className="prepare-desktop-label">Tous les jeux</span>
            <span className="prepare-mobile-label">Undercover</span>
          </Link>
          <span className="prepare-desktop-label">/ &nbsp; Undercover</span>
        </nav>
        <div className="prepare-intro">
          <h1>
            <span className="prepare-desktop-label">Préparer votre partie</span>
            <span className="prepare-mobile-label">Préparer la partie</span>
          </h1>
          <p>Quelques réglages, puis vous pourrez inviter vos joueurs.</p>
        </div>
        {error && (
          <p
            ref={errorBox}
            tabIndex={-1}
            className="lobby-error prepare-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {pendingMode && !busy && (
          <p className="prepare-pending" role="status">
            Une préparation{" "}
            {pendingMode === "quick"
              ? "de démonstration "
              : "avec des invités "}
            attend sa confirmation. Reprenez-la sans créer une nouvelle demande.
          </p>
        )}
        <form
          className="prepare-form"
          onInvalidCapture={(e) => {
            let disclosure = (e.target as HTMLElement).closest("details");
            while (disclosure) {
              disclosure.open = true;
              disclosure = disclosure.parentElement?.closest("details") ?? null;
            }
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void launch(pendingMode ?? "invite");
          }}
        >
          <div className="prepare-controls">
            <fieldset className="prepare-essentials" disabled={!ready || busy}>
              <legend className="prepare-sr-only">
                Réglages de la partie Undercover
              </legend>
              <div className="prepare-setting">
                <div className="prepare-setting-title">
                  <span>Participants</span>
                  <small>3 à 12</small>
                </div>
                <div className="prepare-stepper">
                  <button
                    type="button"
                    aria-label="Diminuer le nombre de participants"
                    disabled={count <= 3}
                    onClick={() => setCount(Math.max(3, count - 1))}
                  >
                    −
                  </button>
                  <div>
                    <NumberInput
                      label="Participants prévus"
                      min={3}
                      max={12}
                      value={count}
                      onChange={setCount}
                      disabled={busy}
                    />
                    <span>prévus</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Augmenter le nombre de participants"
                    disabled={count >= 12}
                    onClick={() => setCount(Math.min(12, count + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <fieldset className="prepare-setting prepare-clues">
                <legend className="prepare-sr-only">
                  Tours d’indices avant chaque vote
                </legend>
                <div className="prepare-setting-title">
                  <span>Tours d’indices</span>
                  <small>avant chaque vote</small>
                </div>
                <div className="prepare-segments">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="clue-rounds"
                        aria-label={`${value} ${value === 1 ? "tour" : "tours"} d’indices`}
                        checked={settings["clue-rounds"] === value}
                        onChange={() => change("clue-rounds", value)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="prepare-setting">
                <div className="prepare-setting-title">Mode</div>
                <div className="prepare-mode">
                  <strong>Classique</strong>
                  <p>Mode standard d’Undercover.</p>
                </div>
              </div>
            </fieldset>
            <div className="prepare-options">
              <details className="prepare-option" data-prepare-option="roles">
                <summary>
                  Rôles et distribution <HomeIcon name="chevron" />
                </summary>
                <div className="prepare-option-body">
                  <label>
                    Nombre d’Undercover
                    <NumberInput
                      label="Nombre d’Undercover"
                      min={1}
                      max={5}
                      value={settings["undercover-count"]}
                      onChange={(v) => change("undercover-count", v)}
                      disabled={busy}
                    />
                  </label>
                  <section aria-label="Règles actives">
                    {settings["undercover-count"] * 2 < count && (
                      <p>
                        {count - settings["undercover-count"]} civils et{" "}
                        {settings["undercover-count"]} Undercover pour
                        l’effectif prévu.
                      </p>
                    )}
                    <p>
                      Au moins {settings["undercover-count"] * 2 + 1} joueurs
                      pour cette répartition. L’effectif réel sera vérifié au
                      salon. Jusqu’à {maximumUndercover(count)} Undercover pour{" "}
                      {count} participants prévus.
                    </p>
                  </section>
                  <label>
                    Maximum de manches
                    <NumberInput
                      label="Maximum de manches"
                      min={1}
                      max={30}
                      value={settings["round-limit"]}
                      onChange={(v) => change("round-limit", v)}
                      disabled={busy}
                    />
                    <small>
                      De 1 à 30, puis partie nulle si aucun camp n’a gagné.
                    </small>
                  </label>
                  <details className="prepare-rules">
                    <summary>Comment se déroule cette partie ?</summary>
                    <p>
                      Mots privés → indices oraux → vote unique → résultat. Pas
                      de vote pour soi. Une égalité n’élimine personne. Les
                      civils gagnent quand tous les Undercover sont éliminés ;
                      les Undercover gagnent à la parité. Les camps sont révélés
                      après élimination, les mots seulement à la fin. La
                      distribution est aléatoire, sans rôle blanc ni répartition
                      manuelle.
                    </p>
                  </details>
                </div>
              </details>
              <details className="prepare-option" data-prepare-option="words">
                <summary>
                  Mots <HomeIcon name="chevron" />
                </summary>
                <div className="prepare-option-body">
                  <p>
                    Informations privées, réservées à la préparation GM.
                    Choisissez deux mots différents.
                  </p>
                  <label>
                    Mot des civils
                    <input
                      aria-label="Mot des civils"
                      value={settings["civil-word"]}
                      maxLength={80}
                      onChange={(e) => change("civil-word", e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <label>
                    Mot des Undercover
                    <input
                      aria-label="Mot des Undercover"
                      value={settings["undercover-word"]}
                      maxLength={80}
                      onChange={(e) =>
                        change("undercover-word", e.target.value)
                      }
                      disabled={busy}
                    />
                  </label>
                </div>
              </details>
              <details
                className="prepare-option layout-setup-section"
                data-prepare-option="broadcast"
              >
                <summary>
                  Plateau de diffusion <HomeIcon name="chevron" />
                </summary>
                <div className="prepare-option-body">
                  <p>
                    Ces noms sont des exemples de disposition. Aucun joueur
                    n’est créé ici. Vos ajustements sont conservés dans cet
                    onglet, puis enregistrés avec la partie.
                  </p>
                  <BroadcastThemeSelect
                    value={broadcastTheme}
                    disabled={busy}
                    onChange={(theme) => {
                      setBroadcastTheme(theme);
                      try {
                        sessionStorage.setItem(
                          "xt:official:undercover:broadcast-theme",
                          theme,
                        );
                      } catch {
                        setError(
                          "Le thème de l’émission ne peut pas être conservé dans cet onglet.",
                        );
                      }
                    }}
                  />
                  <p className="prepare-mobile-label">
                    Sur cet aperçu, utilisez les réglages ci-dessous pour
                    ajuster les blocs.
                  </p>
                  <UndercoverLayoutEditor
                    layout={overlayLayout}
                    onChange={changeLayout}
                    view={{
                      ...layoutPreparationPreview(count),
                      broadcastTheme,
                    }}
                    disabled={busy}
                  />
                </div>
              </details>
            </div>
            <details
              className="prepare-laboratory"
              data-prepare-option="laboratory"
            >
              <summary>
                Tester avec le laboratoire <HomeIcon name="chevron" />
              </summary>
              <div className="prepare-option-body">
                <p>
                  Un essai séparé avec des joueurs de démonstration et de
                  véritables accès. Pour vos invités, utilisez « Préparer la
                  partie ».
                </p>
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
                <button
                  type="button"
                  className="stitch-button"
                  disabled={
                    !ready ||
                    busy ||
                    (pendingMode !== null && pendingMode !== "quick")
                  }
                  onClick={(e) => {
                    if (e.currentTarget.form?.reportValidity())
                      void launch("quick");
                  }}
                >
                  Lancer une partie de démonstration
                </button>
              </div>
            </details>
          </div>
          <aside className="prepare-summary" aria-label="Votre partie">
            <div className="prepare-summary-heading">
              <span>Votre partie</span>
              <h2>Undercover</h2>
            </div>
            <dl>
              <div>
                <dt>Format :</dt>
                <dd>Classique</dd>
              </div>
              <div>
                <dt>Effectif prévu :</dt>
                <dd>
                  {count}{" "}
                  <span className="prepare-desktop-label">participants</span>
                  <span className="prepare-mobile-label">
                    participants prévus
                  </span>
                </dd>
              </div>
              <div>
                <dt>Rythme :</dt>
                <dd>
                  {settings["clue-rounds"]}{" "}
                  {settings["clue-rounds"] === 1 ? "tour" : "tours"} d’indices
                </dd>
              </div>
            </dl>
            <span className="prepare-mobile-label prepare-summary-mode">
              Classique
            </span>
            <button
              className="stitch-button stitch-primary prepare-submit"
              disabled={!ready || busy}
              aria-busy={busy}
            >
              {busy
                ? "Préparation de la partie…"
                : pendingMode
                  ? "Reprendre la préparation"
                  : "Préparer la partie"}
              <HomeIcon name="arrow" />
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}
