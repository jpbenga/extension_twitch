"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  gmSessionSchema,
  sessionIdSchema,
} from "@extension-twitch/contracts/sessions";
import { readLab } from "../lib/creator-lab";
import { accessKey } from "../lib/session-client";
export const recentSessionKey = "xt:recent-gm-session";
export interface RecentSession {
  id: string;
  title: string;
  lab: boolean;
}
export type ResumeStatus =
  "none" | "checking" | "available" | "unavailable" | "finished";
/** This tab remembers a reference only; authorization is always checked by the server. */
export function useRecentSession() {
  const [recent, setRecent] = useState<RecentSession | null>(null);
  const [status, setStatus] = useState<ResumeStatus>("none");
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const id = sessionStorage.getItem(recentSessionKey);
        if (!sessionIdSchema.safeParse(id).success || !id) return;
        const token = sessionStorage.getItem(accessKey(id, "gm"));
        if (!token) return;
        setStatus("checking");
        const response = await fetch(`/api/server/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          setStatus("unavailable");
          return;
        }
        const parsed = gmSessionSchema.safeParse(await response.json());
        if (!parsed.success) {
          setStatus("unavailable");
          return;
        }
        if (parsed.data.publicGame?.play?.outcome) {
          setStatus("finished");
          return;
        }
        setRecent({
          id,
          title: parsed.data.title,
          lab: readLab(id)?.mode === "quick",
        });
        setStatus("available");
      } catch {
        /* A stale or inaccessible reference never grants access. */
        if (!controller.signal.aborted) setStatus("unavailable");
      }
    })();
    return () => controller.abort();
  }, []);
  return { recent, status };
}

export function ResumeSession({
  showCatalogLink = true,
  children,
}: {
  showCatalogLink?: boolean;
  children?: (hasRecent: boolean) => ReactNode;
}) {
  const { recent } = useRecentSession();
  return (
    <>
      {recent && (
        <section className="lobby-panel resume-card">
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
      {showCatalogLink && (
        <Link
          className={recent ? "secondary-button" : "primary-button"}
          href="/play"
        >
          Choisir un jeu
        </Link>
      )}
      {children?.(recent !== null)}
    </>
  );
}
