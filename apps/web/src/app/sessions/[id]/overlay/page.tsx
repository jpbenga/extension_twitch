import { SessionLayoutEditor } from "../../../../components/session-layout-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionLayoutEditor id={id} />;
}
