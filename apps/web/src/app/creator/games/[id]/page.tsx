import { CreatorEditorPage } from "../../../../components/creator-editor";
export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreatorEditorPage id={id} />;
}
