import type { Metadata, Viewport } from "next";
import "./tokens.css";
import "./globals.css";
import "./sessions.css";
import "./creator.css";
import "./design-system.css";
import { LegacyToolsContext } from "../components/legacy-tools";
import { FeedbackProvider } from "../components/ui/feedback";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Extension Twitch Studio — Jeux en direct",
  description:
    "Votre plateau synchronisé et votre régie mobile, sans connexion Twitch.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101017",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <LegacyToolsContext
          value={
            process.env.NODE_ENV !== "production" &&
            process.env.LEGACY_STUDIO_ENABLED === "1"
          }
        >
          <FeedbackProvider>{children}</FeedbackProvider>
        </LegacyToolsContext>
      </body>
    </html>
  );
}
