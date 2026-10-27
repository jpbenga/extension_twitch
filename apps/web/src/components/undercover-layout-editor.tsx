"use client";
import {
  useRef,
  useState,
  useEffect,
  type CSSProperties,
  type InputHTMLAttributes,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import {
  createUndercoverLayout,
  constrainWidget,
  layoutPresets,
  layoutOverlaps,
  widgetIds,
  widgetLabels,
  widgetMinimums,
  type UndercoverLayout,
  type WidgetId,
  type LayoutRect,
  type LayoutPreset,
} from "@extension-twitch/contracts/undercover-layout";
import type { PublicSessionView } from "@extension-twitch/contracts/sessions";
import { BroadcastOverlay } from "./broadcast-overlay";
import {
  constrainCard,
  playerCardRects,
  releasePlayerGrid,
} from "../lib/undercover-layout";
import { useConfirm } from "./ui/feedback";

type Selection = WidgetId | `player:${number}`;
type Gesture = {
  pointer: number;
  x: number;
  y: number;
  resize: boolean;
  selected: Selection;
  layout: UndercoverLayout;
  rect: LayoutRect;
  scaleX: number;
  scaleY: number;
};
export function UndercoverLayoutEditor({
  layout,
  onChange,
  view,
  connection = "preview",
  disabled = false,
}: {
  layout: UndercoverLayout;
  onChange: (layout: UndercoverLayout) => void;
  view: PublicSessionView;
  connection?: string;
  disabled?: boolean;
}) {
  const [selection, setSelection] = useState<Selection>("players");
  const [individual, setIndividual] = useState(false);
  const confirm = useConfirm(),
    frame = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null);
  const count = view.participants.length;
  const slot = selection.startsWith("player:")
    ? Number(selection.slice(7))
    : null;
  const id = slot === null ? (selection as WidgetId) : "players";
  const rect =
    slot === null
      ? layout.widgets[id]
      : (releasePlayerGrid(layout, count).players.cards[slot] ??
        layout.widgets.players);
  const label = slot === null ? widgetLabels[id] : `Joueur ${slot + 1}`;
  const overlaps = layoutOverlaps(layout);
  function update(selected: Selection, proposed: LayoutRect, origin = layout) {
    const next = structuredClone(origin);
    if (selected.startsWith("player:")) {
      const freed = releasePlayerGrid(next, count);
      freed.players.cards[Number(selected.slice(7))] = constrainCard(proposed);
      onChange(freed);
    } else {
      next.widgets[selected as WidgetId] = constrainWidget(
        selected as WidgetId,
        proposed,
      );
      onChange(next);
    }
  }
  function begin(
    e: PointerEvent<HTMLButtonElement>,
    selected: Selection,
    resize = false,
  ) {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.focus();
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds) return;
    const player = selected.startsWith("player:");
    const original = player ? releasePlayerGrid(layout, count) : layout;
    const rect = player
      ? original.players.cards[Number(selected.slice(7))]!
      : original.widgets[selected as WidgetId];
    gesture.current = {
      pointer: e.pointerId,
      selected,
      resize,
      rect,
      layout: original,
      x: e.clientX,
      y: e.clientY,
      scaleX: player
        ? 100 / ((bounds.width * layout.widgets.players.width) / 1920)
        : 1920 / bounds.width,
      scaleY: player
        ? 100 / ((bounds.height * layout.widgets.players.height) / 1080)
        : 1080 / bounds.height,
    };
    setSelection(selected);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    const snap = (n: number) =>
      g.selected.startsWith("player:")
        ? Math.round(n * 2) / 2
        : Math.round(n / 8) * 8;
    const dx = snap((e.clientX - g.x) * g.scaleX),
      dy = snap((e.clientY - g.y) * g.scaleY);
    update(
      g.selected,
      g.resize
        ? { ...g.rect, width: g.rect.width + dx, height: g.rect.height + dy }
        : { ...g.rect, x: g.rect.x + dx, y: g.rect.y + dy },
      g.layout,
    );
  }
  function keys(
    e: KeyboardEvent<HTMLButtonElement>,
    selected: Selection,
    resize: boolean,
  ) {
    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[e.key];
    if (!delta || disabled) return;
    e.preventDefault();
    setSelection(selected);
    const player = selected.startsWith("player:"),
      step = (e.shiftKey ? 4 : 1) * (player ? 1 : 8);
    const r = player
      ? releasePlayerGrid(layout, count).players.cards[
          Number(selected.slice(7))
        ]!
      : layout.widgets[selected as WidgetId];
    update(
      selected,
      resize
        ? {
            ...r,
            width: r.width + delta[0]! * step,
            height: r.height + delta[1]! * step,
          }
        : { ...r, x: r.x + delta[0]! * step, y: r.y + delta[1]! * step },
    );
  }
  function handles(selected: Selection, style: CSSProperties, title: string) {
    return (
      <div
        key={selected}
        style={style}
        className={`layout-target ${selection === selected ? "is-selected" : ""}`}
        data-target={selected}
      >
        <button
          type="button"
          className="layout-drag"
          aria-label={`Déplacer ${title}`}
          disabled={disabled}
          onPointerDown={(e) => begin(e, selected)}
          onPointerMove={move}
          onPointerUp={() => {
            gesture.current = null;
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
          onKeyDown={(e) => keys(e, selected, false)}
          onClick={() => setSelection(selected)}
        >
          <span>{title}</span>
        </button>
        <button
          type="button"
          className="layout-resize"
          aria-label={`Redimensionner ${title}`}
          disabled={disabled}
          onPointerDown={(e) => begin(e, selected, true)}
          onPointerMove={move}
          onPointerUp={() => {
            gesture.current = null;
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
          onKeyDown={(e) => keys(e, selected, true)}
          onClick={() => setSelection(selected)}
        >
          <span aria-hidden="true" className="layout-resize-grip" />
        </button>
      </div>
    );
  }
  const playerBox = layout.widgets.players;
  const cards = playerCardRects(layout, count);
  const slots = layout.players.order.filter((i) => i < count);
  const changeMode = (mode: UndercoverLayout["players"]["mode"]) => {
    const next =
      mode === "free"
        ? releasePlayerGrid(layout, count)
        : structuredClone(layout);
    next.players.mode = mode;
    onChange(next);
  };
  return (
    <section
      className="undercover-layout-editor"
      aria-label="Personnalisation de l’overlay Undercover"
    >
      <div className="layout-intro">
        <h2>Personnaliser l’overlay Undercover</h2>
        <p>
          Vous modifiez le rendu spectateur, dans un cadre 16:9. Une fois
          enregistrée, cette disposition est utilisée dans l’aperçu et dans OBS.
          Aucun réglage ne change les règles du jeu.
        </p>
      </div>
      <div className="layout-toolbar">
        <label>
          Disposition de départ
          <select
            aria-label="Disposition de départ"
            defaultValue=""
            disabled={disabled}
            onChange={(e) => {
              const preset = e.target.value as LayoutPreset;
              e.target.value = "";
              if (preset)
                void confirm({
                  title: "Remplacer la disposition ?",
                  description:
                    "Les positions actuelles seront remplacées par cette disposition. Les règles et les joueurs sont conservés.",
                  confirmLabel: "Utiliser cette disposition",
                  onConfirm: () => {
                    onChange(createUndercoverLayout(preset));
                    return true;
                  },
                });
            }}
          >
            <option value="" disabled>
              Choisir une disposition
            </option>
            {layoutPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="secondary-button"
          disabled={disabled}
          onClick={() =>
            void confirm({
              title: "Rétablir la disposition par défaut ?",
              description:
                "Seule la disposition change. Les joueurs et la partie sont conservés.",
              confirmLabel: "Rétablir",
              onConfirm: () => {
                onChange(createUndercoverLayout());
                return true;
              },
            })
          }
        >
          Rétablir la disposition par défaut
        </button>
      </div>
      <p className="lobby-hint">
        Glissez un bloc ou sa poignée ↘. Les flèches du clavier permettent aussi
        de déplacer ou agrandir. Les blocs restent dans une marge de sécurité de
        24 pixels.
      </p>
      <div className="layout-workspace">
        <div>
          <div
            className="broadcast-frame broadcast-checker layout-canvas"
            ref={frame}
            data-testid="layout-canvas"
          >
            <BroadcastOverlay
              view={view}
              connection={connection}
              cue={null}
              layout={layout}
            />
            <div className="layout-handles">
              {widgetIds
                .filter((id) => id !== "players" || !individual)
                .map((id) => {
                  const r = layout.widgets[id];
                  return handles(
                    id,
                    {
                      left: `${r.x / 19.2}%`,
                      top: `${r.y / 10.8}%`,
                      width: `${r.width / 19.2}%`,
                      height: `${r.height / 10.8}%`,
                    },
                    widgetLabels[id],
                  );
                })}
              {individual &&
                slots.map((slot, i) => {
                  const r = cards[i]!;
                  return handles(
                    `player:${slot}`,
                    {
                      left: `${(playerBox.x + (r.x * playerBox.width) / 100) / 19.2}%`,
                      top: `${(playerBox.y + (r.y * playerBox.height) / 100) / 10.8}%`,
                      width: `${(r.width * playerBox.width) / 100 / 19.2}%`,
                      height: `${(r.height * playerBox.height) / 100 / 10.8}%`,
                    },
                    `Joueur ${slot + 1}`,
                  );
                })}
            </div>
          </div>
          <p className="lobby-hint">
            Le damier vérifie la transparence ; il n’apparaît jamais dans la
            source OBS. Aucun bloc ne peut être masqué.
          </p>
        </div>
        <aside className="layout-properties">
          <label>
            Bloc à ajuster
            <select
              aria-label="Bloc à ajuster"
              value={selection}
              disabled={disabled}
              onChange={(e) => setSelection(e.target.value as Selection)}
            >
              {widgetIds.map((id) => (
                <option key={id} value={id}>
                  {widgetLabels[id]}
                </option>
              ))}
              {view.participants.map((p, i) => (
                <option key={p.id} value={`player:${i}`}>
                  Joueur {i + 1} · {p.name}
                </option>
              ))}
            </select>
          </label>
          <strong>{label}</strong>
          <small>
            {slot === null
              ? "Position et taille en pixels sur 1920 × 1080"
              : "Position et taille en % du groupe joueurs. Modifier une carte active le placement libre."}
          </small>
          <div className="layout-number-grid">
            {(["x", "y", "width", "height"] as const).map((field, i) => (
              <label key={field}>
                {["Gauche", "Haut", "Largeur", "Hauteur"][i]}
                <LayoutCoordinate
                  key={`${selection}:${field}`}
                  type="number"
                  aria-label={`${label} · ${["Gauche", "Haut", "Largeur", "Hauteur"][i]}`}
                  value={Number(rect[field].toFixed(1))}
                  disabled={disabled}
                  step={slot === null ? 1 : "any"}
                  min={
                    slot === null
                      ? field === "x" || field === "y"
                        ? 24
                        : widgetMinimums[id][field]
                      : field === "width"
                        ? 12
                        : field === "height"
                          ? 6
                          : 0
                  }
                  onChange={(value) =>
                    update(selection, { ...rect, [field]: value })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Présentation des joueurs
            <select
              aria-label="Présentation des joueurs"
              value={layout.players.mode}
              disabled={disabled}
              onChange={(e) =>
                changeMode(
                  e.target.value as UndercoverLayout["players"]["mode"],
                )
              }
            >
              <option value="grid">Grille</option>
              <option value="horizontal">
                Horizontale (6 par ligne maximum)
              </option>
              <option value="vertical">Verticale</option>
              <option value="free">Placement libre des cartes</option>
            </select>
          </label>
          <label className="creator-check">
            <input
              type="checkbox"
              checked={individual}
              onChange={(e) => {
                setIndividual(e.target.checked);
              }}
            />
            Déplacer les cartes individuellement
          </label>
          <details>
            <summary>Ordre visuel des joueurs</summary>
            <p>Ne change ni l’ordre de parole ni les rôles.</p>
            <ol className="layout-player-order">
              {slots.map((slot, i) => (
                <li key={slot}>
                  <span>Joueur {slot + 1}</span>
                  {[-1, 1].map((delta) => (
                    <button
                      type="button"
                      className="secondary-button"
                      key={delta}
                      aria-label={`${delta === -1 ? "Avancer" : "Reculer"} Joueur ${slot + 1}`}
                      disabled={
                        disabled || i + delta < 0 || i + delta >= slots.length
                      }
                      onClick={() => {
                        const next = structuredClone(layout),
                          a = next.players.order.indexOf(slot),
                          b = next.players.order.indexOf(slots[i + delta]!);
                        [next.players.order[a], next.players.order[b]] = [
                          next.players.order[b]!,
                          next.players.order[a]!,
                        ];
                        onChange(next);
                      }}
                    >
                      {delta === -1 ? "↑" : "↓"}
                    </button>
                  ))}
                </li>
              ))}
            </ol>
          </details>
        </aside>
      </div>
      {overlaps.length > 0 && (
        <p className="lobby-warning" role="status">
          Des blocs se superposent : {overlaps.join(", ")}. Déplacez-les pour
          conserver leur lisibilité. L’enregistrement reste possible pour vous
          laisser choisir.
        </p>
      )}
      {layout.players.mode === "free" && (
        <p className="lobby-hint">
          Placement libre : vérifiez les cartes pour l’effectif final. Les
          positions des places absentes sont conservées pour les prochaines
          parties. Évitez de superposer les cartes.
        </p>
      )}
    </section>
  );
}

/** Preserve incomplete typing while the canvas stays bounded; normalize the field on blur. */
function LayoutCoordinate({
  value,
  onChange,
  ...props
}: {
  value: number;
  onChange: (value: number) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);
  return (
    <input
      {...props}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setText(String(value));
      }}
      onChange={(e) => {
        setText(e.target.value);
        if (e.target.value !== "" && Number.isFinite(e.target.valueAsNumber))
          onChange(e.target.valueAsNumber);
      }}
    />
  );
}
