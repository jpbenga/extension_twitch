import Link from "next/link";
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
        {catalogLink && (
          <Link className="text-link" href="/play">
            Choisir un jeu
          </Link>
        )}
      </header>
      {children}
    </main>
  );
}
