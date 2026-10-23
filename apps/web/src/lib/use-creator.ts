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
  requestMessage,
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
  const [ready, setReady] = useState(false);
  const currentAccess = useRef<Access | null>(null);
  const latestView = useRef<StudioView | null>(null);
  const pending = useRef<CreatorCommand | null>(null),
    inFlight = useRef(false);
  async function load(a: Access) {
    const response = await fetch(`/api/server/studio/workspaces/${a.id}`, {
      headers: { Authorization: `Bearer ${a.token}` },
      cache: "no-store",
    });
    const next = studioViewSchema.parse(await readResponse(response));
    latestView.current = next;
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
      if (!saved) {
        setReady(true);
        return;
      }
      const a = creatorAccessSchema.parse(JSON.parse(saved) as unknown);
      currentAccess.current = a;
      setAccess(a);
      const savedCommand = sessionStorage.getItem(pendingKey);
      if (savedCommand) {
        pending.current = creatorCommandSchema.parse(
          JSON.parse(savedCommand) as unknown,
        );
        setRetryAvailable(true);
      }
      void load(a)
        .catch((e) =>
          setError(
            requestMessage(
              e,
              "Votre bibliothèque est indisponible. Vérifiez la connexion puis réessayez.",
            ),
          ),
        )
        .finally(() => setReady(true));
    } catch {
      setError(
        "Votre accès ne peut pas être chargé. Ouvrez votre lien privé pour retrouver vos jeux.",
      );
      setReady(true);
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
      currentAccess.current = a;
      setAccess(a);
      latestView.current = next;
      setView(next);
      setNotice("Votre bibliothèque est prête.");
      return next;
    } catch (e) {
      if (e instanceof RequestFailure && e.status >= 400 && e.status < 500)
        sessionStorage.removeItem("xt:creator:bootstrap");
      setError(
        requestMessage(
          e,
          "La bibliothèque n’a pas pu être créée. Vérifiez la connexion puis réessayez.",
        ),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function send(
    operation?: CreatorOperation,
  ): Promise<StudioView | null> {
    const access = currentAccess.current,
      view = latestView.current;
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
      latestView.current = next;
      setView(next);
      pending.current = null;
      sessionStorage.removeItem(pendingKey);
      setRetryAvailable(false);
      setNotice("Enregistré.");
      return next;
    } catch (e) {
      if (e instanceof RequestFailure && e.status >= 400 && e.status < 500) {
        pending.current = null;
        sessionStorage.removeItem(pendingKey);
        setRetryAvailable(false);
      }
      setError(
        e instanceof RequestFailure && e.code === "VERSION_CONFLICT"
          ? "Ce jeu a été modifié dans un autre onglet. Vos changements sont conservés. Actualisez pour comparer les deux copies."
          : requestMessage(
              e,
              "La confirmation n’est pas arrivée. Vérifiez la connexion puis reprenez l’enregistrement ; votre saisie est conservée.",
            ),
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
      setError(
        requestMessage(
          e,
          "Vos jeux ne peuvent pas être actualisés. Vérifiez la connexion puis réessayez.",
        ),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function prepare(gameId: string, version: string) {
    const access = currentAccess.current;
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
            ...(version === "draft"
              ? {
                  draftRevision: latestView.current?.workspace.games.find(
                    (g) => g.identity.id === gameId,
                  )?.draft.revision,
                }
              : {}),
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
      setNotice("La partie est créée.");
      return { sessionId: result.sessionId, token: input.sessionToken };
    } catch (e) {
      if (e instanceof RequestFailure && e.status >= 400 && e.status < 500)
        sessionStorage.removeItem(key);
      setError(
        requestMessage(
          e,
          "La confirmation du test n’est pas arrivée. Vérifiez la connexion puis touchez à nouveau Tester mon jeu pour reprendre ce même essai.",
        ),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return {
    access,
    ready,
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
