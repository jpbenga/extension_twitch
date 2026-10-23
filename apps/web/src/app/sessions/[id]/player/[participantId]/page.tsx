import { SessionRoom } from "../../../../../components/session-room";

export default async function Player({
  params,
}: {
  params: Promise<{ id: string; participantId: string }>;
}) {
  const { id, participantId } = await params;
  return <SessionRoom id={id} audience={`player:${participantId}`} />;
}
