import { requireLegacyStudio } from "../../lib/legacy-studio";
import { CreatorHome } from "../../components/creator-home";
export default function CreatorPage() {
  requireLegacyStudio();
  return <CreatorHome />;
}
