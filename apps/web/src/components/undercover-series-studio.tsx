"use client";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { undercoverSettingsSchema } from "@extension-twitch/contracts/official-games";
import {
  createUndercoverLayout,
  undercoverLayoutSchema,
  maximumUndercover,
} from "@extension-twitch/contracts/undercover-layout";
import { themeIdSchema } from "@extension-twitch/contracts/themes";
import { HomeIcon } from "./home-icon";
import { ThemeControl, BroadcastThemeSelect } from "./application-theme";
import { NumberInput as SharedNumberInput } from "./creator-fields";
import { UndercoverLayoutEditor } from "./undercover-layout-editor";
import { layoutPreparationPreview } from "../lib/layout-preview";
import {
  randomToken,
  RequestFailure,
  requestMessage,
  accessKey,
} from "../lib/session-client";
import { useUndercoverSeries } from "../lib/use-undercover-series";
import {
  copyPreparation,
  deviceImagesNotice,
  getSeriesImage,
  movePreparation,
  newPreparation,
  newSeries,
  preparationName,
  prepareSeriesImage,
  saveSeriesImage,
  validatedPreparation,
  type SeriesLibrary,
  type UndercoverPreparation,
  type UndercoverSeries,
} from "../lib/undercover-series";
import {
  createSeriesSession,
  makeSeriesAttempt,
  seriesAttemptSchema,
  uploadPreparationImages,
  type SeriesAttempt,
} from "../lib/undercover-series-launch";
import "../app/stitch-surfaces.css";
import "../app/prepare-undercover.css";
import "../app/undercover-series.css";

/** Invalid numeric text stays editable, but never corrupts the durable library. */
function NumberInput(props: ComponentProps<typeof SharedNumberInput>) {
  return (
    <SharedNumberInput
      {...props}
      onChange={(v) => {
        if (
          Number.isInteger(v) &&
          (props.min === undefined || v >= props.min) &&
          (props.max === undefined || v <= props.max)
        )
          props.onChange(v);
      }}
    />
  );
}
type Screen = "prepare" | "edit" | "series" | "reuse" | "ready";
const pendingKey = "xt:official:pending";
function ImagePreview({
  id,
  label,
  large = false,
}: {
  id?: string | undefined;
  label: string;
  large?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null),
    [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true,
      current: string | undefined;
    setUrl(null);
    setMissing(false);
    if (id)
      void getSeriesImage(id)
        .then((blob) => {
          if (!active) return;
          if (blob) {
            current = URL.createObjectURL(blob);
            setUrl(current);
          } else setMissing(true);
        })
        .catch(() => {
          if (active) setMissing(true);
        });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [id]);
  return (
    <div
      className={`series-image ${large ? "is-large" : ""} ${missing ? "is-missing" : ""}`}
    >
      {url ? (
        <img
          src={url}
          alt={label}
          onError={() => {
            setUrl(null);
            setMissing(true);
          }}
        />
      ) : (
        <>
          <HomeIcon name={missing ? "hidden" : "game"} />
          {large && (
            <span>{missing ? "Image à reconnecter" : "Image facultative"}</span>
          )}
        </>
      )}
    </div>
  );
}
function DeviceNote() {
  return (
    <p className="series-device-note">
      <HomeIcon name="info" />
      {deviceImagesNotice}
    </p>
  );
}
export function UndercoverSeriesStudio() {
  const router = useRouter(),
    store = useUndercoverSeries();
  const [screen, setScreen] = useState<Screen>("prepare"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null),
    [editorReturn, setEditorReturn] = useState<Screen>("prepare"),
    [reuseId, setReuseId] = useState<string | null>(null),
    [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false),
    [pending, setPending] = useState<SeriesAttempt | null>(null),
    [missing, setMissing] = useState<string[]>([]);
  const [reuseNames, setReuseNames] = useState({ a: "", b: "" }),
    [undo, setUndo] = useState<{
      preparation: UndercoverPreparation;
      index: number;
    } | null>(null);
  const flight = useRef(false),
    booted = useRef(false),
    errorRef = useRef<HTMLParagraphElement>(null),
    returnFocus = useRef<HTMLButtonElement | null>(null);
  const library = store.library,
    series =
      library?.series.find((s) => s.id === library.selectedSeriesId) ??
      library?.series[0];
  const draft = series?.draft;
  useEffect(() => {
    if (error || store.error) errorRef.current?.focus();
  }, [error, store.error]);
  useEffect(() => {
    if (!library || booted.current) return;
    booted.current = true;
    const q = new URLSearchParams(location.search);
    const wanted = q.get("series");
    const existing = library.series.find((s) => s.id === wanted);
    const view = q.get("view");
    if (existing && existing.id !== library.selectedSeriesId)
      void store
        .update((l) => ({ ...l, selectedSeriesId: existing.id }))
        .catch(() => {});
    if (wanted && !existing)
      setNotice(
        "Retrouvez cette série sur l’appareil où vous l’avez préparée.",
      );
    setScreen(
      view === "series" ||
        view === "ready" ||
        view === "prepare" ||
        view === "edit"
        ? view
        : series?.preparations.length
          ? "series"
          : "prepare",
    );
    if (view === "edit") {
      const savedEdit = (existing ?? series)?.preparations.find(
        (p) => p.id === q.get("editing"),
      );
      setEditingId(savedEdit?.id ?? null);
      setEditorReturn(savedEdit ? "series" : "prepare");
    }
    try {
      const raw = sessionStorage.getItem(pendingKey);
      if (raw) {
        const saved = seriesAttemptSchema.parse(JSON.parse(raw) as unknown);
        setPending(saved);
        if (series) {
          const target =
            library.series.find((s) => s.id === saved.preparation?.series.id) ??
            series;
          void store
            .update((l) => ({
              ...l,
              selectedSeriesId: target.id,
              series: l.series.map((s) =>
                s.id === target.id
                  ? {
                      ...s,
                      draft: saved.snapshot
                        ? structuredClone(saved.snapshot)
                        : {
                            ...s.draft,
                            count: saved.count,
                            settings: saved.settings,
                            contents: {
                              a: {
                                ...s.draft.contents.a,
                                name: saved.settings["civil-word"],
                              },
                              b: {
                                ...s.draft.contents.b,
                                name: saved.settings["undercover-word"],
                              },
                            },
                            overlayLayout:
                              saved.overlayLayout ?? createUndercoverLayout(),
                            broadcastTheme:
                              saved.broadcastTheme ?? s.draft.broadcastTheme,
                          },
                    }
                  : s,
              ),
            }))
            .catch((e) => setError(e.message));
        }
      } else if (
        series &&
        !series.preparations.length &&
        library.revision === 1
      ) {
        const settings = sessionStorage.getItem(
          "xt:official:undercover:settings",
        );
        const preferences = sessionStorage.getItem(
          "xt:official:undercover:preferences",
        );
        const theme = sessionStorage.getItem(
          "xt:official:undercover:broadcast-theme",
        );
        const layout = sessionStorage.getItem("xt:official:undercover:layout");
        const result = settings
          ? undercoverSettingsSchema.safeParse(JSON.parse(settings))
          : null;
        const p = preferences
          ? (JSON.parse(preferences) as { count?: number })
          : {};
        if (result?.success || p.count || theme || layout)
          void changeSeries((s) => ({
            ...s,
            draft: {
              ...s.draft,
              ...(result?.success
                ? {
                    settings: result.data,
                    contents: {
                      a: { name: result.data["civil-word"] },
                      b: { name: result.data["undercover-word"] },
                    },
                  }
                : {}),
              ...(p.count && p.count >= 3 && p.count <= 12
                ? { count: p.count }
                : {}),
              ...(theme && themeIdSchema.safeParse(theme).success
                ? { broadcastTheme: themeIdSchema.parse(theme) }
                : {}),
              ...(layout
                ? {
                    overlayLayout: undercoverLayoutSchema.parse(
                      JSON.parse(layout),
                    ),
                  }
                : {}),
            },
          }));
      }
    } catch {
      setError(
        "Le stockage de cet onglet est indisponible. Autorisez-le avant de lancer une partie.",
      );
    }
  }, [library]);
  useEffect(() => {
    if (!series) return;
    let active = true;
    void Promise.all(
      series.preparations
        .flatMap((p) =>
          (["a", "b"] as const).flatMap((side) =>
            p.contents[side].imageId
              ? [{ id: p.id, image: p.contents[side].imageId! }]
              : [],
          ),
        )
        .map(async (x) => ({
          id: x.id,
          found: await getSeriesImage(x.image).catch(() => null),
        })),
    ).then((list) => {
      if (active)
        setMissing([...new Set(list.filter((x) => !x.found).map((x) => x.id))]);
    });
    return () => {
      active = false;
    };
  }, [series]);
  function go(next: Screen, editId?: string) {
    setScreen(next);
    setError("");
    setNotice("");
    if (series)
      history.replaceState(
        null,
        "",
        `/play/undercover?series=${series.id}&view=${next}${editId ? `&editing=${editId}` : ""}`,
      );
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function changeSeries(
    change: (s: UndercoverSeries) => UndercoverSeries,
  ) {
    if (!series) return false;
    try {
      await store.update((l) => ({
        ...l,
        series: l.series.map((s) => (s.id === series.id ? change(s) : s)),
      }));
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Vos changements restent affichés. Réessayez.",
      );
      return false;
    }
  }
  function changeDraft(
    change: (p: UndercoverPreparation) => UndercoverPreparation,
  ) {
    void changeSeries((s) => ({
      ...s,
      draft: { ...change(s.draft), updatedAt: new Date().toISOString() },
    }));
  }
  function edit(p?: UndercoverPreparation) {
    if (!series) return;
    returnFocus.current =
      document.activeElement instanceof HTMLButtonElement
        ? document.activeElement
        : null;
    setEditingId(p?.id ?? null);
    setEditorReturn(p ? "series" : "prepare");
    if (p) void changeSeries((s) => ({ ...s, draft: structuredClone(p) }));
    go("edit", p?.id);
  }
  function validFields() {
    const invalid = document.querySelector<HTMLInputElement>(
      ".series-studio input:invalid",
    );
    if (!invalid) return true;
    for (
      let parent = invalid.parentElement;
      parent;
      parent = parent.parentElement
    )
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    invalid.reportValidity();
    setError(
      "Vérifiez les nombres : 3 à 12 participants, 1 à 5 tours, 1 à 5 Undercover et 1 à 30 manches.",
    );
    return false;
  }
  async function addDraft() {
    if (!series || !draft || !validFields()) return;
    if (series.preparations.length >= 100) {
      setError(
        "Cette série contient déjà 100 parties. Créez une autre série pour continuer.",
      );
      return;
    }
    try {
      const settings = validatedPreparation(draft);
      const p = { ...draft, settings, updatedAt: new Date().toISOString() };
      await store.update((l) => ({
        ...l,
        series: l.series.map((s) =>
          s.id === series.id
            ? {
                ...s,
                preparations: [...s.preparations, p],
                draft: newPreparation(settings),
              }
            : s,
        ),
        history: [
          { ...structuredClone(p), seriesTitle: series.title },
          ...l.history.filter((h) => h.id !== p.id),
        ].slice(0, 500),
      }));
      go("series");
      setNotice("Partie ajoutée à la série.");
    } catch {
      setError(
        "Choisissez deux noms différents et vérifiez les réglages avant d’ajouter la partie.",
      );
    }
  }
  async function saveEditor() {
    if (!series || !draft || !validFields()) return;
    try {
      const settings = validatedPreparation(draft);
      await store.update((l) => ({
        ...l,
        series: l.series.map((s) =>
          s.id === series.id
            ? {
                ...s,
                draft: { ...s.draft, settings },
                preparations: editingId
                  ? s.preparations.map((p) =>
                      p.id === editingId ? { ...s.draft, settings } : p,
                    )
                  : s.preparations,
              }
            : s,
        ),
      }));
      go(editorReturn);
      setNotice("Les contenus ont été enregistrés.");
      requestAnimationFrame(() => returnFocus.current?.focus());
    } catch {
      setError("Choisissez deux noms différents, de 1 à 80 caractères.");
    }
  }
  async function chooseImage(side: "a" | "b", file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const blob = await prepareSeriesImage(file);
      const id = await saveSeriesImage(blob);
      await changeSeries((s) => ({
        ...s,
        draft: {
          ...s.draft,
          contents: {
            ...s.draft.contents,
            [side]: { ...s.draft.contents[side], imageId: id },
          },
        },
      }));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Cette image ne peut pas être conservée. Vos textes restent disponibles.",
      );
    } finally {
      setBusy(false);
    }
  }
  function removeImage(side: "a" | "b") {
    changeDraft((p) => {
      const { imageId: _, ...slot } = p.contents[side];
      return { ...p, contents: { ...p.contents, [side]: slot } };
    });
  }
  function selectedHistory() {
    return library?.history.find((p) => p.id === reuseId) ?? null;
  }
  function secondaryOptions() {
    if (!draft) return null;
    return (
      <div className="series-card series-options">
        <details data-prepare-option="roles">
          <summary>
            Rôles et distribution
            <HomeIcon name="chevron" />
          </summary>
          <div className="series-option-body">
            <label>
              Nombre d’Undercover
              <NumberInput
                label="Nombre d’Undercover"
                value={draft.settings["undercover-count"]}
                min={1}
                max={5}
                disabled={busy}
                onChange={(v) =>
                  changeDraft((p) => ({
                    ...p,
                    settings: {
                      ...p.settings,
                      "undercover-count": v,
                    },
                  }))
                }
              />
            </label>
            <section aria-label="Règles actives">
              <p>
                {draft.count > draft.settings["undercover-count"] * 2
                  ? `${draft.count - draft.settings["undercover-count"]} civils et ${draft.settings["undercover-count"]} Undercover prévus. `
                  : ""}
                Au moins {draft.settings["undercover-count"] * 2 + 1} joueurs
                pour cette répartition. L’effectif réel sera vérifié au salon.
                Jusqu’à {maximumUndercover(draft.count)} Undercover pour
                l’effectif prévu.
              </p>
            </section>
            <label>
              Maximum de manches
              <NumberInput
                label="Maximum de manches"
                value={draft.settings["round-limit"]}
                min={1}
                max={30}
                disabled={busy}
                onChange={(v) =>
                  changeDraft((p) => ({
                    ...p,
                    settings: { ...p.settings, "round-limit": v },
                  }))
                }
              />
            </label>
            <details>
              <summary>Comment se déroule cette partie ?</summary>
              <p>
                Indices oraux, vote unique sans vote pour soi, égalité sans
                élimination. Les civils gagnent lorsque tous les Undercover sont
                éliminés ; les Undercover gagnent à la parité. Les mots ne sont
                révélés publiquement qu’à la fin, sauf choix explicite de
                diffusion du GM.
              </p>
            </details>
          </div>
        </details>
        <details data-prepare-option="broadcast">
          <summary>
            Plateau de diffusion
            <HomeIcon name="chevron" />
          </summary>
          <div className="series-option-body">
            <p>
              Les noms de cet aperçu sont des exemples. Aucun joueur n’est créé.
            </p>
            <BroadcastThemeSelect
              value={draft.broadcastTheme}
              disabled={busy}
              onChange={(v) =>
                changeDraft((p) => ({ ...p, broadcastTheme: v }))
              }
            />
            <UndercoverLayoutEditor
              layout={draft.overlayLayout}
              onChange={(v) => changeDraft((p) => ({ ...p, overlayLayout: v }))}
              view={{
                ...layoutPreparationPreview(draft.count),
                broadcastTheme: draft.broadcastTheme,
              }}
              disabled={busy}
            />
          </div>
        </details>
      </div>
    );
  }
  async function reuse() {
    const source = selectedHistory();
    if (!source || !series) return;
    if (series.preparations.length >= 100) {
      setError(
        "Cette série contient déjà 100 parties. Créez une autre série pour continuer.",
      );
      return;
    }
    const p = copyPreparation(source);
    const base = p;
    const next = {
      ...base,
      contents: {
        a: { ...base.contents.a, name: reuseNames.a },
        b: { ...base.contents.b, name: reuseNames.b },
      },
    };
    try {
      next.settings = validatedPreparation(next);
      await changeSeries((s) => ({
        ...s,
        preparations: [...s.preparations, next],
      }));
      go("series");
      setNotice("Une copie indépendante a été ajoutée.");
    } catch {
      setError("Choisissez deux noms différents avant d’ajouter la copie.");
    }
  }
  async function openSalon(quick = false) {
    if (!series || !draft || flight.current || !validFields()) return;
    setError("");
    setNotice("");
    let chosen = quick ? draft : series.preparations[0];
    if (!chosen && !pending) {
      setError("Ajoutez une partie avant d’ouvrir le salon.");
      return;
    }
    if (series.active && !quick && !pending) {
      try {
        sessionStorage.setItem(
          accessKey(series.active.sessionId, "gm"),
          series.active.token,
        );
        sessionStorage.setItem("xt:recent-gm-session", series.active.sessionId);
        router.push(`/sessions/${series.active.sessionId}/gm`);
      } catch {
        setError(
          "L’accès à cette partie ne peut pas être ouvert dans cet onglet.",
        );
      }
      return;
    }
    flight.current = true;
    setBusy(true);
    try {
      let attempt =
        pending ??
        (series.pending ? seriesAttemptSchema.parse(series.pending) : null);
      if (!attempt) {
        const token = quick ? randomToken() : (series.token ?? randomToken());
        attempt = makeSeriesAttempt(series, chosen!, 0, token);
        if (quick) {
          attempt = { ...attempt, mode: "quick" };
          delete attempt.preparation;
        }
        if (quick && attempt.settings["undercover-count"] * 2 >= attempt.count)
          throw new Error(
            "Prévoyez de 3 à 12 joueurs, avec moins d’Undercover que de civils.",
          );
        // Preserve the command identity before any network request, including storage failures.
        try {
          sessionStorage.setItem(pendingKey, JSON.stringify(attempt));
        } catch {
          throw new Error(
            "La préparation ne peut pas être conservée dans cet onglet. Autorisez le stockage puis réessayez.",
          );
        }
        if (
          !quick &&
          !(await changeSeries((s) => ({ ...s, token, pending: attempt })))
        )
          return;
      }
      if (pending && pending.mode !== (quick ? "quick" : "invite"))
        quick = pending.mode === "quick";
      if (attempt.snapshot) {
        const frozen = attempt.snapshot;
        const differs =
          !chosen || JSON.stringify(chosen) !== JSON.stringify(frozen);
        if (differs) {
          await changeSeries((s) => ({
            ...s,
            draft: structuredClone(frozen),
            preparations:
              attempt!.mode === "quick"
                ? s.preparations
                : [
                    structuredClone(frozen),
                    ...s.preparations.filter((p) => p.id !== frozen.id),
                  ],
          }));
          setPending(attempt);
          setError(
            "Une préparation attend sa confirmation. Ses réglages précédents viennent d’être restaurés. Reprenez-la sans créer une nouvelle demande.",
          );
          return;
        }
        chosen = structuredClone(frozen);
      }
      setPending(attempt);
      const lab = await createSeriesSession(attempt);
      if (!quick) {
        if (
          !(await changeSeries((s) => ({
            ...s,
            token: attempt!.token,
            active: {
              sessionId: lab.sessionId,
              token: attempt!.token,
              preparationId:
                chosen?.id ?? attempt!.preparation?.id ?? s.draft.id,
              index: 0,
              preparation: structuredClone(chosen ?? s.draft),
            },
            pending: undefined,
          })))
        )
          return;
      }
      sessionStorage.removeItem(pendingKey);
      setPending(null);
      if (!quick && chosen)
        await uploadPreparationImages(lab.sessionId, lab.token, chosen).catch(
          () => {},
        );
      router.push(
        lab.mode === "quick"
          ? `/play/lab/${lab.sessionId}`
          : `/sessions/${lab.sessionId}/gm`,
      );
    } catch (e) {
      if (e instanceof RequestFailure && e.status < 500) {
        try {
          sessionStorage.removeItem(pendingKey);
          setPending(null);
          await changeSeries((s) => ({ ...s, pending: undefined }));
        } catch {}
      }
      setError(
        requestMessage(
          e,
          e instanceof Error &&
            !(e instanceof RequestFailure) &&
            e.name === "Error"
            ? e.message
            : "La préparation n’a pas été confirmée. Vérifiez la connexion puis réessayez : la même demande sera reprise.",
        ),
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  function footer(label: string, action: () => void, extra?: ReactNode) {
    return (
      <div className="series-bottom">
        {extra}
        <button
          className="stitch-button stitch-primary"
          disabled={busy || !!store.error}
          aria-busy={busy}
          onClick={action}
        >
          {busy ? "Préparation…" : label}
          <HomeIcon name="arrow" />
        </button>
      </div>
    );
  }
  if (!library || !series || !draft)
    return (
      <main className="stitch-page series-studio">
        <header className="stitch-header">
          <Link className="stitch-brand" href="/">
            <HomeIcon name="game" />
            Extension Twitch
          </Link>
        </header>
        <div className="series-workspace">
          <h1>Préparer Undercover</h1>
          {store.error ? (
            <p role="alert">{store.error}</p>
          ) : (
            <p role="status">Ouverture de vos préparations…</p>
          )}
        </div>
      </main>
    );
  const source = selectedHistory();
  const first = series.preparations[0];
  return (
    <main
      className="stitch-page prepare-undercover series-studio"
      data-experience="preparation"
      data-series-view={screen}
    >
      <header className="stitch-header">
        <div className="series-header-inner">
          <Link href="/" className="stitch-brand">
            <HomeIcon name="game" />
            Extension Twitch
          </Link>
          <span className="series-header-game">Undercover</span>
          <ThemeControl icon={<HomeIcon name="palette" />} />
        </div>
      </header>
      <div className={`series-workspace series-screen-${screen}`}>
        <nav className="series-back" aria-label="Retour">
          {screen === "series" ? (
            <Link href="/play">‹ Undercover</Link>
          ) : (
            <button className="series-text-button" onClick={() => go("series")}>
              ‹ {screen === "prepare" ? series.title : "Retour à la série"}
            </button>
          )}
        </nav>
        {(error || store.error) && (
          <div className="series-error">
            <p ref={errorRef} tabIndex={-1} role="alert">
              {store.error || error}
            </p>
            {store.error && (
              <>
                <button
                  className="stitch-button"
                  onClick={() =>
                    void store.retry().catch((e) => setError(e.message))
                  }
                >
                  Réessayer l’enregistrement
                </button>
                <button
                  className="stitch-button"
                  onClick={() =>
                    void store
                      .copyUnsaved()
                      .then(() => setError(""))
                      .catch((e) => setError(e.message))
                  }
                >
                  Conserver mes changements dans une nouvelle série
                </button>
              </>
            )}
          </div>
        )}
        {notice && (
          <p className="series-notice" role="status">
            {notice}
          </p>
        )}
        {pending && (
          <p className="series-notice" role="status">
            Une préparation attend sa confirmation. Reprenez-la avec la même
            demande.
            <button
              className="series-text-button"
              disabled={busy}
              onClick={() => void openSalon(pending.mode === "quick")}
            >
              Reprendre la préparation
            </button>
          </p>
        )}
        {screen === "prepare" && (
          <>
            <div className="series-intro">
              <h1>Préparer une partie</h1>
              <p>Quelques réglages, puis ajoutez-la à votre série.</p>
            </div>
            <div className="series-prepare-grid">
              <div className="series-controls">
                <section className="series-card series-essentials">
                  <div className="series-setting">
                    <div className="series-setting-heading">
                      <h2>Participants</h2>
                      <small>3 à 12</small>
                    </div>
                    <div className="series-stepper">
                      <button
                        aria-label="Diminuer le nombre de participants"
                        disabled={busy || draft.count <= 3}
                        onClick={() =>
                          changeDraft((p) => ({
                            ...p,
                            count: Math.max(3, p.count - 1),
                          }))
                        }
                      >
                        −
                      </button>
                      <NumberInput
                        label="Participants prévus"
                        min={3}
                        max={12}
                        value={draft.count}
                        disabled={busy}
                        onChange={(count) =>
                          changeDraft((p) => ({ ...p, count }))
                        }
                      />
                      <button
                        aria-label="Augmenter le nombre de participants"
                        disabled={busy || draft.count >= 12}
                        onClick={() =>
                          changeDraft((p) => ({
                            ...p,
                            count: Math.min(12, p.count + 1),
                          }))
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <fieldset className="series-setting series-clues">
                    <legend>Tours d’indices</legend>
                    <div className="series-rounds">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="series-clue-rounds"
                            checked={draft.settings["clue-rounds"] === value}
                            aria-label={`${value} ${value === 1 ? "tour" : "tours"} d’indices`}
                            disabled={busy}
                            onChange={() =>
                              changeDraft((p) => ({
                                ...p,
                                settings: {
                                  ...p.settings,
                                  "clue-rounds": value,
                                },
                              }))
                            }
                          />
                          <span>{value}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="series-mode">
                    <strong>Mode</strong>
                    <span>Classique</span>
                  </div>
                </section>
                <section className="series-card series-contents">
                  <h2>Vos contenus</h2>
                  <div className="series-content-pair">
                    {(["a", "b"] as const).map((side) => (
                      <div key={side}>
                        <ImagePreview
                          id={draft.contents[side].imageId}
                          label={draft.contents[side].name}
                        />
                        <div>
                          <span>Contenu {side.toUpperCase()}</span>
                          <strong>
                            {draft.contents[side].name || "À nommer"}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="series-text-button" onClick={() => edit()}>
                    Modifier les contenus
                  </button>
                  <DeviceNote />
                </section>
                {secondaryOptions()}
                <details className="series-qa" data-prepare-option="laboratory">
                  <summary>Tester avec le laboratoire</summary>
                  <div className="series-option-body">
                    <p>
                      Un essai indépendant avec de véritables accès joueurs.
                    </p>
                    <label>
                      Joueurs de démonstration
                      <NumberInput
                        label="Joueurs de démonstration"
                        min={3}
                        max={12}
                        value={draft.count}
                        onChange={(v) =>
                          changeDraft((p) => ({ ...p, count: v }))
                        }
                        disabled={busy}
                      />
                    </label>
                    <button
                      className="stitch-button"
                      disabled={busy}
                      onClick={() => void openSalon(true)}
                    >
                      Lancer une partie de démonstration
                    </button>
                  </div>
                </details>
              </div>
              <aside className="series-card series-summary">
                <h2>Votre partie</h2>
                <dl>
                  <div>
                    <dt>Participants prévus</dt>
                    <dd>{draft.count}</dd>
                  </div>
                  <div>
                    <dt>Tours d’indices</dt>
                    <dd>{draft.settings["clue-rounds"]}</dd>
                  </div>
                  <div>
                    <dt>Mode</dt>
                    <dd>Classique</dd>
                  </div>
                </dl>
                <p>{preparationName(draft)}</p>
                {footer("Ajouter à la série", () => void addDraft())}
              </aside>
            </div>
          </>
        )}
        {screen === "edit" && (
          <>
            <div className="series-intro">
              <h1>{preparationName(draft)}</h1>
              <p>
                {editingId
                  ? `Partie ${series.preparations.findIndex((p) => p.id === editingId) + 1} · `
                  : ""}
                Modifiez un nom, une image, ou les deux.
              </p>
            </div>
            <label className="series-preparation-title">
              Nom de la partie (facultatif)
              <input
                aria-label="Nom de la partie"
                maxLength={80}
                value={draft.title}
                disabled={busy}
                onChange={(e) =>
                  changeDraft((p) => ({ ...p, title: e.target.value }))
                }
              />
            </label>
            <div className="series-editor-grid">
              {(["a", "b"] as const).map((side) => (
                <section className="series-card series-editor-card" key={side}>
                  <h2>Contenu {side.toUpperCase()}</h2>
                  <label>
                    Nom du contenu {side.toUpperCase()}
                    <input
                      aria-label={`Nom du contenu ${side.toUpperCase()}`}
                      value={draft.contents[side].name}
                      maxLength={80}
                      disabled={busy}
                      onChange={(e) =>
                        changeDraft((p) => ({
                          ...p,
                          contents: {
                            ...p.contents,
                            [side]: {
                              ...p.contents[side],
                              name: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </label>
                  <ImagePreview
                    id={draft.contents[side].imageId}
                    label={draft.contents[side].name}
                    large
                  />
                  <div className="series-image-actions">
                    <label className="stitch-button series-file-button">
                      {draft.contents[side].imageId
                        ? "Remplacer / reconnecter l’image"
                        : "Choisir une image"}
                      <input
                        type="file"
                        aria-label={`Image du contenu ${side.toUpperCase()}`}
                        accept="image/png,image/jpeg,image/webp"
                        disabled={busy}
                        onChange={(e) => {
                          void chooseImage(side, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {draft.contents[side].imageId && (
                      <button
                        className="series-text-button"
                        disabled={busy}
                        onClick={() => removeImage(side)}
                      >
                        Retirer l’image {side.toUpperCase()}
                      </button>
                    )}
                  </div>
                </section>
              ))}
            </div>
            <details className="series-editor-settings">
              <summary>Réglages de cette partie</summary>
              <div className="series-option-body">
                <label>
                  Participants prévus
                  <NumberInput
                    label="Participants prévus"
                    value={draft.count}
                    min={3}
                    max={12}
                    disabled={busy}
                    onChange={(count) => changeDraft((p) => ({ ...p, count }))}
                  />
                </label>
                <label>
                  Tours d’indices
                  <NumberInput
                    label="Tours d’indices"
                    value={draft.settings["clue-rounds"]}
                    min={1}
                    max={5}
                    disabled={busy}
                    onChange={(v) =>
                      changeDraft((p) => ({
                        ...p,
                        settings: { ...p.settings, "clue-rounds": v },
                      }))
                    }
                  />
                </label>
                {secondaryOptions()}
              </div>
            </details>
            <DeviceNote />
            {footer("Enregistrer la partie", () => void saveEditor())}
          </>
        )}
        {screen === "series" && (
          <>
            <div className="series-intro series-title-edit">
              <label htmlFor="series-title">Nom de la série</label>
              <input
                id="series-title"
                aria-label="Nom de la série"
                maxLength={80}
                value={series.title}
                onChange={(e) => {
                  if (e.target.value.trim())
                    void changeSeries((s) => ({ ...s, title: e.target.value }));
                }}
              />
              <p>
                {series.preparations.length}{" "}
                {series.preparations.length === 1 ? "partie" : "parties"} · À
                votre rythme, dans votre ordre.
              </p>
            </div>
            <details className="series-switcher">
              <summary>Mes séries</summary>
              <div className="series-option-body">
                <label>
                  Série à ouvrir
                  <select
                    aria-label="Série à ouvrir"
                    value={series.id}
                    onChange={(e) =>
                      void store
                        .update((l) => ({
                          ...l,
                          selectedSeriesId: e.target.value,
                        }))
                        .then(() => setUndo(null))
                        .catch((e) => setError(e.message))
                    }
                  >
                    {library.series.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="stitch-button"
                  onClick={() => {
                    if (library.series.length >= 50) {
                      setError(
                        "Cet appareil conserve déjà 50 séries. Réutilisez une série existante.",
                      );
                      return;
                    }
                    const next = newSeries(
                      `Nouvelle série ${library.series.length + 1}`,
                    );
                    void store
                      .update((l) => ({
                        ...l,
                        selectedSeriesId: next.id,
                        series: [...l.series, next],
                      }))
                      .then(() => go("prepare"))
                      .catch((e) => setError(e.message));
                  }}
                >
                  Créer une autre série
                </button>
              </div>
            </details>
            {series.active && (
              <div className="series-active">
                <p>
                  Une partie de cette série a déjà son salon. Vos préparations
                  restent conservées.
                </p>
                <button
                  className="stitch-button"
                  onClick={() => void openSalon()}
                >
                  Reprendre la partie
                </button>
              </div>
            )}
            {series.preparations.length ? (
              <ol className="series-card series-runlist">
                {series.preparations.map((p, index) => (
                  <li
                    key={p.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", String(index))
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData("text/plain"));
                      if (Number.isInteger(from))
                        void changeSeries((s) =>
                          movePreparation(s, from, index),
                        );
                    }}
                  >
                    <span className="series-position">{index + 1}</span>
                    <span className="series-drag" aria-hidden="true">
                      ⠿
                    </span>
                    <div className="series-thumbs">
                      {(["a", "b"] as const).map((side) => (
                        <ImagePreview
                          key={side}
                          id={p.contents[side].imageId}
                          label={p.contents[side].name}
                        />
                      ))}
                    </div>
                    <div className="series-row-title">
                      <strong>{preparationName(p)}</strong>
                      <span>
                        {series.active?.preparationId === p.id
                          ? "Partie actuelle · "
                          : ""}
                        {missing.includes(p.id)
                          ? "Prête · image à reconnecter"
                          : !p.contents.a.imageId && !p.contents.b.imageId
                            ? "Prête · sans image"
                            : "Prête"}
                      </span>
                    </div>
                    <div className="series-row-actions">
                      <button
                        className="series-text-button"
                        onClick={() => edit(p)}
                      >
                        Modifier
                      </button>
                      <button
                        className="stitch-button series-icon-button"
                        aria-label={`Monter la partie ${index + 1}`}
                        disabled={index === 0}
                        onClick={() =>
                          void changeSeries((s) =>
                            movePreparation(s, index, index - 1),
                          )
                        }
                      >
                        ⌃
                      </button>
                      <button
                        className="stitch-button series-icon-button"
                        aria-label={`Descendre la partie ${index + 1}`}
                        disabled={index === series.preparations.length - 1}
                        onClick={() =>
                          void changeSeries((s) =>
                            movePreparation(s, index, index + 1),
                          )
                        }
                      >
                        ⌄
                      </button>
                      <details className="series-row-menu">
                        <summary
                          aria-label={`Options de la partie ${index + 1}`}
                        >
                          ⋯
                        </summary>
                        <div>
                          <button
                            disabled={series.preparations.length >= 100}
                            title={
                              series.preparations.length >= 100
                                ? "100 parties maximum par série"
                                : undefined
                            }
                            onClick={() =>
                              void changeSeries((s) => {
                                const list = [...s.preparations];
                                list.splice(index + 1, 0, copyPreparation(p));
                                return { ...s, preparations: list };
                              })
                            }
                          >
                            Dupliquer
                          </button>
                          <button
                            onClick={() => {
                              setUndo({ preparation: p, index });
                              void changeSeries((s) => ({
                                ...s,
                                preparations: s.preparations.filter(
                                  (v) => v.id !== p.id,
                                ),
                              }));
                            }}
                          >
                            Retirer
                          </button>
                        </div>
                      </details>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="series-card series-empty">
                <h2>Votre première partie</h2>
                <p>
                  Choisissez deux contenus et quelques réglages pour commencer.
                </p>
              </div>
            )}
            {undo && (
              <p className="series-notice" role="status">
                Partie retirée.{" "}
                <button
                  className="series-text-button"
                  onClick={() => {
                    void changeSeries((s) => {
                      const list = [...s.preparations];
                      list.splice(
                        Math.min(undo.index, list.length),
                        0,
                        undo.preparation,
                      );
                      return { ...s, preparations: list };
                    });
                    setUndo(null);
                  }}
                >
                  Annuler le retrait
                </button>
              </p>
            )}
            <div className="series-list-actions">
              <button
                className="stitch-button"
                onClick={() => {
                  setEditingId(null);
                  go("prepare");
                }}
              >
                ＋ Ajouter une partie
              </button>
              <button
                className="series-text-button"
                onClick={() => {
                  const firstHistory = library.history[0];
                  setReuseId(firstHistory?.id ?? null);
                  setReuseNames({
                    a: firstHistory?.contents.a.name ?? "",
                    b: firstHistory?.contents.b.name ?? "",
                  });
                  go("reuse");
                }}
              >
                Réutiliser une ancienne partie
              </button>
            </div>
            <DeviceNote />
            {series.preparations.length > 0 &&
              footer("Vérifier la série", () => go("ready"))}
          </>
        )}
        {screen === "reuse" && (
          <>
            <div className="series-intro">
              <h1>Reprendre une ancienne partie</h1>
              <p>Retrouvez une paire. Gardez ce qui vous plaît.</p>
            </div>
            <div className="series-reuse-grid">
              <section className="series-card series-reuse-list">
                <input
                  aria-label="Rechercher une paire"
                  placeholder="Rechercher une paire"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {library.history
                  .filter((p) =>
                    preparationName(p)
                      .toLocaleLowerCase("fr")
                      .includes(search.toLocaleLowerCase("fr")),
                  )
                  .map((p) => (
                    <button
                      className={`series-history-item ${reuseId === p.id ? "is-selected" : ""}`}
                      key={p.id}
                      onClick={() => {
                        setReuseId(p.id);
                        setReuseNames({
                          a: p.contents.a.name,
                          b: p.contents.b.name,
                        });
                      }}
                    >
                      <strong>{preparationName(p)}</strong>
                      <span>{p.seriesTitle}</span>
                    </button>
                  ))}
                {!library.history.length && (
                  <p>
                    Les parties que vous préparez apparaîtront ici. Leur
                    réutilisation créera une copie indépendante.
                  </p>
                )}
              </section>
              {source && (
                <section className="series-card series-reuse-editor">
                  <h2>Une copie pour votre série</h2>
                  <p>Modifiez seulement ce dont vous avez besoin.</p>
                  <div className="series-reuse-fields">
                    {(["a", "b"] as const).map((side) => (
                      <label key={side}>
                        <ImagePreview
                          id={source.contents[side].imageId}
                          label={source.contents[side].name}
                          large
                        />
                        Contenu {side.toUpperCase()}
                        <input
                          aria-label={`Copie du contenu ${side.toUpperCase()}`}
                          value={reuseNames[side]}
                          maxLength={80}
                          onChange={(e) =>
                            setReuseNames((n) => ({
                              ...n,
                              [side]: e.target.value,
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p>La partie d’origine reste intacte.</p>
                  <DeviceNote />
                  {footer("Ajouter cette partie", () => void reuse())}
                </section>
              )}
            </div>
          </>
        )}
        {screen === "ready" && (
          <>
            <div className="series-intro">
              <h1>Votre série est prête</h1>
              <p>Un dernier regard, puis place aux invitations.</p>
            </div>
            <section className="series-card series-ready">
              <h2>{series.title}</h2>
              <strong className="series-ready-count">
                {series.preparations.length}{" "}
                {series.preparations.length === 1
                  ? "partie prête"
                  : "parties prêtes"}
              </strong>
              {first && (
                <p>
                  {first.count} participants prévus ·{" "}
                  {first.settings["clue-rounds"]} tours d’indices · Classique
                </p>
              )}
              <div className="series-readiness">
                <p>
                  ✓ {series.preparations.length - missing.length}{" "}
                  {series.preparations.length - missing.length === 1
                    ? "partie disponible"
                    : "parties disponibles"}
                  {missing.length > 0 && (
                    <>
                      <br />
                      {missing.length}{" "}
                      {missing.length === 1
                        ? "image à reconnecter"
                        : "parties avec image à reconnecter"}{" "}
                      · facultatif
                    </>
                  )}
                </p>
                {missing.length > 0 && (
                  <button
                    className="series-text-button"
                    onClick={() =>
                      edit(
                        series.preparations.find((p) => missing.includes(p.id)),
                      )
                    }
                  >
                    Reconnecter l’image
                  </button>
                )}
              </div>
              <h3>Votre programme</h3>
              <ol>
                {series.preparations.map((p, index) => (
                  <li key={p.id}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{preparationName(p)}</strong>
                      <small>Prête</small>
                    </div>
                  </li>
                ))}
              </ol>
              <DeviceNote />
            </section>
            <p className="series-before-lobby">
              Vous inviterez ensuite vos joueurs. Les mots seront distribués
              plus tard.
            </p>
            {footer(
              series.active ? "Reprendre la partie" : "Ouvrir le salon",
              () => void openSalon(),
            )}
          </>
        )}
        <span className="series-save-state" role="status">
          {store.saving
            ? "Enregistrement…"
            : store.error
              ? "Changements à conserver"
              : "Enregistré sur cet appareil"}
        </span>
      </div>
    </main>
  );
}
