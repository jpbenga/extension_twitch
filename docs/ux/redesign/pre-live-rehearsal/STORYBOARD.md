# Storyboard — Répétition avant direct

## Parcours principal

1. **Partie prête** — le streamer retrouve sa série Undercover préparée. La nouvelle action dominante est `Tester avant le direct`; `Ouvrir le salon` reste secondaire.
2. **Choix du mode** — le streamer choisit un test rapide avec trois participants système ou une répétition avec ses vrais joueurs.
3. **Scène, caméra inactive** — l’habillage public est déjà vérifiable ; la caméra est proposée, jamais imposée.
4. **Discussion** — la scène affiche le vrai état de jeu, le duo anonyme et la synchronisation avec la régie. La vidéo reste le contenu principal.
5. **Vote** — l’habillage se transforme temporairement pour vérifier une phase dynamique.
6. **Fin** — une synthèse courte confirme les points testés et ramène à la partie originale, intacte.

## Branche avec de vrais joueurs

Le choix `Avec mes joueurs` réutilise le lobby déjà approuvé : code, lien et QR si disponibles dans le produit. Aucun nouveau lobby n’est conçu ici. Les compagnons joueur existants rejoignent une session de répétition et utilisent les mêmes projections et permissions que lors d’une vraie partie.

## Branche caméra indisponible

Le refus ou l’absence de caméra ne bloque pas la répétition. Le streamer peut réessayer ou continuer avec l’habillage seul. Aucune alerte anxiogène ni détail d’implémentation navigateur n’est exposé.

## Twitch

Les écrans Twitch ne sont pas une étape obligatoire du parcours de répétition. Ils appartiennent à l’onboarding streamer et restent accessibles depuis la diffusion. La répétition locale fonctionne explicitement sans compte Twitch connecté.

## Les quatre contextes à ne jamais confondre

| Contexte                         | Utilisateur                 | Objet                                                | Surface produit                       |
| -------------------------------- | --------------------------- | ---------------------------------------------------- | ------------------------------------- |
| Configuration Twitch développeur | Équipe produit              | Héberger et déclarer l’extension                     | Hors interface streamer               |
| Onboarding Twitch streamer       | Streamer                    | Relier sa chaîne à son espace                        | État connecté/déconnecté simple       |
| Répétition avant direct          | Streamer et joueurs invités | Vérifier une vraie émission sans consommer la partie | Partie → mode → scène → synthèse      |
| Diffusion en direct              | Streamer, joueurs, public   | Jouer la vraie partie et produire le live            | Parcours GM/Player/Broadcast existant |

## Règle de fin

La répétition ne propose jamais un faux bouton `Lancer le direct`. Elle se termine par `Retour à ma partie` ou par l’ouverture du salon existant lorsque le streamer décidera réellement de jouer.
