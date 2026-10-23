import { CreatorProvider } from "../../components/creator-context";
export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CreatorProvider>{children}</CreatorProvider>;
}
