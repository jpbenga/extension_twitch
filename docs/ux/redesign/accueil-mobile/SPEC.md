# Accueil — Proposition 02 jeu vidéo mobile · accents corrigés

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 7117487747163082855
Screen ID: 15989136117558531304
Screen title: Accueil — Proposition 02 jeu vidéo mobile · accents corrigés
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Sur smartphone, donner accès à la préparation d’Undercover et, lorsqu’elle est
réellement disponible, à la reprise de la dernière partie GM de cet onglet. Garder
le parcours d’invitation, les informations du jeu et l’apparence utilisables au
toucher. Les jeux à venir restent informatifs, sans lancement.

Audit du code au commit `1f7607c`. Il s’agit de la même page `/` et des mêmes données
que sur ordinateur ; aucune logique de partie ni permission mobile particulière
n’existe. La référence corrigée fixe la présentation, pas des interactions simulées.

## Existing behaviour to preserve

### Actions et destinations réelles

| Élément de la cible mobile    | Comportement existant à conserver                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Préparer une partie           | Lien actuel « Jouer à Undercover » vers `/play/undercover`. Ouvre les réglages ; ne crée ni ne démarre la partie depuis l’accueil.                                                                        |
| Découvrir le jeu              | Déplie le concept et la qualification de démonstration jouable du catalogue officiel. Pas de nouvelle page de jeu ou d’action moteur.                                                                     |
| Retrouver                     | Reprise authentifiée conditionnelle : `/play/lab/<id>` si l’enregistrement local est de mode `quick`, sinon `/sessions/<id>/gm`. La maquette ne suffit pas à rendre ce bouton opérationnel sans accès.    |
| Code d’invitation / Rejoindre | Actuellement, l’accueil conduit à `/join`. La saisie et la validation sont sur cette page, puis conduisent à `/join/<code>` pour choisir son nom. Le champ intégré de Stitch n’est pas encore implémenté. |
| Apparence                     | Ouvre le choix privé Broadcast Studio / Neon Show / On Air Premium, sans changer l’émission.                                                                                                              |
| Identité Extension Twitch     | Le logo actuel est un lien vers `/`, même si l’HTML mobile le dessine comme du texte. Revenir à l’accueil n’arrête pas une partie.                                                                        |
| Choisir un jeu                | L’en-tête actuel propose `/play`. La référence mobile n’affiche pas ce lien ; son emplacement éventuel reste à arbitrer avant intégration.                                                                |
| Enchères / Qui est l’espion ? | Noms du catalogue et statut « À venir · NON JOUABLE ». Pas de lien, d’inscription ou de CTA de lancement.                                                                                                 |

### Reprise, erreurs et changement d’appareil

La reprise exige successivement une référence UUID dans
`sessionStorage["xt:recent-gm-session"]`, un accès `xt:access:<id>:gm`, puis une
réponse valide de `GET /api/server/sessions/<id>/private` vérifiée comme projection
GM. L’accès est envoyé en en-tête Authorization, jamais remplacé par un code joueur.
Le titre affiché vient du serveur. Le stockage du laboratoire détermine seulement
la destination laboratoire/régie ; il ne prouve pas les droits.

- Au chargement, le lien de reprise est absent. Il n’existe pas d’indicateur de
  recherche dédié ; préparer le jeu et rejoindre restent disponibles.
- Un salon ou une partie sans `publicGame.play.outcome` peut être repris après
  validation. Une partie avec résultat final ne présente plus ce CTA, mais reste
  accessible par son lien privé pour consulter le résultat et rejouer.
- Référence absente/invalide, accès manquant/refusé, serveur inaccessible, réponse
  invalide ou stockage illisible : aucune reprise n’est affichée. Il n’y a ni
  message d’erreur dédié, ni historique, ni récupération par e-mail. Un enregistrement
  de laboratoire corrompu peut aussi masquer la reprise : limite actuelle à signaler,
  pas une règle à inventer.
- Avec reprise valide, « Reprendre ma partie » est actuellement l’action principale
  placée avant le catalogue ; la préparation reste disponible en secondaire.
  L’ordre statique de la maquette ne représente pas cet état.
- La vérification a lieu au montage, sans abonnement SSE, polling ou recherche
  entre appareils. L’interface de destination retrouve ensuite l’état serveur réel.
- Sur l’iPhone, la référence d’un onglet du Mac n’apparaît pas automatiquement.
  L’aide actuelle « Retrouver un accès sur un autre appareil » indique d’ouvrir le
  lien privé GM ou joueur conservé. Il n’existe pas d’écran de récupération par
  nom/ID, de compte utilisateur ou de connexion Twitch obligatoire.
- La navigation sur l’accueil ne supprime ni les sessions persistées, ni les accès,
  ni les réglages et reçus de préparation retenus dans l’onglet.

### Invitation : saisie et suite du parcours

Le comportement existant de `/join` accepte un code **ou un lien complet**, retire
les espaces extérieurs et, pour une URL contenant `://`, en extrait le dernier
segment du chemin. Le code est validé par `[A-Za-z0-9_-]{12}`, sans changement de
casse. Champ vide : validation HTML requise. Format invalide : message « Collez le
code complet ou le lien d’invitation fourni par le GM. », sans appel serveur.

Une valeur valide ouvre `/join/<code>`. Le joueur y choisit son nom avant que le
POST d’inscription normal vérifie l’invitation et l’admission, crée son identité
et le redirige vers sa vue privée. Une invitation renouvelée ou inconnue,
des admissions fermées, un nom pris ou un salon plein peuvent être refusés par le
serveur. L’ouverture du formulaire ne vérifie pas encore l’existence de l’invitation.
Les reçus et réessais d’inscription restent dans le parcours existant, sans accès GM.

Sur téléphone, le champ actuel désactive capitalisation, autocorrection et
vérification orthographique. L’export mobile ne définit ni formulaire réel ni
gestionnaire fonctionnel de « Rejoindre » : ne pas perdre ces comportements en le
copiant. Les destinations relatives gardent l’origine réseau courante.

### Apparence et données réellement disponibles

- Les informations d’Undercover et les noms des jeux à venir viennent du catalogue
  officiel importé. « 3–12 joueurs » décrit la capacité du jeu, pas un effectif
  détecté ; Compatible OBS ne signifie pas qu’une connexion Twitch ou OBS est active.
- L’accueil n’utilise aucun flux temps réel. Sa seule lecture facultative de session
  concerne la reprise privée GM ; ne jamais en tirer un affichage public de secrets.
- Le thème de l’application est local au navigateur et à l’origine dans
  `localStorage["xt:theme:application"]`. Défaut : Broadcast Studio, notamment si
  la valeur est absente ou invalide. Le sélecteur est désactivé avant l’initialisation
  côté client ; les autres onglets de cette origine suivent les événements `storage`
  de cette clé. Pas de synchronisation Mac/iPhone.
- Le stockage bloqué n’empêche pas le changement visuel dans l’onglet. Un message
  précise que la préférence ne peut pas être conservée. Échap ferme le panneau et
  restitue le focus au déclencheur, également utilisable au clavier externe.
- Le thème OBS appartient à la session et reste indépendant. Aucun changement
  d’apparence de l’accueil ne doit envoyer une commande de jeu ou modifier ce thème.

### Particularités mobiles, maquette et écarts

La référence montre une colonne : titre, carte Undercover, ligne compacte
« Déjà une partie ? », invitation, puis jeux à venir. Les fonctions restent les
mêmes qu’au bureau. Aujourd’hui, les CSS passent la carte sur une colonne et son
CTA en pleine largeur sous 600 px. Le panneau Apparence devient fixe avec
défilement interne et prise en compte de la safe area, alors qu’il est ancré à son
déclencheur au bureau. Aucun menu mobile ni autre destination métier n’est ajouté.

Points à traiter explicitement lors de la future intégration :

1. **Retrouver** : aucune recherche de partie n’existe sans accès GM local validé.
   Prévoir l’état correspondant à l’aide existante ; ne pas créer de faux bouton.
2. **Priorité de reprise** : nom réel, refus, attente et priorité du CTA existant
   sont absents du visuel. Ne pas réduire une reprise disponible à un bouton
   systématiquement secondaire pour suivre l’ordre d’une image statique.
3. **Invitation intégrée** : elle déplace une interaction aujourd’hui sur `/join`.
   Conserver code ou lien, validation, messages et choix du nom sur l’écran suivant ;
   pas d’inscription automatique ni de nouvelle API.
4. **Informations non ouvertes dans Stitch** : préserver le contenu « Découvrir »
   avec son statut démo, l’aide interappareils, les trois thèmes et leurs messages.
   Leur présentation ouverte et le lien catalogue ne sont pas spécifiés par l’image.
5. **Thèmes** : la palette indigo/lilas/citron ne définit pas les trois états de
   préférence existants. Aucune décision de quatrième thème ou de modification
   d’OBS ne doit être déduite de cette référence.
6. **Accessibilité existante** : le viewport applicatif permet le zoom et utilise
   `viewport-fit=cover`. Ne pas reprendre `user-scalable=no` / `maximum-scale=1`
   de l’export mobile. Garder le champ nommé, les contrôles tactiles et le focus
   visibles, le défilement et les messages d’erreur accessibles.

Le PNG exporté mesure 2560 × 1852 et contient le cadre mobile centré ; l’HTML vise
une colonne de 390 px. Les marges du canevas Stitch ne sont pas des marges à imposer
à l’iPhone. L’export et ses ressources distantes ne sont pas une application autonome.
Les cas fonctionnels, destinations et sources communs sont également détaillés dans
la [SPEC desktop](../accueil-desktop/SPEC.md#existing-behaviour-to-preserve).

### Sources vérifiées

- [`Welcome`](../../../../apps/web/src/components/welcome.tsx),
  [`OfficialCatalog`](../../../../apps/web/src/components/official-catalog.tsx),
  [`ProductFrame`](../../../../apps/web/src/components/product-frame.tsx),
  [`ResumeSession`](../../../../apps/web/src/components/resume-session.tsx).
- [`SessionEntry`](../../../../apps/web/src/components/session-entry.tsx),
  [`contrats de session`](../../../../packages/contracts/src/sessions.ts),
  [`SessionApi`](../../../../apps/server/src/session-api.ts),
  [`stockage du laboratoire`](../../../../apps/web/src/lib/creator-lab.ts).
- [`ApplicationTheme`](../../../../apps/web/src/components/application-theme.tsx),
  [`layout et viewport`](../../../../apps/web/src/app/layout.tsx),
  [`styles responsive existants`](../../../../apps/web/src/app/experience.css).

## Notes

Design explicitement validé avant implémentation.
