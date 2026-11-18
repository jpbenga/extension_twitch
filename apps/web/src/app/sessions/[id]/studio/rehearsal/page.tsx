import type { StudioSessionView } from "@extension-twitch/contracts/sessions";
import { StudioReturnCanvas } from "../../../../../components/studio-return";

const ids = Array.from(
  { length: 12 },
  (_, index) =>
    `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);
const names = [
  "Élodie",
  "Thomas",
  "Maya",
  "Alexandre au nom particulièrement long",
  "Clara",
  "Julien",
  "Nina",
  "Paul",
  "Sarah",
  "Léo",
  "Inès",
  "Gabriel",
];

function rehearsalView(count: number, state: string): StudioSessionView {
  const participants = names.slice(0, count).map((name, index) => ({
    id: ids[index]!,
    name,
    active: state === "elimination" ? index !== 1 : true,
    connected: true,
  }));
  const final = state === "reveal";
  return {
    audience: "studio",
    sessionId: "00000000-0000-4000-8000-999999999999",
    title: "Répétition avant direct",
    gameId: "undercover",
    version: 1,
    participants,
    studioGame: {
      title: "Undercover",
      phase: {
        id:
          state === "vote"
            ? "vote"
            : final
              ? "finished"
              : state === "elimination" || state === "tie"
                ? "result"
                : "discussion",
        label: final ? "Résultat final" : "Discussion",
      },
      round: 1,
      dealt: state !== "waiting",
      ...(state === "discussion" || state === "reconnecting"
        ? {
            turns: {
              round: 1,
              total: 2,
              current: participants[0]!.id,
              completed: 0,
              totalPassages: count,
              complete: false,
            },
          }
        : {}),
      ...(state === "vote"
        ? {
            ballot: {
              status: "open" as const,
              received: Math.max(1, count - 1),
              total: count,
              tied: false,
              complete: false,
            },
          }
        : state === "elimination" || state === "tie"
          ? {
              ballot: {
                status: "resolved" as const,
                received: count,
                total: count,
                tied: state === "tie",
                ...(state === "elimination"
                  ? { eliminated: participants[1]!.id }
                  : {}),
                complete: true,
              },
            }
          : {}),
      ...(final
        ? {
            outcome: {
              id: "civilians-win",
              label: "Les Civils remportent la partie",
            },
            reveal: participants.map((participant, index) => ({
              participantId: participant.id,
              name: participant.name,
              role: index % 4 === 1 ? "Undercover" : "Civil",
              content: {
                id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
                label:
                  index % 4 === 1
                    ? "Itachi — contenu au libellé volontairement très long"
                    : "Sasuke",
              },
            })),
          }
        : {}),
    },
  };
}

export default async function RehearsalPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const requested = Number(query.players);
  const count = requested === 6 || requested === 12 ? requested : 3;
  const state = typeof query.state === "string" ? query.state : "discussion";
  const chat = query.chat === "1";
  return (
    <StudioReturnCanvas
      view={rehearsalView(count, state)}
      connection={state === "reconnecting" ? "reconnecting" : "preview"}
      rehearsal
      initialChat={chat}
      chatMessages={
        chat
          ? [
              {
                id: "1",
                author: "Alexandre_M",
                message: "Élodie semble très sûre d’elle sur ce tour !",
              },
              {
                id: "2",
                author: "Clara_V",
                message: "Son indice était super bien choisi 👏",
              },
              {
                id: "3",
                author: "Marc92",
                message: "La tension monte sur le plateau.",
              },
            ]
          : []
      }
    />
  );
}
