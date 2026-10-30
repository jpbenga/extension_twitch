# Accueil — accès animateur et thème

Statut : **APPROVED**. La validation visuelle humaine est enregistrée dans `APPROVAL.json`. Ce document décrit le contrat à intégrer ; il ne constitue pas lui-même une modification applicative.

## Périmètre

Préserver identité, illustration Undercover, invitation joueur, découverte et futurs jeux non disponibles. Ajouter l’accès animateur dans l’en-tête, Mes parties préparées dans le bloc GM, contextualiser la reprise et remplacer Apparence par Thème. Espace animateur est une navigation compacte vers des destinations existantes ; aucun tableau de bord, compte, nouvelle bibliothèque cloud ou Studio de création n’est conçu.

## Destinations existantes

| Entrée                     | Destination / condition                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Préparer une partie        | `/play/undercover` ; conserver le comportement réel du conducteur et clarifier création/reprise à l’intégration                               |
| Mes parties préparées      | `/play/undercover?view=series` ; préparations de cet appareil, y compris état vide utile                                                      |
| Continuer la préparation   | Partie locale sélectionnée et vue de préparation/édition correspondant réellement à son état                                                  |
| Ouvrir le salon            | Session autorisée en attente, route GM existante                                                                                              |
| Ouvrir la régie / Ma régie | `/sessions/[id]/gm`, uniquement après validation serveur de l’accès GM                                                                        |
| Diffusion                  | `/sessions/[id]/stream` pour la session autorisée ; sinon réglages existants `/play/undercover?view=diffusion` de la préparation sélectionnée |
| Retrouver un accès         | Aide existante au lien privé, aucun nouveau mécanisme de récupération                                                                         |
| Rejoindre                  | `/join/[code]` par le parseur existant ; aucun droit GM accordé par un code joueur                                                            |

L’état du conducteur et la session courante peuvent être distincts. Ne pas relier un bouton Diffusion à une autre préparation arbitraire. La sélection et le rapprochement avec la session doivent reprendre les métadonnées existantes. Les valeurs de démonstration des maquettes ne sont pas des données de session réelles.

## Reprise contextuelle

| État réel                                      | Action dominante         |
| ---------------------------------------------- | ------------------------ |
| Aucun accès courant ni préparation à reprendre | Préparer une partie      |
| Préparation locale inachevée identifiable      | Continuer la préparation |
| Session autorisée en salon                     | Ouvrir le salon          |
| Session autorisée en jeu                       | Ouvrir la régie          |

Un seul état courant est présenté. Ne pas afficher simultanément quatre boutons de reprise. Une référence invalide/périmée ne donne pas accès à la régie. Préserver la vérification en cours, l’indisponibilité, la partie terminée et les erreurs réseau sans inventer une session active. Les préparations locales restent accessibles indépendamment d’une session expirée.

## Thème

Trois thèmes existants : Broadcast Studio, Neon Show, On Air Premium. Le défaut de l’application n’est pas modifié par la maquette Neon. Sélection visuelle nommée, sélection courante indiquée autrement que par la couleur. Choisir (même le thème courant) applique et ferme immédiatement ; pas de bouton Enregistrer. Clic extérieur/Échap ferment. Focus rendu au déclencheur, focus clavier visible. Sur mobile, feuille avec fermeture explicite et commandes44–48px ; si modale, focus contenu et arrière-plan inerte. Desktop : popover léger, pas de blocage modal inutile.

Le choix privé local ne modifie jamais le thème public de l’émission/OBS. Si la préférence ne peut pas être conservée, appliquer pour la session de navigation et conserver un retour accessible visible hors du menu fermé. Aucune nouvelle préférence serveur.

## Limites

Le prototype éventuel illustre les interactions de menu et les états avec des fixtures, sans API ni autorisation GM. La future intégration doit réutiliser les permissions, données locales et routes réelles. Les captures Stitch sont statiques ; elles ne prouvent pas à elles seules la fermeture du sélecteur ou l’accessibilité.

La validation visuelle humaine est acquise. Codex peut commencer l’intégration à partir des huit références consignées dans `manifest.json`, sans nouvelle connexion Stitch ni nouvelle approbation.
