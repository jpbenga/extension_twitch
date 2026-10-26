import { requireLegacyStudio } from "../../../lib/legacy-studio";
import { Suspense } from "react";
import { CreatorLibrary } from "../../../components/creator-library";
export default function LibraryPage() {
  requireLegacyStudio();
  return (
    <Suspense fallback={<p>Ouverture de la bibliothèque…</p>}>
      <CreatorLibrary />
    </Suspense>
  );
}
