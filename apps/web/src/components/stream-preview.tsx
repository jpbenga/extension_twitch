"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  officialThemes,
  historicalBroadcastTheme,
  type ThemeId,
} from "@extension-twitch/contracts/themes";
import { BroadcastFeed } from "./broadcast-feed";
import { CopyLink } from "./copy-link";
import { SegmentedControl } from "./ui/primitives";
import { SpectatorTest } from "./spectator-test";
import { accessKey } from "../lib/session-client";
import { readLab } from "../lib/creator-lab";
import {
  accessTokenSchema,
  gmSessionSchema,
} from "@extension-twitch/contracts/sessions";
import "../app/brand-fonts.css";
export function StreamPreview({ id }: { id: string }) {
  const [mode, setMode] = useState("scene"),
    [origin, setOrigin] = useState(""),
    [broadcastTheme, setBroadcastTheme] = useState<ThemeId>(
      historicalBroadcastTheme,
    );
  const [back, setBack] = useState({
    href: `/sessions/${id}/public`,
    label: "← Plateau public",
  });
  useEffect(() => {
    setOrigin(window.location.origin);
    const controller = new AbortController();
    setBack({ href: `/sessions/${id}/public`, label: "← Plateau public" });
    void (async () => {
      try {
        const token = sessionStorage.getItem(accessKey(id, "gm"));
        if (!accessTokenSchema.safeParse(token).success) return;
        const response = await fetch(`/api/server/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const gm = gmSessionSchema.safeParse(await response.json());
        if (
          !gm.success ||
          gm.data.sessionId !== id ||
          controller.signal.aborted
        )
          return;
        let lab: ReturnType<typeof readLab> = null;
        try {
          lab = readLab(id);
        } catch {
          /* Invalid lab data does not invalidate verified GM access. */
        }
        const fromLab =
          new URLSearchParams(location.search).get("from") === "lab" &&
          lab?.token === token;
        setBack(
          fromLab
            ? { href: `/play/lab/${id}`, label: "← Retour au laboratoire" }
            : { href: `/sessions/${id}/gm#board`, label: "← Régie" },
        );
      } catch {
        /* No verified capability: stay in the public context. */
      }
    })();
    return () => controller.abort();
  }, [id]);
  return (
    <main className="stitch-page broadcast-workbench broadcast-preview-page">
      <div className="broadcast-workbench-inner stream-preview-shell">
        <Link href={back.href} className="broadcast-back-link">
          {back.label}
        </Link>
        <header className="broadcast-page-heading">
          <div>
            <h1>Aperçu de l’émission</h1>
            <p>Scène fictive · aucun flux Twitch</p>
          </div>
          <small>
            Thème public :{" "}
            {officialThemes.find((theme) => theme.id === broadcastTheme)?.name}
          </small>
        </header>
        <SegmentedControl
          label="Fond de la prévisualisation"
          value={mode}
          onChange={setMode}
          options={[
            { value: "scene", label: "Scène fictive" },
            { value: "transparent", label: "Overlay seul" },
          ]}
        />
        <div
          className={`broadcast-preview-canvas ${mode === "transparent" ? "broadcast-checker" : ""}`}
        >
          <BroadcastFeed
            id={id}
            scene={mode === "scene"}
            onTheme={setBroadcastTheme}
          />
        </div>
        <p className="broadcast-caption">
          Miniature 16:9 · même plateau public que la source OBS.
        </p>
        <details className="stream-tools">
          <summary>Utiliser ce plateau dans OBS</summary>
          <section className="broadcast-tool-card">
            <h2>Source navigateur OBS</h2>
            <p>1920 × 1080 · fond transparent.</p>
            <CopyLink
              label="URL publique de l’overlay OBS"
              value={`${origin}/sessions/${id}/obs`}
              buttonLabel="Copier l’URL OBS"
            />
            <a
              className="secondary-button"
              href={`/sessions/${id}/obs`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir l’overlay seul ↗
            </a>
            <p className="broadcast-caption">
              Le décor et le damier de cet aperçu restent en dehors de la source
              OBS.
            </p>
          </section>
        </details>
        <details className="stream-tools">
          <summary>Participation des spectateurs</summary>
          <SpectatorTest id={id} />
        </details>
      </div>
    </main>
  );
}
