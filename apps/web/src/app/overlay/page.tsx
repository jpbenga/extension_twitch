import { gameIdSchema } from "@extension-twitch/contracts";
import { StagePreview } from "../../components/stage-preview";

export default async function Overlay({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; transparent?: string }>;
}) {
  const parameters = await searchParams;
  const result = gameIdSchema.safeParse(parameters.game);
  const gameId = result.success ? result.data : "undercover";
  return (
    <main
      className={`overlay-page ${parameters.transparent === "1" ? "transparent" : ""}`}
      aria-label="Overlay public de démonstration"
    >
      <h1 className="sr-only">Overlay de démonstration</h1>
      <StagePreview gameId={gameId} />
    </main>
  );
}
