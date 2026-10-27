import { BroadcastFeed } from "../../../../components/broadcast-feed";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="obs-output" aria-label="Source navigateur OBS">
      <BroadcastFeed id={id} />
    </main>
  );
}
