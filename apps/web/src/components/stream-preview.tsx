"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductFrame } from "./product-frame";
import { BroadcastFeed } from "./broadcast-feed";
import { CopyLink } from "./copy-link";
import { SegmentedControl } from "./ui/primitives";
import { SpectatorTest } from "./spectator-test";
export function StreamPreview({ id }: { id: string }) {
  const [mode, setMode] = useState("scene"),
    [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <ProductFrame>
      <div className="creator-page-title">
        <div>
          <span className="eyebrow">PRÉVISUALISATION · 16:9</span>
          <h1>Aperçu de l’émission</h1>
          <p>
            Scène fictive, véritable plateau synchronisé. Aucun flux Twitch ou
            vidéo réelle.
          </p>
        </div>
        <Link href={`/play/lab/${id}`} className="text-link">
          Retour au laboratoire
        </Link>
      </div>
      <SegmentedControl
        label="Fond de la prévisualisation"
        value={mode}
        onChange={setMode}
        options={[
          { value: "scene", label: "Scène fictive" },
          { value: "transparent", label: "Overlay seul" },
        ]}
      />
      <div className={mode === "transparent" ? "broadcast-checker" : ""}>
        <BroadcastFeed id={id} scene={mode === "scene"} />
      </div>
      <p className="lobby-hint">
        Le damier sert uniquement à vérifier la transparence. La source OBS
        conserve le fond transparent ; seuls les panneaux du jeu sont visibles.
      </p>
      <section className="lobby-panel">
        <h2>Source navigateur OBS</h2>
        <p>1920 × 1080 · même rendu et données publiques que cet aperçu.</p>
        <CopyLink
          label="URL publique de l’overlay OBS"
          value={`${origin}/sessions/${id}/obs`}
        />
        <a
          className="secondary-button"
          href={`/sessions/${id}/obs`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir l’overlay seul ↗
        </a>
      </section>
      <SpectatorTest id={id} />
    </ProductFrame>
  );
}
