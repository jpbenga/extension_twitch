"use client";
import {
  historicalBroadcastTheme,
  type ThemeId,
} from "@extension-twitch/contracts/themes";
import { useEffect, useRef, useState } from "react";
import { usePublicSession } from "../lib/use-public-session";
import { PublicMediaOrigin } from "../lib/public-media-origin";
import {
  nextPublicCue,
  publicCueDuration,
  type PublicCursor,
  type PublicCue,
} from "../lib/public-cues";
import { scheduleBroadcastMoment } from "../lib/broadcast-motion";
import { BroadcastOverlay } from "./broadcast-overlay";
export function BroadcastFeed({
  id,
  scene = false,
  onTheme,
  apiOrigin = "",
}: {
  id: string;
  scene?: boolean;
  onTheme?: (theme: ThemeId) => void;
  apiOrigin?: string;
}) {
  const session = usePublicSession(id, apiOrigin);
  const cursor = useRef<PublicCursor | null>(null),
    timer = useRef<(() => void) | undefined>(undefined);
  const [cue, setCue] = useState<PublicCue | null>(null);
  const view =
    session.view?.audience === "public" && session.view.sessionId === id
      ? session.view
      : null;
  useEffect(() => {
    if (view) onTheme?.(view.broadcastTheme ?? historicalBroadcastTheme);
  }, [view?.broadcastTheme, !!view, onTheme]);
  useEffect(() => {
    if (session.connection !== "connected" || !view) {
      timer.current?.();
      cursor.current = null;
      setCue(null);
      return;
    }
    if (
      cursor.current?.epoch === session.streamEpoch &&
      view.version <= cursor.current.view.version
    )
      return;
    timer.current?.();
    const next = nextPublicCue(cursor.current, view, session.streamEpoch);
    cursor.current = next.cursor;
    if (next.cue) {
      const tv = view.overlayLayout?.schemaVersion === 2;
      timer.current = scheduleBroadcastMoment(
        next.cue,
        publicCueDuration(next.cue, tv, !!view.publicGame?.play?.outcome),
        tv
          ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 100
            : 180
          : 0,
        setCue,
      );
    } else setCue(null);
  }, [view, session.streamEpoch, session.connection]);
  useEffect(() => () => timer.current?.(), []);
  return (
    <PublicMediaOrigin value={apiOrigin}>
      <div
        className={`broadcast-frame ${scene ? "with-scene" : ""}`}
        data-testid="broadcast-frame"
        data-theme={view?.broadcastTheme ?? historicalBroadcastTheme}
      >
        {scene && (
          <div className="broadcast-demo-scene" aria-hidden="true">
            <span>SCÈNE FICTIVE · AUCUN FLUX TWITCH</span>
            <div className="demo-presenter" />
            <div className="demo-desk" />
          </div>
        )}
        <BroadcastOverlay
          view={view}
          connection={session.connection}
          cue={cue}
        />
        {session.error && (
          <p className="broadcast-error" role="alert">
            {session.error}
          </p>
        )}
      </div>
    </PublicMediaOrigin>
  );
}
