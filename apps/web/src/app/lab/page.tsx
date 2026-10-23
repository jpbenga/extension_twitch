import { notFound } from "next/navigation";
import { DevelopmentLab } from "../../components/development-lab";

export const dynamic = "force-dynamic";
export default function LabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevelopmentLab />;
}
