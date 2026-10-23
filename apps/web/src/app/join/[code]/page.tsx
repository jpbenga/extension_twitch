import { SessionEntry } from "../../../components/session-entry";

export default async function Join({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <SessionEntry invitationCode={code} />;
}
