import { requireLegacyStudio } from "../../../lib/legacy-studio";
import { CreatorNew } from "../../../components/creator-new";
export default function NewPage() {
  requireLegacyStudio();
  return <CreatorNew />;
}
