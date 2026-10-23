import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Extension Twitch — Studio de démonstration",
  description:
    "Votre régie de jeux interactifs. Démonstration technique sans connexion Twitch.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
