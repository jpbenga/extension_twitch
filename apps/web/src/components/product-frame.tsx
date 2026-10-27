import Link from "next/link";
import { ThemeControl } from "./application-theme";
export function ProductFrame({
  children,
  catalogLink = true,
}: {
  children: React.ReactNode;
  catalogLink?: boolean;
}) {
  return (
    <main className="session-shell creator-shell creator-next">
      <header className="creator-top">
        <Link className="session-brand" href="/">
          xt{" "}
          <span>
            Extension Twitch<small>JEUX EN DIRECT</small>
          </span>
        </Link>
        <div className="product-header-tools">
          <ThemeControl />
          {catalogLink && (
            <Link className="text-link" href="/play">
              Choisir un jeu
            </Link>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}
