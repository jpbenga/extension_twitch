"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  gmSessionSchema,
  sessionIdSchema,
} from "@extension-twitch/contracts/sessions";
import { readLab } from "../lib/creator-lab";
import { accessKey } from "../lib/session-client";
export const recentSessionKey = "xt:recent-gm-session";
/** This tab remembers a reference only; authorization is always checked by the server. */
export function ResumeSession() {
  const [recent, setRecent] = useState<{
    id: string;
    title: string;
    lab: boolean;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const id = sessionStorage.getItem(recentSessionKey);
        if (!sessionIdSchema.safeParse(id).success || !id) return;
        const token = sessionStorage.getItem(accessKey(id, "gm"));
        if (!token) return;
        const response = await fetch(`/api/server/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const parsed = gmSessionSchema.safeParse(await response.json());
        if (parsed.success && !parsed.data.publicGame?.play?.outcome)
          setRecent({
            id,
            title: parsed.data.title,
            lab: readLab(id)?.mode === "quick",
          });
      } catch {
        /* A stale or inaccessible reference never grants access. */
      }
    })();
    return () => controller.abort();
  }, []);
  return (
    <>
      {recent && (
        <section className="lobby-panel">
          <span className="eyebrow">PARTIE EN COURS DANS CET ONGLET</span>
          <h2>{recent.title}</h2>
          <Link
            href={
              recent.lab
                ? `/play/lab/${recent.id}`
                : `/sessions/${recent.id}/gm`
            }
            className="primary-button"
          >
            Reprendre ma partie
          </Link>
        </section>
      )}
      <Link
        className={recent ? "secondary-button" : "primary-button"}
        href="/play"
      >
        Choisir un jeu
      </Link>
    </>
  );
}
