"use client";
import { useEffect, useState } from "react";
import type { UndercoverContent } from "@extension-twitch/contracts/undercover-stream";
import { accessKey } from "../lib/session-client";
/** Fetch with the exact player capability. No credential is ever placed in an image URL. */
export function PrivateContentImage({
  content,
  sessionId,
  participantId,
}: {
  content: UndercoverContent | undefined;
  sessionId: string;
  participantId: string;
}) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    setSrc("");
    if (!content?.image) return;
    const controller = new AbortController();
    let objectUrl = "";
    const load = async () => {
      try {
        const token = sessionStorage.getItem(
          accessKey(sessionId, `player:${participantId}`),
        );
        if (!token) return;
        const r = await fetch(content.image!.url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!r.ok) return;
        const blob = await r.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        /* Text remains independently available. */
      }
    };
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [content?.id, content?.image?.url, sessionId, participantId]);
  return src ? (
    <img
      className="private-content-image"
      src={src}
      alt={`Illustration de ${content?.label ?? "votre contenu"}`}
      onError={() => setSrc("")}
      style={{
        display: "block",
        width: "100%",
        maxHeight: 240,
        objectFit: "contain",
        borderRadius: 12,
      }}
    />
  ) : null;
}
