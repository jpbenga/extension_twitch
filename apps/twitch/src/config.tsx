import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { helper } from "./helper";
import {
  sessionFromPublicInput,
  viewerConfigurationSchema,
} from "./configuration";
import "../../web/src/app/tokens.css";
import "./twitch.css";

function Config() {
  const [ready, setReady] = useState(false),
    [origin, setOrigin] = useState("https://localhost:8443");
  const [session, setSession] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const pending = useRef<string | null>(null),
    inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const ext = helper();
    let disposed = false;
    if (!ext) {
      setMessage(
        "Ouvrez cette configuration depuis Twitch Developer Console ou les réglages de votre extension Twitch.",
      );
      return;
    }
    ext.onAuthorized(() => {
      if (!disposed) setReady(true);
    });
    ext.configuration.onChanged(() => {
      if (disposed) return;
      const content = ext.configuration.broadcaster?.content;
      try {
        if (content) {
          const c = viewerConfigurationSchema.parse(
            JSON.parse(content) as unknown,
          );
          setOrigin(c.apiOrigin);
          setSession(c.sessionId);
          if (content === pending.current) {
            setMessage("Partie associée au plateau Twitch.");
            pending.current = null;
            inFlight.current = false;
            setBusy(false);
            clearTimeout(timer.current);
          }
        }
      } catch {
        setMessage(
          "L’ancienne configuration n’est pas utilisable. Associez de nouveau le plateau public.",
        );
      }
    });
    return () => {
      disposed = true;
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <main className="twitch-config">
      <h1>Plateau Undercover</h1>
      <p>
        Associez une partie existante. Les commandes restent dans votre régie ;
        Twitch affiche seulement les informations publiques.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (inFlight.current || !ready) return;
          inFlight.current = true;
          setBusy(true);
          setMessage("");
          try {
            const c = viewerConfigurationSchema.parse({
              version: 1,
              sessionId: sessionFromPublicInput(session),
              apiOrigin: origin.trim(),
            });
            const response = await fetch(
              `${c.apiOrigin}/api/server/sessions/${c.sessionId}/public`,
              { credentials: "omit", cache: "no-store" },
            );
            if (!response.ok)
              throw new Error(
                "Ce plateau n’est pas accessible. Vérifiez le serveur HTTPS et le lien public.",
              );
            const payload: unknown = await response.json();
            // Validate the same public contract as the actual viewer before persisting the pointer.
            const { publicSessionSchema } =
              await import("@extension-twitch/contracts/sessions");
            const view = publicSessionSchema.parse(payload);
            if (view.sessionId !== c.sessionId || view.gameId !== "undercover")
              throw new Error("Choisissez une partie Undercover.");
            const content = JSON.stringify(c);
            pending.current = content;
            helper()!.configuration.set("broadcaster", "1", content);
            // A helper call alone is not a confirmation of persistence.
            timer.current = setTimeout(() => {
              pending.current = null;
              inFlight.current = false;
              setBusy(false);
              setMessage(
                "Twitch n’a pas confirmé l’enregistrement. Vérifiez Configuration Service et les droits du diffuseur, puis réessayez.",
              );
            }, 10000);
          } catch (error) {
            pending.current = null;
            inFlight.current = false;
            setBusy(false);
            setMessage(
              error instanceof Error &&
                !(error instanceof TypeError) &&
                !error.message.startsWith("[")
                ? error.message
                : "Vérifiez l’origine HTTPS et le lien public, sans accès privé.",
            );
          }
        }}
      >
        <label>
          Serveur public HTTPS
          <input
            type="url"
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            disabled={busy}
            autoComplete="off"
          />
        </label>
        <label>
          Lien public du plateau
          <input
            type="text"
            required
            value={session}
            onChange={(e) => setSession(e.target.value)}
            disabled={busy}
            autoComplete="off"
            placeholder="Lien public ou identifiant de session"
          />
        </label>
        <p>
          Copiez le lien du plateau public ou OBS, jamais le lien privé GM ou
          joueur.
        </p>
        <button disabled={!ready || busy} type="submit">
          {busy ? "Association en cours…" : "Associer cette partie"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      {!ready && (
        <p>
          En attente de l’autorisation Twitch. Cette page ne fonctionne pas
          comme une application autonome.
        </p>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Config />);
