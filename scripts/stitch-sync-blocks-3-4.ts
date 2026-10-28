import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SyncError, syncScreen, type SyncOptions } from "./stitch-sync.js";

// Exact IDs explicitly approved by the user; never select the latest generation.
export const approvedBlocks = [
  {
    project: "6846916727190844173",
    screens: [
      [
        "db794d2118ad4af2a111e674ae322ed8",
        "lobby-empty-desktop",
        "Salon vide · Desktop",
      ],
      ["16288864668823604838", "lobby-empty-mobile", "Salon vide · Mobile"],
      [
        "0566b56083b44eb3ab38ffad73e3b636",
        "lobby-ready-desktop",
        "Salon prêt · Desktop",
      ],
      [
        "231534bd93ae4a00b799377d3bab0dbb",
        "lobby-ready-mobile",
        "Salon prêt · Mobile",
      ],
      [
        "1bf51174c6304ee88082082e7700eb33",
        "player-arrival-mobile",
        "Arrivée joueur · Mobile",
      ],
      [
        "37b444362513422d99a89dd8e81821d3",
        "player-waiting-mobile",
        "Attente joueur · Mobile",
      ],
      [
        "4dafcc64f8c14d78b681dd92a62339cb",
        "invitation-unavailable-mobile",
        "Invitation indisponible · Mobile",
      ],
      [
        "d721c7960c2246d48f7cbbef4ca47aa7",
        "player-access-required-mobile",
        "Accès privé nécessaire · Mobile",
      ],
    ],
  },
  {
    project: "16851612906193292413",
    screens: [
      [
        "549b058bc3b94160aa9ac6f86e355854",
        "player-secret-mobile",
        "Consulter son mot privé · Mobile",
      ],
      [
        "725808adc48c4cd4ac3c5c7ab8b2a31f",
        "player-secret-hidden-mobile",
        "Masquer son mot · Mobile",
      ],
      [
        "3349ae11d4284917b4bd606eb1ba114e",
        "player-await-turn-mobile",
        "Attendre son tour · Mobile",
      ],
      [
        "2acfc07156484c4cbbe83768f597c222",
        "player-clue-turn-mobile",
        "Donner son indice à voix haute · Mobile",
      ],
      [
        "f75d1996ef274c2ba9f0c4e6a8eb4c11",
        "player-vote-mobile",
        "Choisir un joueur au vote · Mobile",
      ],
      [
        "880dbcf4460349448a85f5c806b7b8a2",
        "player-vote-confirm-mobile",
        "Confirmer son vote · Mobile",
      ],
      [
        "16c09380cc8f47189db890d4b361ed7d",
        "player-vote-recorded-mobile",
        "Vote enregistré · Mobile",
      ],
      [
        "2c6d322e8a0547ff9385d0960b494ce9",
        "player-eliminated-mobile",
        "Suivre après son élimination · Mobile",
      ],
      [
        "147fe41a39e94204ac7ce52c94461224",
        "player-round-result-mobile",
        "Élimination intermédiaire · Mobile",
      ],
      [
        "12bbffa4198e4aba81425eaacf35111a",
        "player-tie-mobile",
        "Égalité · Mobile",
      ],
      [
        "5452e2f8463549c49365d57ae993fc19",
        "player-victory-mobile",
        "Victoire et révélation finale · Mobile",
      ],
      [
        "026dfa9c05ba496cbf836f2ec89d4c57",
        "player-defeat-mobile",
        "Défaite et révélation finale · Mobile",
      ],
      [
        "ae43a10e39e148cda52565235f80429d",
        "player-draw-mobile",
        "Partie nulle · Mobile",
      ],
    ],
  },
] as const;

export async function syncApprovedBlocks(
  args: string[],
  sync: (options: SyncOptions) => ReturnType<typeof syncScreen> = syncScreen,
  report: (message: string) => void = console.log,
) {
  if (args.length !== 1 || args[0] !== "--approved")
    throw new SyncError(
      "Utilisez npm run stitch:sync:blocks-3-4 -- --approved pour attester la validation humaine des 21 écrans listés.",
    );
  const failed: string[] = [];
  let completed = 0;
  for (const { project, screens } of approvedBlocks) {
    for (const [screen, slug, surface] of screens) {
      report(`Synchronisation : ${surface}`);
      try {
        const result = await sync({
          project,
          screen,
          slug,
          surface,
          approved: true,
          replace: false,
        });
        completed++;
        report(`Export reçu : ${result.directory}/${result.image}`);
        for (const warning of result.warnings) report(warning);
      } catch (error) {
        failed.push(slug);
        report(
          `${slug} : ${error instanceof SyncError ? error.message : "Échec de la synchronisation ; aucune sortie brute Stitch affichée."}`,
        );
      }
    }
  }
  report(
    `${completed}/21 références synchronisées. Aucun commit ni push automatique.`,
  );
  if (failed.length)
    report(
      `À reprendre en relançant la commande : ${failed.join(", ")}. Les exports déjà reçus sont conservés.`,
    );
  return { completed, failed };
}

async function main() {
  if (process.argv.slice(2).includes("--help")) {
    console.log(
      "npm run stitch:sync:blocks-3-4 -- --approved\nExporte les 8 écrans Lobby et les 13 écrans Joueur explicitement validés, avec leur projet exact. Lecture seule ; aucun changement de .stitch.json, aucun commit ni push.",
    );
    return;
  }
  try {
    const { failed } = await syncApprovedBlocks(process.argv.slice(2));
    if (failed.length) process.exitCode = 1;
  } catch (error) {
    console.error(
      error instanceof SyncError
        ? error.message
        : "Synchronisation interrompue.",
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
)
  await main();
