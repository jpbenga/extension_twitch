import { StudioReturn } from "../../../../components/studio-return";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudioReturn id={id} />;
}
