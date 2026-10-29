import { redirect } from "next/navigation";
import { legacyStudioEnabled } from "../../../lib/legacy-studio";
import { SessionEntry } from "../../../components/session-entry";
export default function Page() {
  if (legacyStudioEnabled()) return <SessionEntry />;
  redirect("/play/undercover");
}
