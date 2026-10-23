"use client";

import { useEffect, useState } from "react";
import { transportEventSchema } from "@extension-twitch/contracts";

export function ServerStatus() {
  const [status, setStatus] = useState<"connecting" | "ready" | "offline">(
    "connecting",
  );
  useEffect(() => {
    const events = new EventSource("/api/server/events");
    events.onmessage = (message: MessageEvent<string>) => {
      try {
        const result = transportEventSchema.safeParse(
          JSON.parse(message.data) as unknown,
        );
        setStatus(result.success ? "ready" : "offline");
      } catch {
        setStatus("offline");
      }
    };
    events.onerror = () => setStatus("offline");
    // EventSource reconnects automatically; the next ready event restores status.
    return () => events.close();
  }, []);
  return (
    <span className={`server-status ${status}`} role="status">
      <span className="status-dot" />
      {status === "ready"
        ? "Serveur disponible"
        : status === "connecting"
          ? "Connexion au serveur…"
          : "Reconnexion au serveur…"}
    </span>
  );
}
