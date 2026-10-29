# Undercover A/B — reprise Codex Cloud

**APPROVED : 28 références finales.** L’utilisateur a explicitement approuvé les deux chantiers. La validation humaine est acquise. Cet export fournit les références dans Git ; aucune connexion Stitch, CLI authentifiée, chemin Mac ou nouvelle validation visuelle n’est nécessaire pour commencer l’intégration.

## Lire en premier

1. [Registre humain exact](APPROVAL.json) et [index des 28 références](manifest.json).
2. [Livraison A](../undercover-stream-set/DELIVERY.md), [manifest A](../undercover-stream-set/manifest.json), [décisions A](../undercover-stream-set/DECISIONS.md).
3. [Livraison B](../undercover-tv-broadcast/DELIVERY.md), [manifest B](../undercover-tv-broadcast/manifest.json), [brief B](../undercover-tv-broadcast/BRIEF.md).
4. [Raccordements](RACCORDEMENTS.md) et les 28 SPEC.md désignées par les manifestes.

Les chemins des manifestes sont relatifs à leur propre dossier. Les HTML sont des références statiques non fiables, pas du code applicatif à importer. Les images et polices utiles sont embarquées dans les HTML : aucune dépendance réseau n’est nécessaire pour comprendre ces maquettes. Les licences de polices locales restent celles du dépôt.

## Source et fidélité

Base applicative : `5a7a2f233f6bd10de28f66ace4b155ab8647f5db`.

Les 28 PNG natifs exportés et les HTML disponibles ont été copiés sans réécriture. Les SHA-256, tailles et types d’artefacts figurent dans les manifestes. Seuls documents et métadonnées ont été adaptés pour être portables. Les générations remplacées et photos utilisateur ne sont pas incluses. Les titres PROPOSAL des ressources n’annulent pas le registre humain APPROVED.

A : six ressources mobiles Stitch sont des images complètes à 390 px. Leur HTML responsive de maquette est fourni séparément sous `responsive/approved.html`, avec les véritables captures du bouton fixé en bas du viewport. Ne pas inventer un HTML natif exporté pour ces six ressources image.

B : les quatorze contextes vidéo et deux overlays seuls sont distincts. Le PNG natif Stitch est RGB aplati ; `alpha.png` fournit une preuve RGBA 1920 × 1080 réellement transparente. L’HTML `overlay/approved.html` des états de contexte fournit leur rendu sans studio. Le décor et les images de référence sont uniquement du matériau de maquette, jamais un fond OBS ou des assets applicatifs à importer automatiquement.

## Portée fonctionnelle à reprendre

Undercover uniquement. Les séries persistantes, la réutilisation par copie, les deux contenus avec images locales facultatives et les projections publiques Duo anonyme/Affectations visibles sont de nouvelles capacités à implémenter. Ce ne sont pas des fonctions déjà livrées par cet export. Préserver les règles, permissions, commandes, reçus et SSE existants.

Les images permanentes restent sur l’appareil de préparation. Leur absence conserve les textes et ne bloque pas le salon. Le relais temporaire nécessaire aux vrais joueurs et au broadcast doit être conçu avec autorisations et expiration, sans hébergement cloud permanent ni jargon dans la préparation. Ne pas ajouter d’authentification de compte ou synchronisation de bibliothèque inventée.

Ouvrir la série ouvre son salon sans distribuer. Partie suivante : confirmation GM ; Rejouer : même préparation sans avancer ; Retour à la série : conducteur conservé. Une seule partie active ; pas d’enchaînement automatique implicite ni de réinitialisation silencieuse des accès.

Le duo anonyme ne reçoit aucun mapping joueur→contenu ou rôle secret, y compris dans les payloads HTTP/SSE. Les affectations visibles constituent une projection publique distincte explicitement choisie. Les prochaines préparations restent privées. Vote, élimination et révélation finale respectent les autorisations du moteur.

La vidéo est prioritaire : capsules supérieures et moments bas temporaires, centre et visages dégagés. De quatre à douze joueurs : groupes de trois et focus actif, numéros stables et noms longs lisibles. Conserver les sept blocs, quatre layouts, déplacement/redimensionnement, renderer commun aperçu/OBS et indépendance des thèmes publics. Adapter les anciens minima sans écraser les dispositions personnalisées.

## Contrôles attendus après intégration

Vérifier persistance et copies indépendantes ; images absentes et permissions/expiration du relais ; absence de secrets dans les projections publiques ; transitions préparation/salon/distribution/suivante/rejeu ; compatibilité des anciennes parties/layouts. Exécuter les vérifications pertinentes du dépôt et comparer des captures réelles desktop/mobile/OBS aux références, notamment douze joueurs et noms longs.

Cet export ne modifie aucune interface, règle ou fonctionnalité ; aucune fusion ni aucun déploiement. Les rapports de contrôle antérieurs portant AWAITING_APPROVAL sont historiques et sont supplantés par l’accord humain explicite. Aucun essai OBS physique ou iPhone n’est revendiqué.
