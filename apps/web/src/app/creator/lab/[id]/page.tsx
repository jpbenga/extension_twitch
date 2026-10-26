import { CreatorLaboratory } from "../../../../components/creator-laboratory";
import { redirect } from "next/navigation";
import { legacyStudioEnabled } from "../../../../lib/legacy-studio";
export default async function LabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!legacyStudioEnabled()) redirect(`/play/lab/${id}`);
  return <CreatorLaboratory id={id} />;
}
