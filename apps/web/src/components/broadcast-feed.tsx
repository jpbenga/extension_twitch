"use client";
import { historicalBroadcastTheme } from "@extension-twitch/contracts/themes";
import { useEffect, useRef, useState } from "react";
import { useSession } from "../lib/use-session";
import {
  nextPublicCue,
  type PublicCursor,
  type PublicCue,
} from "../lib/public-cues";
import { BroadcastOverlay } from "./broadcast-overlay";
export function BroadcastFeed({
  id,
  scene = false,
}: {
  id: string;
  scene?: boolean;
}) {
  const session = useSession(id, "public");
  const cursor = useRef<PublicCursor | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [cue, setCue] = useState<PublicCue | null>(null);
  const view =
    session.view?.audience === "public" && session.view.sessionId === id
      ? session.view
      : null;
  useEffect(() => {
    if (session.connection !== "connected" || !view) {
      clearTimeout(timer.current);
      cursor.current = null;
      setCue(null);
      return;
    }
    if (
      cursor.current?.epoch === session.streamEpoch &&
      view.version <= cursor.current.view.version
    )
      return;
    clearTimeout(timer.current);
    const next = nextPublicCue(cursor.current, view, session.streamEpoch);
    cursor.current = next.cursor;
    setCue(next.cue);
    if (next.cue) timer.current = setTimeout(() => setCue(null), 2600);
  }, [view, session.streamEpoch, session.connection]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
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
      <BroadcastOverlay view={view} connection={session.connection} cue={cue} />
      {session.error && (
        <p className="broadcast-error" role="alert">
          {session.error}
        </p>
      )}
    </div>
  );
}
