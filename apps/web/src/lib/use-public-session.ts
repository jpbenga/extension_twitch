"use client";
import { useEffect, useState } from "react";
import {
  publicSessionSchema,
  sessionStreamEventSchema,
  type PublicSessionView,
} from "@extension-twitch/contracts/sessions";
import { parseSse } from "./session-client";
import { localNetworkRequest } from "./local-network-request";

/** Read-only transport shared by OBS and the native Twitch viewer. No private storage or credential. */
export function usePublicSession(id: string, apiOrigin = "") {
  const [view, setView] = useState<PublicSessionView | null>(null);
  const [connection, setConnection] = useState("loading");
  const [streamEpoch, setEpoch] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    const lifecycle = new AbortController();
    let current: AbortController | undefined;
    let wait: ReturnType<typeof setTimeout> | undefined;
    let wake: (() => void) | undefined;
    setView(null);
    setError("");
    setConnection("loading");
    async function connect() {
      let delay = 500;
      while (!lifecycle.signal.aborted) {
        current = new AbortController();
        let watchdog: ReturnType<typeof setTimeout> | undefined;
        try {
          watchdog = setTimeout(() => current?.abort(), 15000);
          const response = await fetch(
            `${apiOrigin}/api/server/sessions/${id}/public/events`,
            localNetworkRequest(apiOrigin, {
              signal: current.signal,
              credentials: apiOrigin ? "omit" : "same-origin",
              cache: "no-store",
            }),
          );
          clearTimeout(watchdog);
          if ([401, 403, 404].includes(response.status)) {
            setView(null);
            setConnection("denied");
            setError(
              "Ce plateau n’est pas disponible. Vérifiez la partie sélectionnée.",
            );
            return;
          }
          if (!response.ok || !response.body)
            throw new Error("Unavailable stream");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "",
            first = true;
          while (!lifecycle.signal.aborted) {
            watchdog = setTimeout(() => current?.abort(), 25000);
            const chunk = await reader.read();
            clearTimeout(watchdog);
            if (chunk.done) throw new Error("Ended stream");
            buffer += decoder.decode(chunk.value, { stream: true });
            if (buffer.length > 262144) throw new Error("Oversized frame");
            const parsed = parseSse(buffer);
            buffer = parsed.remaining;
            for (const message of parsed.messages) {
              const event = sessionStreamEventSchema.parse(
                JSON.parse(message) as unknown,
              );
              if (event.type !== "session.snapshot")
                throw new Error("Unavailable projection");
              const next = publicSessionSchema.parse(event.view);
              if (next.sessionId !== id) throw new Error("Unexpected session");
              if (first) {
                setEpoch((e) => e + 1);
                first = false;
              }
              setView((previous) =>
                previous && previous.version > next.version ? previous : next,
              );
              setError("");
              setConnection("connected");
              delay = 500;
            }
          }
        } catch {
          if (!lifecycle.signal.aborted) setConnection("reconnecting");
        } finally {
          clearTimeout(watchdog);
          current?.abort();
        }
        if (lifecycle.signal.aborted) return;
        await new Promise<void>((resolve) => {
          wake = resolve;
          wait = setTimeout(resolve, delay);
        });
        delay = Math.min(delay * 2, 8000);
      }
    }
    void connect();
    return () => {
      lifecycle.abort();
      current?.abort();
      clearTimeout(wait);
      wake?.();
    };
  }, [id, apiOrigin]);
  return { view, connection, streamEpoch, error };
}
