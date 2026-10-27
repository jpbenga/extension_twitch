"use client";
import { useEffect, useState } from "react";
import { spectatorCapabilitiesSchema } from "@extension-twitch/contracts/spectators";
import { readResponse } from "../lib/session-client";
export function SpectatorTest({ id }: { id: string }) {
  const [reason, setReason] = useState(
      "Vérification des interactions disponibles…",
    ),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/server/sessions/${id}/spectator-interactions`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(readResponse)
      .then((data) => setReason(spectatorCapabilitiesSchema.parse(data).reason))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setReason(
            "Les interactions ne peuvent pas être vérifiées. Réessayez après avoir retrouvé la connexion.",
          );
        }
      });
    return () => controller.abort();
  }, [id]);
  return (
    <section
      id="spectators"
      className="lobby-panel"
      aria-label="Interface spectateur de test"
    >
      <h2>Côté spectateur</h2>
      <p role={error ? "alert" : "status"}>{reason}</p>
      <p className="lobby-hint">
        L’affichage public est opérationnel. Les interactions natives Twitch,
        Bits et récompenses ne sont pas connectées.
      </p>
    </section>
  );
}
