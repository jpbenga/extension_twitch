"use client";
import { useToast } from "../components/ui/feedback";

import { useEffect, useRef, useState } from "react";
import {
  accessTokenSchema,
  lobbyCommandSchema,
  sessionStreamEventSchema,
  sessionViewSchema,
  type LobbyAction,
  type LobbyCommand,
  type SessionView,
} from "@extension-twitch/contracts/sessions";
import {
  accessKey,
  commandId,
  parseSse,
  post,
  readResponse,
  RequestFailure,
} from "./session-client";

export type SessionAudience = "gm" | "public" | `player:${string}`;
type Connection = "loading" | "connected" | "reconnecting" | "denied";

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
  });
}

export function useSession(id: string, audience: SessionAudience) {
  const notify = useToast();
  const key = accessKey(id, audience);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [accessRevision, setAccessRevision] = useState(0);
  const [view, setView] = useState<SessionView | null>(null);
  const [connection, setConnection] = useState<Connection>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryAvailable, setRetryAvailable] = useState(false);
  const pending = useRef<LobbyCommand | null>(null);
  const inFlight = useRef(false);

  const accept = (input: unknown) => {
    const next = sessionViewSchema.parse(input);
    if (
      (audience === "public" && next.audience !== "public") ||
      (audience === "gm" && next.audience !== "gm") ||
      (audience.startsWith("player:") &&
        (next.audience !== "player" ||
          `player:${next.participantId}` !== audience))
    )
      throw new RequestFailure("ACCESS_DENIED", 403);
    setView((previous) =>
      previous && previous.version > next.version ? previous : next,
    );
  };

  useEffect(() => {
    function restoreAccess() {
      setToken(undefined);
      setView(null);
      setError("");
      setConnection("loading");
      try {
        const supplied = new URLSearchParams(window.location.hash.slice(1)).get(
          "access",
        );
        if (supplied !== null)
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search,
          );
        if (audience === "public") {
          setToken(null);
          setAccessRevision((value) => value + 1);
          return;
        }
        if (supplied)
          sessionStorage.setItem(key, accessTokenSchema.parse(supplied));
        const stored = sessionStorage.getItem(key);
        if (!accessTokenSchema.safeParse(stored).success)
          throw new RequestFailure("ACCESS_DENIED", 401);
        setToken(stored);
        setAccessRevision((value) => value + 1);
        const saved = sessionStorage.getItem(`${key}:pending`);
        pending.current = saved
          ? lobbyCommandSchema.parse(JSON.parse(saved) as unknown)
          : null;
        setRetryAvailable(pending.current !== null);
      } catch (failure) {
        setError(
          failure instanceof RequestFailure
            ? failure.message
            : "Le stockage privé de cet onglet est indisponible. Autorisez le stockage puis ouvrez votre lien privé.",
        );
        setConnection("denied");
      }
    }
    restoreAccess();
    const importAccess = () => {
      if (new URLSearchParams(window.location.hash.slice(1)).has("access"))
        restoreAccess();
    };
    window.addEventListener("hashchange", importAccess);
    return () => window.removeEventListener("hashchange", importAccess);
  }, [key, audience]);

  useEffect(() => {
    if (token === undefined) return;
    const lifecycle = new AbortController();
    const path = `/api/server/sessions/${id}/${audience === "public" ? "public" : "private"}/events`;
    let current: AbortController | null = null;
    async function connect() {
      let delay = 500;
      while (!lifecycle.signal.aborted) {
        current = new AbortController();
        let watchdog: ReturnType<typeof setTimeout> | undefined;
        try {
          watchdog = setTimeout(() => current?.abort(), 15_000);
          const response = await fetch(path, {
            signal: current.signal,
            credentials: "same-origin",
            cache: "no-store",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          clearTimeout(watchdog);
          if (!response.ok) await readResponse(response);
          const reader = response.body?.getReader();
          if (!reader) throw new Error("Stream unavailable");
          const decoder = new TextDecoder();
          let buffer = "";
          while (!lifecycle.signal.aborted) {
            watchdog = setTimeout(() => current?.abort(), 25_000);
            const chunk = await reader.read();
            clearTimeout(watchdog);
            if (chunk.done) throw new Error("Stream ended");
            buffer += decoder.decode(chunk.value, { stream: true });
            if (buffer.length > 262_144)
              throw new Error("Stream frame too large");
            const parsed = parseSse(buffer);
            buffer = parsed.remaining;
            for (const data of parsed.messages) {
              const event = sessionStreamEventSchema.parse(
                JSON.parse(data) as unknown,
              );
              if (event.type === "access.revoked")
                throw new RequestFailure("ACCESS_REVOKED", 403);
              accept(event.view);
              setConnection("connected");
              delay = 500;
            }
          }
        } catch (failure) {
          if (lifecycle.signal.aborted) return;
          if (
            failure instanceof RequestFailure &&
            [401, 403, 404].includes(failure.status)
          ) {
            setError(failure.message);
            setView(null);
            setConnection("denied");
            return;
          }
          setConnection("reconnecting");
        } finally {
          clearTimeout(watchdog);
          current?.abort();
        }
        await pause(delay, lifecycle.signal);
        delay = Math.min(delay * 2, 8000);
      }
    }
    void connect();
    return () => {
      lifecycle.abort();
      current?.abort();
    };
    // Each lifecycle is tied to one authenticated identity; accept only uses these values.
  }, [id, audience, token, accessRevision]);

  async function send(action?: LobbyAction) {
    if (!view || !token || inFlight.current || connection !== "connected")
      return false;
    if (pending.current && action) {
      setError("Confirmez d’abord la commande en attente avec Réessayer.");
      return false;
    }
    const request =
      pending.current ??
      (action
        ? {
            commandId: commandId(),
            expectedVersion: view.version,
            command: action,
          }
        : null);
    if (!request) return false;
    const submittedAt = performance.now();
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      sessionStorage.setItem(`${key}:pending`, JSON.stringify(request));
      pending.current = request;
      accept(await post(`/sessions/${id}/commands`, token, request));
      pending.current = null;
      sessionStorage.removeItem(`${key}:pending`);
      setRetryAvailable(false);
      setNotice("Commande enregistrée.");
      notify("Action enregistrée.");
      return true;
    } catch (failure) {
      const definite =
        failure instanceof RequestFailure && failure.status < 500;
      if (definite) {
        pending.current = null;
        sessionStorage.removeItem(`${key}:pending`);
        setRetryAvailable(false);
      } else setRetryAvailable(true);
      setError(
        failure instanceof RequestFailure
          ? failure.message
          : "Confirmation indisponible. Réessayez la même commande pour éviter une double exécution.",
      );
      return false;
    } finally {
      // Keep a rapid second mobile tap from reversing an already acknowledged action.
      await new Promise<void>((resolve) =>
        setTimeout(
          resolve,
          Math.max(0, 350 - (performance.now() - submittedAt)),
        ),
      );
      inFlight.current = false;
      setBusy(false);
    }
  }

  return { view, token, connection, error, notice, busy, retryAvailable, send };
}
