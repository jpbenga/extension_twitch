import { OfficialGamesLab } from "../../../components/official-games-lab";
import { redirect } from "next/navigation";
import { legacyStudioEnabled } from "../../../lib/legacy-studio";
export default function Page() {
  if (!legacyStudioEnabled()) redirect("/play/undercover");
  return <OfficialGamesLab />;
}
