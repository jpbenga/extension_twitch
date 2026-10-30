"use client";
import { useEffect, useRef, useState } from "react";
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
  const camera = useRef<MediaStream | null>(null),
    cameraVideo = useRef<HTMLVideoElement | null>(null),
    cameraRequest = useRef(0);
  const [cameraActive, setCameraActive] = useState(false),
    [cameraBusy, setCameraBusy] = useState(false),
    [cameraError, setCameraError] = useState("");
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
  useEffect(() => {
    if (cameraVideo.current) cameraVideo.current.srcObject = camera.current;
  }, [cameraActive, mode]);
  useEffect(
    () => () => {
      cameraRequest.current += 1;
      camera.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  const stopCamera = () => {
    cameraRequest.current += 1;
    camera.current?.getTracks().forEach((track) => track.stop());
    camera.current = null;
    setCameraActive(false);
    setCameraBusy(false);
  };
  const changeMode = (next: string) => {
    if (next !== "camera") stopCamera();
    setCameraError("");
    setMode(next);
  };
  const startCamera = async () => {
    stopCamera();
    const request = ++cameraRequest.current;
    setCameraBusy(true);
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Camera API unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (request !== cameraRequest.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      camera.current = stream;
      setCameraActive(true);
    } catch {
      if (request === cameraRequest.current)
        setCameraError(
          "La caméra n’est pas disponible ici. Autorisez-la dans Chrome et ouvrez cette répétition depuis localhost sur le Mac.",
        );
    } finally {
      if (request === cameraRequest.current) setCameraBusy(false);
    }
  };
  return (
    <main className="stitch-page broadcast-workbench broadcast-preview-page">
      <div className="broadcast-workbench-inner stream-preview-shell">
        <Link href={back.href} className="broadcast-back-link">
          {back.label}
        </Link>
        <header className="broadcast-page-heading">
          <div>
            <h1>Répétition avant direct</h1>
            <p>Vraie partie synchronisée · aucun flux Twitch</p>
          </div>
          <small>
            Thème public :{" "}
            {officialThemes.find((theme) => theme.id === broadcastTheme)?.name}
          </small>
        </header>
        <p className="broadcast-rehearsal-intro">
          Gardez cette page ouverte à côté de la régie. Les passages, votes et
          résultats acceptés par le serveur apparaissent ici automatiquement,
          sans diffusion vers Twitch.
        </p>
        <SegmentedControl
          label="Décor de la répétition"
          value={mode}
          onChange={changeMode}
          options={[
            { value: "scene", label: "Scène de contrôle" },
            { value: "camera", label: "Ma caméra" },
            { value: "transparent", label: "Overlay seul" },
          ]}
        />
        <div
          className={`broadcast-preview-canvas ${mode === "transparent" ? "broadcast-checker" : ""} ${mode === "camera" ? "is-camera" : ""}`}
        >
          {mode === "camera" ? (
            <div className="broadcast-camera-stage">
              <video
                ref={cameraVideo}
                className="broadcast-camera-video"
                aria-label="Aperçu local de ma caméra"
                autoPlay
                muted
                playsInline
              />
              <div className="broadcast-camera-overlay">
                <BroadcastFeed id={id} onTheme={setBroadcastTheme} />
              </div>
              {!cameraActive && (
                <div className="broadcast-camera-permission">
                  <strong>Caméra locale désactivée</strong>
                  <p>
                    L’image reste sur ce Mac et n’est envoyée ni au serveur ni à
                    Twitch.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={cameraBusy}
                    onClick={() => void startCamera()}
                  >
                    {cameraBusy
                      ? "Autorisation en cours…"
                      : "Activer ma caméra"}
                  </button>
                  {cameraError && <p role="alert">{cameraError}</p>}
                </div>
              )}
            </div>
          ) : (
            <BroadcastFeed
              id={id}
              scene={mode === "scene"}
              onTheme={setBroadcastTheme}
            />
          )}
        </div>
        {mode === "camera" && cameraActive && (
          <div className="broadcast-camera-controls" role="status">
            <span>Caméra active uniquement dans cette répétition.</span>
            <button
              type="button"
              className="secondary-button"
              onClick={stopCamera}
            >
              Désactiver la caméra
            </button>
          </div>
        )}
        <p className="broadcast-caption">
          Cadre 16:9 · même projection publique que la source OBS et l’extension
          Twitch.
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
