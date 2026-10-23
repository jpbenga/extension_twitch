import { Suspense } from "react";
import { CreatorLibrary } from "../../../components/creator-library";
export default function LibraryPage() {
  return (
    <Suspense fallback={<p>Ouverture de la bibliothèque…</p>}>
      <CreatorLibrary />
    </Suspense>
  );
}
