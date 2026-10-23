"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useStudio } from "./creator-context";
export function CreatorFrame({
  children,
  workspace = false,
}: {
  children: React.ReactNode;
  workspace?: boolean;
}) {
  const studio = useStudio();
  useEffect(() => {
    if (
      workspace &&
      studio.ready &&
      !studio.access &&
      !studio.busy &&
      !studio.error
    )
      void studio.create("Ma bibliothèque");
  }, [workspace, studio.ready, studio.access, studio.busy, studio.error]);
  return (
    <main className="session-shell creator-shell creator-next">
      <header className="creator-top">
        <Link className="session-brand" href="/creator">
          xt{" "}
          <span>
            Extension Twitch<small>STUDIO CRÉATEUR</small>
          </span>
        </Link>
        <Link className="text-link" href="/creator/library">
          Ma bibliothèque
        </Link>
      </header>
      {studio.error && (
        <div className="lobby-error" role="alert">
          {studio.error}
          <button
            className="secondary-button"
            disabled={studio.busy}
            onClick={() =>
              void (studio.access
                ? studio.refresh()
                : studio.create("Ma bibliothèque"))
            }
          >
            Réessayer
          </button>
        </div>
      )}
      {studio.retryAvailable && (
        <div className="lobby-warning" role="status">
          La confirmation n’est pas arrivée. Vos changements sont conservés.
          <button
            className="secondary-button"
            disabled={studio.busy}
            onClick={() => void studio.send()}
          >
            Reprendre l’enregistrement
          </button>
        </div>
      )}
      {workspace && !studio.view ? (
        <p role="status">Ouverture de votre bibliothèque…</p>
      ) : (
        children
      )}
    </main>
  );
}
