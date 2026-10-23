import { notFound } from "next/navigation";
import { DesignCatalog } from "../../components/ui/catalog";
export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignCatalog />;
}
