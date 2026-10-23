import type { Metadata, Viewport } from "next";
import "./tokens.css";
import "./globals.css";
import "./sessions.css";
import "./creator.css";
import "./design-system.css";
import { FeedbackProvider } from "../components/ui/feedback";

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
  themeColor: "#101017",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
