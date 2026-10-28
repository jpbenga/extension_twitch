# AFTER — Prepare Undercover — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 7117487747163082855
Screen ID: 12712e36e77f4c33850ed5b07962942d
Screen title: AFTER — Prepare Undercover — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Comprendre « quelle partie Undercover vais-je préparer ? » et rejoindre le salon
par **Préparer la partie**, sans création automatique de participants ni distribution.
Classique est le seul format du jeu ; quick/invite sont des parcours techniques,
pas deux modes de règles. La préparation ordinaire suit le parcours d’invitation.
Le laboratoire, secondaire et explicitement nommé, garde les essais à identités réelles.

## Existing behaviour to preserve

- Source : `official-game-setup.tsx`, `contracts/official-games.ts`,
  `server/official-games.ts`, `session-service.ts` et `lib/creator-lab.ts`.
- `UndercoverSettings` validé client et serveur : 1–5 Undercover (défaut 1), mots
  distincts après normalisation, 1–80 caractères (Phare / Fusée par défaut), 1–5 tours
  d’indices (défaut **2**), 1–30 manches (défaut 10). Aucun nouveau rôle ni règle.
- Effectif prévu local de 3 à 12, défaut 4. Le serveur ne reçoit pas ce nombre dans
  `officialSessionSchema` : il ne devient ni capacité fixe ni obligation d’effectif.
  Les invitations restent ouvertes ; l’effectif réel est vérifié au salon, notamment
  sa majorité civile (`2 × Undercover + 1` au minimum).
- POST `/official-games/undercover/sessions` avec le même requestId, accès GM, settings,
  thème public et layout lors d’une reprise incertaine. Le serveur choisit la définition
  officielle, crée le salon et fige ses réglages ; aucune définition arbitraire envoyée.
- Le parcours invite conserve zéro joueur et mène à `/sessions/<id>/gm` (salon).
  La préparation de l’effectif ferme les inscriptions au salon ; la distribution des
  mots reste une commande GM suivante, distincte.
- Le parcours quick conserve `prepareLab`, ses participants, accès indépendants,
  commandes persistées et reprise, puis `/play/lab/<id>`. Il ne distribue pas les mots
  automatiquement. Aucun accès QA n’apparaît chez les invités ordinaires.
- Préférences et réglages de cet onglet : `xt:official:undercover:preferences`,
  `xt:official:undercover:settings`, `:broadcast-theme`, `:layout`. Aucun compte ni
  synchronisation de préférences entre appareils promis.
- Reçu incertain `xt:official:pending` prioritaire sur les préférences : conserver
  exactement requestId, token, settings, count, mode, thème et layout. Un changement
  incompatible restaure la tentative précédente, sans écrasement silencieux.
  Un refus définitif HTTP < 500 permet correction ; réseau / 5xx conserve la demande.
- Conserver `saveLab`, le lien privé GM et la reprise récente. Une interruption de
  préparation des joueurs ou d’installation est reprise dans le véritable laboratoire.
- Réutiliser `UndercoverLayoutEditor` / aperçu public B6 (7 blocs, 4 dispositions).
  Les noms de préparation sont illustratifs, sans créer de joueurs. Le thème d’émission
  appartient à la session et reste indépendant de l’apparence privée du navigateur.

## Interactions

- Retour « Tous les jeux » vers `/play` ; marque vers `/` ; Apparence utilise le
  contrôle partagé existant et ne modifie pas la diffusion.
- Participants : diminuer / augmenter bornés, saisie clavier accessible ; mettre
  immédiatement à jour le résumé. Le nombre reste modifiable jusqu’à 12.
- Tours : sélection accessible de 1 à 5, mémorisée dans les véritables settings ;
  conserver 2 par défaut. Le résumé reflète le choix, sans texte de règle fictif.
- Disclosures fermés : Rôles et distribution (nombre d’Undercover, majorité, limite
  de manches et rappel réel des règles), Mots (deux champs privés), Plateau de diffusion
  (thème et layout B6). Les fermetures ne suppriment aucune valeur.
- Action dominante : valider puis préparer le salon avec ses réglages. La disponibilité
  réelle du salon, les joueurs prêts et leurs accès ne sont pas inventés ici.
- Accès secondaire « Tester avec le laboratoire » : régler le nombre de démonstration
  et lancer l’essai réel. Aucun sélecteur quick/invite présenté comme mode Classique.

## States and constraints

- Chargement du stockage : commandes de préparation indisponibles jusqu’à restauration.
  Pendant la requête : libellé de préparation, commandes de configuration verrouillées
  et garde de double soumission ; aucune latence décorative.
- Validation : conserver les valeurs éditées, afficher une erreur compréhensible et
  rendre les options concernées accessibles. Une répartition incompatible avec l’effectif
  de démonstration est refusée ; l’invitation conserve le contrôle de l’effectif réel.
- Stockage indisponible : message explicite, pas de requête créée sans reçu conservé.
  Erreur réseau / 5xx : réessai avec la même identité de commande après rechargement.
- Demande incertaine : indiquer sa reprise et son parcours, ne pas créer une seconde
  partie ni modifier le payload déjà transmis.
- Desktop : contrôles à gauche, résumé et CTA à droite ; mobile : colonne unique,
  résumé et action au bas de l’écran, safe areas et réserve de contenu adaptées.
- Cibles ≥ 44 px, saisies mobiles ≥ 16 px, pas de débordement horizontal à 390 px
  (ni largeur fixe imposée), zoom utilisateur permis, focus visible et clavier utilisable.
  Les réglages ouverts et erreurs restent accessibles au-dessus de la barre d’action.
- Les palettes viennent du DESIGN.md / tokens existants. Les exports HTML sont des
  références visuelles, pas une application à copier. Aucun CDN ni script Stitch repris.

## Implementation notes

La validation humaine de ces deux captures est acquise. Les placeholders fonctionnels
ne constituent pas un blocage. Les adaptations nécessaires sont le vrai accès au
laboratoire, les réglages réels, les erreurs et la reprise, absents de la maquette.
Aucun écran suivant, aucune nouvelle règle, aucun nouveau contrat serveur requis.
