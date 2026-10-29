# Undercover — raccordement préparation / séries / Broadcast

**APPROVED · humanApproved: true.** Ce document transmet les décisions déjà validées ; il ne conçoit aucune nouvelle interface ou règle. [Accord global](undercover-next/ALL-APPROVAL.json) · [28 références exactes](undercover-next/APPROVED-REFERENCES.json).

## Trois lots, une validation existante

| Lot                                                              | Références uniques | Projet Stitch        | Périmètre                                                            |
| ---------------------------------------------------------------- | -----------------: | -------------------- | -------------------------------------------------------------------- |
| [Undercover Next](undercover-next/manifest.json)                 |                  6 | 6522040318627629456  | A1, A2, A5 desktop/mobile : préparation, contenus A/B et médias      |
| [Undercover Stream Set](undercover-stream-set/manifest.json)     |                  6 | 6522040318627629456  | A3, A4, A6 desktop/mobile : conducteur, réutilisation et série prête |
| [Undercover TV Broadcast](undercover-tv-broadcast/manifest.json) |                 16 | 17376000961075708568 | B1–B14 et deux overlays seuls                                        |

## Bloc 2 : préparation et médias

A1 prolonge la préparation intégrée : participants prévus 3–12, tours d’indices 1–5 avec 2 par défaut, Classique, accès secondaires et action dominante. Le nombre prévu ne fixe pas une capacité du salon. A2 édite indépendamment les noms et images facultatives des contenus A/B. A5 conserve les textes/réglages et propose de reconnecter une image sans bloquer la préparation.

Les médias permanents restent sur l’appareil/navigateur de préparation. Seule la règle produit « Préparez et lancez cette série depuis le même appareil pour conserver vos images » est exposée discrètement. Aucun jargon OPFS, identifiant, chemin, cache ou relais dans la préparation.

## Sets et raccordements Bloc 5

A3 organise les préparations : ajouter, ordonner, modifier, dupliquer, retirer, réutiliser. Monter/Descendre reste une alternative au glisser, avec bornes désactivées. A4 crée une copie modifiable d’une paire passée et préserve l’original. A6 distingue préparation prête et disponibilité facultative d’images, puis ouvre le salon sans distribution implicite.

Raccordements attendus avec la régie existante : Partie suivante sélectionne la prochaine préparation après confirmation GM ; Rejouer garde la préparation courante sans avancer ; Retour à la série conserve le conducteur. Une seule partie reste active. Pas d’enchaînement automatique par défaut ni de réinitialisation implicite révoquant les accès joueurs. Le Bloc 5 complet n’est pas redessiné.

## Bloc 6 : nouvelle direction OBS

B1–B10 couvrent attente, discussion, duo, affectations, vote, élimination, égalité, révélation finale, victoire et transition. B11–B13 montrent douze joueurs/noms longs, focus actif et groupes de trois sur quatre pages. B14 montre un contenu sans image. Deux ressources supplémentaires isolent les overlays duo/affectations sans décor.

La vidéo est le contenu principal : centre et visages dégagés, capsules supérieures, cartes et moments bas temporaires. Cette direction remplace la hiérarchie massive des anciens presets, en préservant sept blocs configurables, quatre layouts, déplacement/redimensionnement, renderer commun aperçu/OBS et thèmes publics indépendants. Les anciennes dispositions personnalisées ne doivent pas être écrasées silencieusement.

**Duo anonyme :** noms et images des deux contenus publics, aucune relation joueur→contenu ni rôle secret envoyé au renderer, HTTP/SSE, DOM, attributs ou scripts. **Affectations visibles :** projection publique dédiée contenant les associations volontairement publiées après choix explicite du GM. Le vote ne dévoile pas les choix individuels privés ; élimination et révélation finale suivent les autorisations du moteur. Les préparations futures restent privées.

## UX et mécaniques à implémenter

Les hiérarchies, palette/polices, responsive, boutons dominants, disclosures, états d’image manquante et habillage temporaire sont les décisions UX transmises. Les HTML sont des maquettes statiques, pas des implémentations.

Les séries persistantes, copies/réutilisation, ordre et reprises exigent une mécanique de données réelle. Le choix/remplacement/retrait des images et leur disponibilité exigent un stockage local adapté. Leur transmission aux vrais joueurs et au broadcast nécessite un relais temporaire autorisé, à durée bornée et nettoyé, sans hébergement cloud permanent. Aucun protocole, TTL ou prestataire nouveau n’est fixé par les maquettes.

Les deux projections publiques, permissions, commandes et transitions restent sous autorité serveur. La sélection de la préparation active et les raccordements B5 doivent préserver les reçus, SSE et accès existants. Les effets temporaires ne doivent pas être rejoués après reconnexion. La géométrie des nouveaux presets demandera une adaptation compatible avec les layouts conservés.

## Lecture sans Stitch

Chaque manifeste fournit IDs, rôles, fichiers, SHA-256 et SPEC. Vingt-huit PNG natifs sont versionnés, ainsi que 22 HTML natifs disponibles et 12 HTML responsive de maquette. Les six ressources mobiles sont des captures complètes à 390 px ; les preuves de viewport montrent séparément le CTA fixé en bas. Quatorze PNG RGBA 1920×1080 prouvent le fond transparent ; les PNG natifs Stitch sont aplatis et les photos studio sont du contexte, jamais un fond OBS applicatif.

Les références sont désormais accessibles dans Git sans authentification Stitch ni chemin Mac. Aucun nouveau test physique OBS/iPhone, aucune interface intégrée, aucune fusion ou aucun déploiement ne sont revendiqués par cet export.
