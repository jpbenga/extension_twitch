"use client";
import { useEffect, useRef, useState } from "react";
import {
  creatorAccessSchema,
  creatorCommandSchema,
  workspaceCreateSchema,
  creatorTestSchema,
  studioViewSchema,
  type StudioView,
  type CreatorOperation,
  type CreatorCommand,
} from "@extension-twitch/contracts/creator";
import {
  accessTokenSchema,
  sessionAccessSchema,
} from "@extension-twitch/contracts/sessions";
import {
  post,
  readResponse,
  randomToken,
  commandId,
  RequestFailure,
} from "./session-client";

type Access = ReturnType<typeof creatorAccessSchema.parse>;
const accessKey = "xt:creator:access",
  pendingKey = "xt:creator:pending";
export function useCreator() {
  const [access, setAccess] = useState<Access | null>(null);
  const [view, setView] = useState<StudioView | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [testLink, setTestLink] = useState("");
  const pending = useRef<CreatorCommand | null>(null),
    inFlight = useRef(false);
  async function load(a: Access) {
    const response = await fetch(`/api/server/studio/workspaces/${a.id}`, {
      headers: { Authorization: `Bearer ${a.token}` },
      cache: "no-store",
    });
    const next = studioViewSchema.parse(await readResponse(response));
    setView(next);
    return next;
  }
  useEffect(() => {
    try {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const supplied = fragment.has("workspace") || fragment.has("access");
      if (supplied) {
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname,
        );
        const a = creatorAccessSchema.parse({
          id: fragment.get("workspace"),
          token: fragment.get("access"),
        });
        sessionStorage.setItem(accessKey, JSON.stringify(a));
        sessionStorage.removeItem(pendingKey);
      }
      const saved = sessionStorage.getItem(accessKey);
      if (!saved) return;
      const a = creatorAccessSchema.parse(JSON.parse(saved) as unknown);
      setAccess(a);
      const savedCommand = sessionStorage.getItem(pendingKey);
      if (savedCommand) {
        pending.current = creatorCommandSchema.parse(
          JSON.parse(savedCommand) as unknown,
        );
        setRetryAvailable(true);
      }
      void load(a).catch((e) =>
        setError(e instanceof Error ? e.message : "Bibliothèque indisponible."),
      );
    } catch {
      setError(
        "Accès ou stockage privé indisponible. Ouvrez votre lien de récupération.",
      );
    }
  }, []);
  async function create(name: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const key = "xt:creator:bootstrap";
      const saved = sessionStorage.getItem(key);
      const cached = saved
        ? (JSON.parse(saved) as { token: unknown; input: unknown })
        : null;
      const token = cached
        ? accessTokenSchema.parse(cached.token)
        : randomToken();
      const input = cached
        ? workspaceCreateSchema.parse(cached.input)
        : { requestId: commandId(), name };
      sessionStorage.setItem(key, JSON.stringify({ token, input }));
      const next = studioViewSchema.parse(
        await post("/studio/workspaces", token, input),
      );
      const a = { id: next.workspace.id, token };
      sessionStorage.setItem(accessKey, JSON.stringify(a));
      sessionStorage.removeItem(key);
      setAccess(a);
      setView(next);
      setNotice(
        "Bibliothèque privée créée. Conservez votre lien de récupération.",
      );
    } catch (e) {
      if (e instanceof RequestFailure && e.status >= 400 && e.status < 500)
        sessionStorage.removeItem("xt:creator:bootstrap");
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function send(
    operation?: CreatorOperation,
  ): Promise<StudioView | null> {
    if (!access || !view || inFlight.current || (operation && pending.current))
      return null;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const envelope =
        pending.current ??
        (operation
          ? {
              commandId: commandId(),
              expectedVersion: view.workspace.version,
              operation,
            }
          : null);
      if (!envelope) return null;
      sessionStorage.setItem(pendingKey, JSON.stringify(envelope));
      pending.current = envelope;
      setRetryAvailable(true);
      const next = studioViewSchema.parse(
        await post(
          `/studio/workspaces/${access.id}/commands`,
          access.token,
          envelope,
        ),
      );
      setView(next);
      pending.current = null;
      sessionStorage.removeItem(pendingKey);
      setRetryAvailable(false);
      setNotice("Modification enregistrée.");
      return next;
    } catch (e) {
      if (e instanceof RequestFailure && e.status >= 400 && e.status < 500) {
        pending.current = null;
        sessionStorage.removeItem(pendingKey);
        setRetryAvailable(false);
      }
      setError(
        e instanceof RequestFailure && e.code === "VERSION_CONFLICT"
          ? "La bibliothèque a changé. Actualisez-la, puis comparez votre copie locale avec le brouillon serveur."
          : e instanceof Error
            ? e.message
            : "Le résultat est incertain. Réessayez la même commande.",
      );
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    if (!access || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await load(access);
      setNotice(
        "Bibliothèque actualisée. Les modifications locales de l’éditeur sont conservées.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Actualisation impossible.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function prepare(gameId: string, version: string) {
    if (!access || inFlight.current || retryAvailable) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setTestLink("");
    const key = `xt:creator:test:${access.id}:${gameId}:${version}`;
    try {
      const cached = sessionStorage.getItem(key);
      const input = cached
        ? creatorTestSchema.parse(JSON.parse(cached) as unknown)
        : {
            requestId: commandId(),
            sessionToken: randomToken(),
            gameId,
            version,
          };
      sessionStorage.setItem(key, JSON.stringify(input));
      const result = sessionAccessSchema.parse(
        await post(
          `/studio/workspaces/${access.id}/test-sessions`,
          access.token,
          input,
        ),
      );
      sessionStorage.removeItem(key);
      setTestLink(
        `${window.location.origin}/sessions/${result.sessionId}/gm#access=${input.sessionToken}`,
      );
      setNotice(
        "Session réelle préparée. Ouvrez la régie, invitez les joueurs puis installez la définition préparée.",
      );
    } catch (e) {
      if (e instanceof RequestFailure && e.status >= 400 && e.status < 500)
        sessionStorage.removeItem(key);
      setError(
        e instanceof Error
          ? e.message
          : "Test non préparé. Réessayez le même bouton.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return {
    access,
    view,
    busy,
    error,
    notice,
    retryAvailable,
    testLink,
    create,
    send,
    refresh,
    prepare,
  };
}
