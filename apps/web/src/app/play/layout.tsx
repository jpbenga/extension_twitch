import { CreatorProvider } from "../../components/creator-context";
export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CreatorProvider>{children}</CreatorProvider>;
}
