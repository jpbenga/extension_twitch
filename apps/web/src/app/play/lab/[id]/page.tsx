import { CreatorLaboratory } from "../../../../components/creator-laboratory";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreatorLaboratory id={id} context="play" />;
}
