import { CreatorLaboratory } from "../../../../components/creator-laboratory";
export default async function LabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreatorLaboratory id={id} />;
}
