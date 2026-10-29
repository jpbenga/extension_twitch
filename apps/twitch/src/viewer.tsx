import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { BroadcastFeed } from "../../web/src/components/broadcast-feed";
import { helper } from "./helper";
import {
  viewerConfigurationSchema,
  type ViewerConfiguration,
} from "./configuration";
import "../../web/src/app/tokens.css";
import "../../web/src/app/broadcast.css";
import "./twitch.css";

function Viewer() {
  const [configuration, setConfiguration] =
    useState<ViewerConfiguration | null>(null);
  const [message, setMessage] = useState("Connexion à Twitch…");
  useEffect(() => {
    const ext = helper();
    let disposed = false,
      authorized = false;
    const load = () => {
      if (disposed || !authorized) return;
      try {
        const content = ext?.configuration.broadcaster?.content;
        if (!content) {
          setConfiguration(null);
          setMessage("Le Game Master n’a pas encore associé de partie.");
          return;
        }
        const next = viewerConfigurationSchema.parse(
          JSON.parse(content) as unknown,
        );
        setConfiguration(next);
        setMessage("");
      } catch {
        setConfiguration(null);
        setMessage(
          "La configuration du plateau est indisponible. Le diffuseur doit la vérifier.",
        );
      }
    };
    if (!ext) {
      setMessage(
        "Ouvrez cette extension dans Twitch Local Test ou Hosted Test. Le Helper Twitch n’est pas disponible.",
      );
      return;
    }
    ext.configuration.onChanged(load);
    ext.onAuthorized(() => {
      authorized = true;
      load();
    });
    const timer = setTimeout(() => {
      if (!authorized && !disposed)
        setMessage(
          "Twitch n’a pas autorisé cette vue. Vérifiez le compte de test et l’activation de l’extension.",
        );
    }, 12000);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, []);
  return configuration ? (
    <main className="twitch-viewer" aria-label="Plateau public Undercover">
      <BroadcastFeed
        key={`${configuration.apiOrigin}/${configuration.sessionId}`}
        id={configuration.sessionId}
        apiOrigin={configuration.apiOrigin}
      />
    </main>
  ) : (
    <main className="twitch-message">
      <h1>Undercover</h1>
      <p role="status">{message}</p>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Viewer />);
