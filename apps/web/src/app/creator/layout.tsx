import { legacyStudioEnabled } from "../../lib/legacy-studio";
import { CreatorProvider } from "../../components/creator-context";
export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!legacyStudioEnabled()) return children;
  return <CreatorProvider>{children}</CreatorProvider>;
}
