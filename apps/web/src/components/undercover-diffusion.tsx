"use client";
import { useState, useRef } from "react";
import { createUndercoverTvLayout } from "@extension-twitch/contracts/undercover-layout";
import { BroadcastOverlay } from "./broadcast-overlay";
import { UndercoverLayoutEditor } from "./undercover-layout-editor";
import { BroadcastThemeSelect } from "./application-theme";
import { layoutPreparationPreview } from "../lib/layout-preview";
import type { UndercoverPreparation } from "../lib/undercover-series";

/** Private editorial preview, never used as the source of a public session or OBS feed. */
export function UndercoverDiffusion({
  draft,
  adopting,
  advanced,
  busy,
  onChange,
  onNavigate,
  onSave,
}: {
  draft: UndercoverPreparation;
  adopting: boolean;
  advanced: boolean;
  busy: boolean;
  onChange: (
    change: (p: UndercoverPreparation) => UndercoverPreparation,
  ) => void;
  onNavigate: (view: "diffusion" | "adopt" | "layout") => void;
  onSave: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const mode = draft.preferredPublication ?? "duo";
  const example = {
    ...layoutPreparationPreview(draft.count),
    broadcastTheme: draft.broadcastTheme,
    overlayLayout: draft.overlayLayout,
  };
  function openPreview(tv = false) {
    setPreview(tv);
    dialog.current?.showModal();
  }
  function canvas(tv = false) {
    return (
      <div
        className="consolidation-broadcast-preview"
        aria-label="Aperçu d’habillage — exemples, aucun joueur créé"
      >
        <BroadcastOverlay
          view={{
            ...example,
            overlayLayout: tv
              ? createUndercoverTvLayout()
              : draft.overlayLayout,
            undercoverBroadcast: {
              mode: "duo",
              revision: 0,
              page: 0,
              transition: false,
              contents: [
                {
                  id: "00000000-0000-4000-8000-000000000101",
                  label: draft.contents.a.name || "Contenu A",
                },
                {
                  id: "00000000-0000-4000-8000-000000000102",
                  label: draft.contents.b.name || "Contenu B",
                },
              ],
            },
          }}
          connection="preview"
          cue={{
            id: 0,
            kind: "content",
            message: "Aperçu privé des contenus préparés, sans distribution.",
          }}
        />
      </div>
    );
  }
  return (
    <>
      <dialog
        ref={dialog}
        className="consolidation-preview-dialog"
        aria-labelledby="diffusion-preview-title"
      >
        <h2 id="diffusion-preview-title">Aperçu de l’habillage</h2>
        <p>Exemples de préparation, sans joueur créé ni contenu publié.</p>
        {canvas(preview)}
        <button
          className="stitch-button"
          onClick={() => dialog.current?.close()}
        >
          Fermer l’aperçu
        </button>
      </dialog>
      <div className="series-intro">
        <h1>
          {advanced
            ? "Ajustements avancés"
            : adopting
              ? "Nouvel habillage TV"
              : "Diffusion"}
        </h1>
        <p>
          {adopting
            ? "Votre disposition actuelle est conservée."
            : "L’habillage accompagne votre émission."}
        </p>
      </div>
      {advanced ? (
        <>
          <p>
            Sept blocs, quatre dispositions. Ces réglages ne modifient pas les
            règles du jeu.
          </p>
          <BroadcastThemeSelect
            value={draft.broadcastTheme}
            disabled={busy}
            onChange={(v) => onChange((p) => ({ ...p, broadcastTheme: v }))}
          />
          <UndercoverLayoutEditor
            layout={draft.overlayLayout}
            onChange={(v) => onChange((p) => ({ ...p, overlayLayout: v }))}
            view={example}
            disabled={busy}
          />
        </>
      ) : adopting ? (
        <div className="consolidation-adoption">
          <section>
            <h2>Votre disposition actuelle</h2>
            {canvas()}
            <p>Personnalisée · Conservée</p>
          </section>
          <section>
            <h2>Le nouvel habillage TV</h2>
            {canvas(true)}
            <p>Plus discret, avec la vidéo au premier plan.</p>
          </section>
          <p>
            Prévisualisez le nouvel habillage avant de choisir. Aucune
            disposition personnalisée n’est remplacée automatiquement.
          </p>
          <button className="stitch-button" onClick={() => openPreview(true)}>
            Voir le nouvel habillage
          </button>

          <div className="series-bottom">
            <button
              className="series-text-button"
              onClick={() => onNavigate("diffusion")}
            >
              Garder ma disposition
            </button>
            <button
              className="stitch-button stitch-primary"
              disabled={busy}
              onClick={() => {
                onChange((p) => ({
                  ...p,
                  previousOverlayLayout: structuredClone(p.overlayLayout),
                  overlayLayout: createUndercoverTvLayout(),
                }));
                onNavigate("diffusion");
              }}
            >
              Utiliser cet habillage
            </button>
          </div>
        </div>
      ) : (
        <div className="consolidation-diffusion">
          <div className="consolidation-section-heading">
            <h2>
              {draft.overlayLayout.schemaVersion === 2
                ? "Habillage TV"
                : "Votre disposition actuelle"}
            </h2>
            <button
              className="stitch-button"
              onClick={() => openPreview(false)}
            >
              Aperçu
            </button>
          </div>
          {canvas()}
          <p>Aperçu privé du duo. Rien n’est publié depuis cet écran.</p>
          {draft.overlayLayout.schemaVersion !== 2 && (
            <button
              className="stitch-button"
              onClick={() => onNavigate("adopt")}
            >
              Découvrir le nouvel habillage TV
            </button>
          )}
          {draft.previousOverlayLayout && (
            <button
              className="series-text-button"
              onClick={() =>
                onChange((p) => {
                  const current = structuredClone(p.overlayLayout);
                  return {
                    ...p,
                    overlayLayout: structuredClone(p.previousOverlayLayout!),
                    previousOverlayLayout: current,
                  };
                })
              }
            >
              Retrouver ma disposition précédente
            </button>
          )}
          <label>
            Mode public
            <select
              aria-label="Mode public"
              value={mode}
              disabled={busy}
              onChange={(e) =>
                onChange((p) => ({
                  ...p,
                  preferredPublication: e.target.value as
                    "none" | "duo" | "assignments",
                }))
              }
            >
              <option value="duo">Duo anonyme</option>
              <option value="assignments">Affectations visibles</option>
              <option value="none">Ne rien afficher</option>
            </select>
          </label>
          <p>
            {mode === "duo"
              ? "Après publication, les deux contenus sont visibles, sans les affectations des joueurs."
              : mode === "assignments"
                ? "Les associations sont visibles uniquement après votre confirmation dans la régie."
                : "Les contenus restent masqués jusqu’à une commande explicite du Game Master."}
          </p>
          <details>
            <summary>Comprendre les modes publics</summary>
            <p>
              Ce choix prépare votre préférence pour la régie. Il ne distribue
              pas les mots et ne publie rien automatiquement. Les votes
              individuels restent privés.
            </p>
          </details>
          <button
            className="series-text-button consolidation-advanced-link"
            onClick={() => onNavigate("layout")}
          >
            Ajustements avancés <span aria-hidden="true">›</span>
          </button>
          <p>
            Sept blocs, quatre dispositions, placement et redimensionnement.
          </p>
          <div className="series-bottom">
            <button
              className="stitch-button stitch-primary"
              disabled={busy}
              onClick={onSave}
            >
              Enregistrer la diffusion
            </button>
          </div>
        </div>
      )}
      {advanced && (
        <div className="series-bottom">
          <button
            className="stitch-button stitch-primary"
            disabled={busy}
            onClick={() => onNavigate("diffusion")}
          >
            Revenir à la diffusion
          </button>
        </div>
      )}
    </>
  );
}
