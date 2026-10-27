# Accueil — Proposition 02 jeu vidéo affinée

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 7117487747163082855
Screen ID: 70b5e989c97d4b9fa64f3add659e116b
Screen title: Accueil — Proposition 02 jeu vidéo affinée
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Permettre, depuis `/`, de préparer Undercover, de reprendre la dernière partie GM
accessible dans cet onglet, ou d’accéder au parcours d’invitation. Garder les
informations du jeu et l’apparence accessibles, et présenter les deux autres jeux
comme à venir. L’accueil ne crée ni ne démarre lui-même une partie.

Audit fonctionnel du code au commit `1f7607c`. La capture et l’HTML approuvés sont
des références visuelles ; leurs boutons ne constituent pas une implémentation des
interactions décrites ci-dessous. Aucune interface n’est modifiée par cette SPEC.

## Existing behaviour to preserve

### Actions et destinations réelles

| Élément de la cible Stitch       | Fonction existante et destination                                                                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Préparer une partie              | Correspond au lien actuel « Jouer à Undercover » : `/play/undercover`. Ouvre la configuration ; aucun POST, participant ou distribution de mots n’est déclenché depuis l’accueil.                                            |
| Découvrir le jeu                 | Déplie actuellement le concept du catalogue dans un `details`, avec la mention « Format de démonstration jouable » et l’explication que les règles et le rythme sont encore affinés. Ce n’est pas une route de fiche de jeu. |
| Retrouver ma partie              | La seule reprise automatique existante est « Reprendre ma partie », conditionnelle et authentifiée, détaillée plus bas. Elle ouvre `/play/lab/<id>` pour un laboratoire local de mode `quick`, sinon `/sessions/<id>/gm`.    |
| Vous êtes invité ? / Rejoindre   | L’accueil actuel fournit un lien vers `/join`, sans champ intégré. Le parcours existant accepte un code ou un lien, puis ouvre `/join/<code>` ; il ne rejoint pas immédiatement la partie.                                   |
| Apparence                        | Ouvre le choix du thème privé de l’application, sans requête serveur ni changement du thème OBS.                                                                                                                             |
| Identité Extension Twitch        | Le logo actuel est un lien vers `/`. Revenir à l’accueil n’arrête pas la partie.                                                                                                                                             |
| Choisir un jeu, absent de Stitch | L’en-tête actuel donne accès à `/play`. Son emplacement futur n’est pas défini par la maquette ; la route et cette possibilité de navigation existent.                                                                       |
| Enchères / Qui est l’espion ?    | Informations « À venir · NON JOUABLE », sans lien, bouton de lancement, inscription ou date annoncée.                                                                                                                        |

### Reprise : données, conditions et états

`ResumeSession` lit `sessionStorage["xt:recent-gm-session"]`, valide le format UUID,
puis cherche l’accès `xt:access:<id>:gm` dans le même stockage d’onglet. La référence
récente est renseignée par l’enregistrement du laboratoire ou par la réception d’une
projection GM dans une régie. Ce n’est ni un historique ni une liste de sessions du compte.

Avec ces éléments seulement, il demande `GET /api/server/sessions/<id>/private`, avec
l’accès privé dans l’en-tête Authorization, `cache: no-store` et annulation au démontage.
Le backend vérifie l’accès ; le frontend exige ensuite une réponse conforme à
`gmSessionSchema`. Le nom affiché vient de `response.title`, pas d’un titre fictif local.

| État constaté                                                                         | Comportement actuel                                                                                                                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Premier affichage / vérification en cours                                             | Aucune carte de reprise ni indicateur de chargement dédié. Undercover et les autres actions restent disponibles.                                                                   |
| Aucun ID, ID invalide ou accès GM absent                                              | Aucune reprise affichée ; pas de requête privée si les prérequis locaux manquent.                                                                                                  |
| Réponse GM valide sans `publicGame.play.outcome`                                      | Affiche le titre et le lien de reprise. Cela inclut un salon, une préparation ou une partie en cours ; le libellé « en cours » ne prouve pas que les mots ont déjà été distribués. |
| Résultat final présent dans `publicGame.play.outcome`                                 | Pas de reprise depuis l’accueil. La partie n’est pas supprimée ; son lien privé reste la voie d’accès au résultat et au rejeu.                                                     |
| Accès refusé, session introuvable, erreur réseau, JSON invalide ou stockage illisible | Pas de carte de reprise, sans message d’erreur dédié sur l’accueil. Les autres actions restent utilisables ; aucune recherche ou récupération de compte n’est tentée.              |

Le choix laboratoire/régie dépend de `readLab(id)?.mode === "quick"`, pas du jeu
seulement ni d’un rôle choisi dans la maquette. Un enregistrement de laboratoire
local corrompu peut aussi empêcher l’affichage de la reprise, même après une réponse
GM valide : c’est une limite observée du code, pas une règle produit à inventer.

La carte de reprise apparaît avant le catalogue et prend la priorité visuelle :
« Reprendre ma partie » devient l’action principale ; le lien Undercover reste
disponible en secondaire. La vérification n’a lieu qu’au montage de l’accueil,
sans SSE, polling ni rafraîchissement automatique interonglets. Ouvrir le lien
retrouve ensuite le véritable état serveur dans l’interface de destination.

Sur un autre appareil, une autre origine ou sans le stockage de cet onglet, le seul
secours actuellement expliqué est d’ouvrir le lien privé GM ou joueur conservé par
l’utilisateur. Ni le code d’invitation ni l’ID de session ne remplacent un accès GM.
Aucun compte, recherche par nom, récupération par e-mail ou liste de parties n’existe.

### Invitation : interaction existante à réutiliser

Sur `/join`, « Code ou lien d’invitation » est un champ requis. La soumission retire
les espaces extérieurs ; pour un lien contenant `://`, elle extrait le dernier
segment du chemin avec `new URL`. Le code doit correspondre à `[A-Za-z0-9_-]{12}`,
sans conversion en majuscules ni réécriture de l’identité.

- Format invalide : message « Collez le code complet ou le lien d’invitation fourni
  par le GM. » et aucune requête au serveur. Un champ vide bénéficie de la validation
  HTML requise.
- Format valide : navigation vers `/join/<code>`, où le joueur saisit son nom.
  Aucune vérification d’existence de l’invitation n’est effectuée lors de la seule
  ouverture de ce formulaire.
- L’inscription effective passe ensuite par le POST normal
  `/api/server/invitations/<code>/join`. Le serveur contrôle notamment l’invitation,
  l’admission et les noms ; il peut refuser une invitation inconnue/renouvelée,
  des admissions fermées, un nom déjà utilisé ou un salon plein.
- Ce parcours crée une identité de joueur dans l’onglet, avec reçu de demande et
  reprise après réponse incertaine. Il n’accorde pas de permission GM. Ces mécanismes
  appartiennent aux écrans suivants et restent inchangés.

Le champ intégré de Stitch est donc une différence de présentation à traiter plus
tard avec ce même parcours, sans inventer un autre endpoint ou un accès direct au jeu.
Les liens relatifs conservent l’origine réseau utilisée, sans localhost imposé aux invités.

### Apparence et origine des informations

- Le titre, la description, le concept, les disponibilités et les noms des jeux
  viennent du catalogue officiel importé (`officialGames`). Le texte « 3–12 joueurs ·
  indices oraux · votes · plateau OBS » est actuellement statique dans la carte :
  il ne représente pas le nombre de joueurs d’une partie retrouvée.
- L’accueil ne consulte pas l’endpoint catalogue et ne s’abonne à aucun flux de jeu.
  La requête privée facultative de reprise est son seul chargement de session.
  Elle ne doit pas alimenter un rendu public à partir de données GM.
- L’apparence propose Broadcast Studio, Neon Show et On Air Premium. Le défaut est
  Broadcast Studio. La préférence `localStorage["xt:theme:application"]` appartient
  au navigateur et à l’origine, sans synchronisation entre appareils.
- Le choix est chargé après montage ; le sélecteur reste désactivé jusqu’à cette
  initialisation. Valeur absente ou invalide : défaut. Les événements `storage` sur
  cette clé mettent à jour les autres onglets de la même origine.
- Si le stockage est bloqué, le thème peut encore changer dans l’onglet et un
  message explique que la préférence ne peut pas être conservée. Échap ferme le
  panneau et replace le focus sur son déclencheur.
- Le thème de l’émission est un choix distinct de la préparation, figé dans la
  session. Changer l’apparence ne modifie ni cet état serveur ni le rendu OBS.

### Maquette visible, écarts et contraintes d’intégration

La référence desktop montre Undercover et son illustration en zone dominante, les
badges 3–12 joueurs / Compatible OBS / En vedette, puis deux panneaux latéraux pour
la reprise et l’invitation. Apparence est dans l’en-tête ; les jeux à venir sont
séparés en bas. Ces blocs n’ajoutent aucun droit ni donnée dynamique.

Points non résolus par le design et à traiter explicitement avant le code :

1. **Retrouver sans accès** : le bouton toujours présent de Stitch n’a pas de
   destination fonctionnelle existante dans ce cas. L’aide aux liens privés existe,
   pas un service de recherche. L’état sans reprise doit être adapté sans faux CTA.
2. **Reprise disponible** : son titre réel et sa priorité actuelle ne figurent pas
   dans la référence statique ; ne pas laisser deux actions concurrentes de même priorité.
3. **Découvrir / Apparence** : Stitch montre les déclencheurs, pas leurs contenus
   ouverts. Conserver les informations et options réellement disponibles ; aucun
   nouvel écran, tutoriel interactif ou réglage OBS n’est déduit de ces boutons.
4. **Palette et thèmes** : une seule palette indigo/lilas/citron est représentée.
   Son articulation avec les trois préférences existantes n’est pas définie par
   ces exports ; ne pas ajouter un quatrième thème, écraser une préférence ou
   recolorer l’émission par déduction.
5. **Catalogue et statut démo** : le lien actuel `/play` et la qualification de
   démonstration ne sont pas explicités dans Stitch. Leur restitution doit être
   décidée sans annoncer des jeux terminés ou retirer silencieusement un accès.

Les comportements sont communs au mobile. Aujourd’hui, le bureau adapte seulement
la mise en page : carte en grille et panneau Apparence ancré sous son déclencheur.
Il n’existe aucun mode fonctionnel desktop distinct ni popup applicative native à
ajouter. Conserver les liens réels, le clavier, les libellés accessibles et les états
d’erreur. Les médias/polices/CDN et le `onsubmit` neutralisé de l’export ne remplacent
pas les composants, la navigation ou les services existants.

### Sources vérifiées

- [`Welcome`, accueil actuel](../../../../apps/web/src/components/welcome.tsx),
  [`ProductFrame`, en-tête](../../../../apps/web/src/components/product-frame.tsx),
  [`OfficialCatalog`, informations et détails](../../../../apps/web/src/components/official-catalog.tsx).
- [`ResumeSession`](../../../../apps/web/src/components/resume-session.tsx),
  [`creator-lab`, stockage local](../../../../apps/web/src/lib/creator-lab.ts),
  [`useSession`, accès et référence récente](../../../../apps/web/src/lib/use-session.ts).
- [`SessionEntry`, invitation](../../../../apps/web/src/components/session-entry.tsx),
  [`contrats de session`](../../../../packages/contracts/src/sessions.ts),
  [`SessionApi`, contrôles serveur](../../../../apps/server/src/session-api.ts).
- [`ApplicationTheme`](../../../../apps/web/src/components/application-theme.tsx),
  [`catalogue officiel`](../../../../packages/contracts/src/official-games.ts),
  [`thèmes officiels`](../../../../packages/contracts/src/themes.ts).

## Notes

Design explicitement validé avant implémentation.
