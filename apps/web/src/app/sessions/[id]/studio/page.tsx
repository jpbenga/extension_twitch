import { StudioReturn } from "../../../../components/studio-return";
import { normalizeTwitchChannel } from "@extension-twitch/contracts/twitch";

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const channel = normalizeTwitchChannel(
    typeof query.twitchChannel === "string" ? query.twitchChannel : "",
  );
  return (
    <StudioReturn
      id={id}
      twitchChannel={channel}
      initialChat={query.chat === "1" && !!channel}
    />
  );
}
