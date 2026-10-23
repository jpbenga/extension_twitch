import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./sessions.css";
import "./creator.css";

export const metadata: Metadata = {
  title: "Extension Twitch Studio — Sessions",
  description:
    "Votre plateau synchronisé et votre régie mobile, sans connexion Twitch.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111117",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
