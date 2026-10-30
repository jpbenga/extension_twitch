"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  officialThemes,
  historicalBroadcastTheme,
} from "@extension-twitch/contracts/themes";
import {
  undercoverLayoutSchema,
  createUndercoverLayout,
  type UndercoverLayout,
} from "@extension-twitch/contracts/undercover-layout";
import { useSession } from "../lib/use-session";
import { ThemeControl } from "./application-theme";
import "../app/stitch-surfaces.css";
import "../app/brand-fonts.css";
import { UndercoverLayoutEditor } from "./undercover-layout-editor";
import { useConfirm } from "./ui/feedback";

type Draft = { layout: UndercoverLayout; base: UndercoverLayout };
export function SessionLayoutEditor({ id }: { id: string }) {
  const gm = useSession(id, "gm"),
    publicSession = useSession(id, "public");
  const [draft, setDraft] = useState<Draft | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const confirm = useConfirm(),
    key = `xt:undercover:layout-draft:${id}`;
  const remote = gm.view?.overlayLayout ?? createUndercoverLayout();
  const remoteJson = JSON.stringify(remote);
  const dirty =
    !!draft && JSON.stringify(draft.layout) !== JSON.stringify(draft.base);
  const conflict =
    !!draft && remoteJson !== JSON.stringify(draft.base) && dirty;
  useEffect(() => {
    if (gm.view?.audience !== "gm") return;
    const layout = undercoverLayoutSchema.parse(
      JSON.parse(remoteJson) as unknown,
    );
    setDraft((previous) => {
      if (previous)
        return JSON.stringify(previous.layout) ===
          JSON.stringify(previous.base) ||
          JSON.stringify(previous.layout) === remoteJson
          ? { layout, base: layout }
          : previous;
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const saved = JSON.parse(raw) as Draft;
          return {
            layout: undercoverLayoutSchema.parse(saved.layout),
            base: undercoverLayoutSchema.parse(saved.base),
          };
        }
      } catch {
        /* Invalid local copy cannot replace the authoritative layout. */
      }
      return { layout, base: layout };
    });
  }, [remoteJson, gm.view?.audience, key]);
  useEffect(() => {
    if (!draft) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(draft));
    } catch {
      setError(
        "La copie locale ne peut pas être conservée. Enregistrez avant de quitter cet écran.",
      );
    }
  }, [draft, key]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save() {
    if (!draft) return;
    if (gm.retryAvailable) {
      if (await gm.send())
        setNotice(
          "Commande précédente confirmée. Vérifiez la disposition avant de poursuivre.",
        );
      return;
    }
    if (conflict) return;
    const layout = undercoverLayoutSchema.parse(draft.layout);
    if (await gm.send({ type: "overlay.configure", layout })) {
      setDraft({ layout, base: layout });
      setError("");
      setNotice("Disposition enregistrée. L’aperçu et OBS sont à jour.");
    }
  }
  const view =
    publicSession.view?.audience === "public" ? publicSession.view : null;
  return (
    <main className="stitch-page broadcast-workbench broadcast-layout-page">
      <div className="broadcast-workbench-inner">
        <div className="broadcast-layout-navigation">
          <Link className="broadcast-back-link" href={`/sessions/${id}/gm`}>
            ← Retour à la régie
          </Link>
          <ThemeControl />
        </div>
        <header className="broadcast-page-heading">
          <div>
            <h1>Votre overlay</h1>
            <p>
              Thème de l’émission :{" "}
              {
                officialThemes.find(
                  (t) =>
                    t.id ===
                    (gm.view?.broadcastTheme ?? historicalBroadcastTheme),
                )?.name
              }
            </p>
            <small>
              Conservé pour cette partie · indépendant de l’apparence de
              l’application
            </small>
          </div>
          <p role="status" className="broadcast-save-state">
            {!draft
              ? "Ouverture de la disposition…"
              : dirty
                ? "Modifications non enregistrées"
                : "Disposition enregistrée dans la partie"}
          </p>
        </header>
        {gm.error && (
          <p className="lobby-error" role="alert">
            {gm.error}
          </p>
        )}
        {error && (
          <p className="lobby-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="lobby-notice" role="status">
            {notice}
          </p>
        )}
        {conflict && (
          <div className="lobby-warning" role="alert">
            <p>
              La disposition a été modifiée dans un autre onglet. Vos
              changements sont conservés ici et ne peuvent pas écraser l’autre
              disposition. Notez vos ajustements, puis chargez la disposition
              enregistrée pour les réappliquer.
            </p>
            <button
              type="button"
              className="secondary-button"
              disabled={gm.busy || gm.retryAvailable}
              onClick={() =>
                void confirm({
                  title: "Charger la disposition enregistrée ?",
                  presentation: "stitch",
                  description:
                    "Vos ajustements locaux seront remplacés. La partie ne change pas.",
                  confirmLabel: "Charger la disposition",
                  onConfirm: () => {
                    setDraft({ layout: remote, base: remote });
                    return true;
                  },
                })
              }
            >
              Charger la disposition enregistrée
            </button>
          </div>
        )}
        {gm.view?.audience === "gm" &&
        gm.view.gameId === "undercover" &&
        view &&
        draft ? (
          <>
            <UndercoverLayoutEditor
              layout={draft.layout}
              onChange={(layout) => {
                setDraft({ ...draft, layout });
                setNotice("");
              }}
              view={view}
              connection={publicSession.connection}
              disabled={gm.busy || gm.retryAvailable}
            />
            <div className="layout-actions">
              <button
                type="button"
                className="primary-button"
                disabled={
                  gm.busy ||
                  (conflict && !gm.retryAvailable) ||
                  (!dirty && !gm.retryAvailable)
                }
                onClick={() => void save()}
              >
                {gm.busy
                  ? "Enregistrement…"
                  : gm.retryAvailable
                    ? "Réessayer l’enregistrement"
                    : "Enregistrer la disposition"}
              </button>
              <a
                className="secondary-button"
                href={`/sessions/${id}/stream?from=gm`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Répétition avant direct ↗
              </a>
              <a
                className="text-link"
                href={`/sessions/${id}/obs`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source OBS transparente ↗
              </a>
            </div>
            <p className="lobby-hint">
              Les ajustements restent privés jusqu’à l’enregistrement. Après
              enregistrement, la même URL OBS affiche la nouvelle disposition,
              sans réinitialiser le jeu.
            </p>
          </>
        ) : (
          gm.connection !== "denied" && (
            <p>
              Ouverture de la disposition… Un accès privé Game Master est
              nécessaire.
            </p>
          )
        )}
      </div>
    </main>
  );
}
