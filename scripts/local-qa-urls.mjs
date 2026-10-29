/** Shared presentation only: no capability URLs or session secrets in startup logs. */
export function localQaUrls(lan, twitch) {
  const origin = new URL(lan);
  return `\nExtension Twitch Studio — Local QA\n\nDesktop\nhttp://localhost:${origin.port || "80"}\n\nLAN / accueil (Mac et smartphone)\n${origin.origin}/\n\nPréparer Undercover\n${origin.origin}/play/undercover\n\nRejoindre avec une invitation\n${origin.origin}/join\n\n${twitch ? `Twitch Local Test\n${twitch}/\n` : "Twitch Local Test : facultatif, arrêter cette commande puis lancer npm run twitch:local.\n"}\nLes liens privés GM/joueurs et les vues publiques sont fournis par le salon et la régie.\nAttendez le message Ready de Next.js avant d’ouvrir l’application.\nOrdinateur et téléphone sur le même réseau de confiance. Ne pas ouvrir ces ports sur Internet.\n`;
}
