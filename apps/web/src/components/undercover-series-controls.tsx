"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  GmSessionView,
  LobbyAction,
} from "@extension-twitch/contracts/sessions";
import {
  loadSeriesLibrary,
  updateSeriesLibrary,
  validatedPreparation,
  preparationName,
  deviceImagesNotice,
  type UndercoverSeries,
  type UndercoverPreparation,
} from "../lib/undercover-series";
import { uploadPreparationImages } from "../lib/undercover-series-launch";
import { accessKey } from "../lib/session-client";
import { useConfirm } from "./ui/feedback";
import "../app/undercover-series-controls.css";
function access(id: string) {
  try {
    return sessionStorage.getItem(accessKey(id, "gm"));
  } catch {
    return null;
  }
}
/** GM-only local conductor. It never receives a public/player projection or impersonates one. */
export function UndercoverSeriesControls({
  view,
  locked,
  send,
}: {
  view: GmSessionView;
  locked: boolean;
  send: (action: LobbyAction) => Promise<void | boolean>;
}) {
  const prep = view.undercoverPreparation,
    confirm = useConfirm();
  const [series, setSeries] = useState<UndercoverSeries | null>(null),
    [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!prep) return;
    let live = true;
    const sync = async () => {
      try {
        const library = await loadSeriesLibrary(),
          found = library.series.find((s) => s.id === prep.series.id);
        if (live) {
          setSeries(found ?? null);
          setLoaded(true);
        }
        if (!found) return;
        const t = access(view.sessionId);
        let p =
          found.active?.preparationId === prep.id
            ? found.active.preparation
            : found.preparations.find((p) => p.id === prep.id);
        if (!p || !t) return;
        if (
          found.active?.sessionId !== view.sessionId ||
          found.active.preparationId !== prep.id
        ) {
          const snapshot = structuredClone(p);
          await updateSeriesLibrary((current) => ({
            ...current,
            series: current.series.map((s) =>
              s.id === found.id
                ? {
                    ...s,
                    active: {
                      sessionId: view.sessionId,
                      token: t,
                      preparationId: prep.id,
                      index: Math.max(
                        0,
                        s.preparations.findIndex((p) => p.id === prep.id),
                      ),
                      preparation: snapshot,
                    },
                  }
                : s,
            ),
          }));
        }
        const result = await uploadPreparationImages(view.sessionId, t, p);
        if (live && result.failed + result.missing > 0)
          setMessage(
            "Une image n’est pas disponible. Les textes restent utilisables.",
          );
      } catch {
        if (live) {
          setLoaded(true);
          setMessage(
            "Vos préparations restent conservées. Ouvrez la série pour vérifier leur disponibilité.",
          );
        }
      }
    };
    void sync();
    const timer = setInterval(() => void sync(), 10 * 60 * 1000);
    const focused = () => void sync();
    window.addEventListener("focus", focused);
    window.addEventListener("online", focused);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("focus", focused);
      window.removeEventListener("online", focused);
    };
  }, [view.sessionId, prep?.id]);
  if (!prep) return null;
  const index = series?.preparations.findIndex((p) => p.id === prep.id) ?? -1;
  const nextIndex =
    index >= 0
      ? index + 1
      : (series?.active?.index ?? prep.series.position - 1);
  const next: UndercoverPreparation | undefined =
    series?.preparations[nextIndex];
  const finished = !!view.game?.play?.outcome;
  const canPublish = !!view.game?.play?.dealt && !finished;
  const groups = Math.max(1, Math.ceil(view.participants.length / 3));
  const publish = (mode: "none" | "duo" | "assignments", page?: number) =>
    send({
      type: "undercover.publish",
      mode,
      ...(page !== undefined ? { page } : {}),
    });
  return (
    <section className="gm-series-controls" aria-label="Série et diffusion">
      <div className="gm-series-line">
        <span>
          {prep.series.title} · Partie {prep.series.position} /{" "}
          {prep.series.total}
        </span>
        <Link href={`/play/undercover?series=${prep.series.id}&view=series`}>
          Retour à la série
        </Link>
      </div>
      {finished && next && (
        <button
          className="primary-button gm-series-next"
          disabled={locked}
          onClick={() =>
            void confirm({
              title: "Passer à la partie suivante ?",
              description: `${preparationName(next)} sera préparée avec les mêmes joueurs.`,
              consequences: [
                "Les accès joueurs sont conservés. Aucun mot ne sera distribué avant votre prochaine commande.",
              ],
              confirmLabel: "Préparer la partie suivante",
              presentation: "stitch",
              onConfirm: async () => {
                let settings;
                try {
                  settings = validatedPreparation(next);
                } catch {
                  throw new Error(
                    "Vérifiez les deux noms et les réglages de la prochaine partie dans votre série.",
                  );
                }
                const position = prep.series.position + 1;
                return (
                  (await send({
                    type: "undercover.next",
                    settings,
                    overlayLayout: next.overlayLayout,
                    broadcastTheme: next.broadcastTheme,
                    preparation: {
                      id: next.id,
                      title: preparationName(next).slice(0, 80),
                      series: {
                        id: prep.series.id,
                        title: series?.title ?? prep.series.title,
                        position,
                        total: Math.max(
                          position,
                          series?.preparations.length ?? position,
                        ),
                      },
                    },
                  })) !== false
                );
              },
            })
          }
        >
          Partie suivante
        </button>
      )}
      {finished &&
        loaded &&
        !next &&
        prep.series.position < prep.series.total && (
          <p className="gm-footnote">{deviceImagesNotice}</p>
        )}
      {message && (
        <p role="status" className="gm-footnote">
          {message}
        </p>
      )}
      <details className="gm-disclosure gm-content-publication">
        <summary>
          <span>Contenus sur le plateau</span>
          <span>Afficher ›</span>
        </summary>
        <div className="gm-disclosure-body">
          <p>
            Choisissez ce que le public peut voir. Les votes individuels restent
            privés.
          </p>
          <div className="gm-series-buttons">
            <button
              className="secondary-button"
              disabled={locked || !canPublish}
              onClick={() => void publish("duo")}
            >
              Montrer le duo anonyme
            </button>
            <button
              className="secondary-button"
              disabled={locked || !canPublish}
              onClick={() =>
                void confirm({
                  title: "Publier les affectations ?",
                  description:
                    "Le public verra quel contenu est attribué à chaque joueur.",
                  consequences: [
                    "Ce choix révèle volontairement les associations pour la partie courante.",
                  ],
                  confirmLabel: "Publier les affectations",
                  presentation: "stitch",
                  tone: "warning",
                  onConfirm: async () =>
                    (await publish("assignments")) !== false,
                })
              }
            >
              Publier les affectations
            </button>
            <button
              className="secondary-button"
              disabled={locked || prep.publication === "none" || !canPublish}
              onClick={() => void publish("none")}
            >
              Masquer les contenus
            </button>
          </div>
          {(prep.publication === "assignments" || finished) && groups > 1 && (
            <div className="gm-series-pages" aria-label="Groupes du plateau">
              <button
                className="secondary-button"
                disabled={locked || prep.page === 0}
                onClick={() => void publish("assignments", prep.page - 1)}
              >
                Groupe précédent
              </button>
              <span>
                Groupe {prep.page + 1} / {groups}
              </span>
              <button
                className="secondary-button"
                disabled={locked || prep.page >= groups - 1}
                onClick={() => void publish("assignments", prep.page + 1)}
              >
                Groupe suivant
              </button>
            </div>
          )}
          {!view.game?.play?.dealt && (
            <p className="gm-footnote">
              Distribuez les mots avant de montrer des contenus.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
