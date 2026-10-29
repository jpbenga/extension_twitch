> Statut courant : **APPROVED** pour les seuls 28 IDs du registre [APPROVAL.json](ALL-APPROVAL.json). Les mentions AWAITING_APPROVAL dans le corps décrivent l’état historique avant l’accord humain. Cet export documentaire ne lance aucune intégration.

# Relecture indépendante — chantiers Undercover A et B

## 1. Disposition

**SHIP des maquettes pour examen humain. Statut : AWAITING_APPROVAL.** Les corrections matérielles identifiées ont été confirmées lors d'une vérification ciblée unique. Aucun rebuild nécessaire. Ce verdict technique ne constitue pas une approbation UX humaine et n'autorise aucune intégration dans l'application.

## 2. Preuves inspectées

- Canon `docs/ux/redesign/DESIGN.md`, brief B, manifest B et craft floor Impeccable ; les deux photos TV fournies par l'utilisateur.
- A : uniquement `design/undercover-stream-set/refined/`, A1–A6 desktop à 1440 px, six captures mobiles complètes à 390 px et six captures mobiles en bas du document ; CSS et DOM correspondants. Confirmation ciblée A3 desktop/mobile après correction.
- B : galerie B1–B14, quatorze réductions Twitch à 390 px, B3 alpha et B8 contexte natifs, HTML des projections anonymes et des états vote/résolution. Confirmation ciblée finale B1, B8, B11 et galerie.
- Vérification indépendante des quatorze PNG alpha : RGBA 1920 × 1080, pixel central entièrement transparent sur chaque écran. Les captures contrôlées après correction B1/B8/B11 conservent ce format et cet alpha central nul.

## 3. Écarts matériels avec priorité

**Aucun P0/P1 et aucun écart matériel ouvert après confirmation.** Les écarts P2 initiaux étaient les commandes d'ordre actives aux bornes dans A3, le bandeau inférieur superflu de B1, les camps trop petits dans B8 à 390 px, ainsi que des preuves initiales antérieures aux corrections du masque et du texte B11.

Les essentiels sont lisibles dans les preuves finales ; la vidéo demeure dominante et les visages restent dégagés. Les numéros stables distinguent les joueurs dont les noms longs sont abrégés. Le duo anonyme B3/B14 ne contient aucune relation joueur–contenu dans le DOM ou les attributs examinés. B5 expose la participation seule ; B6 expose uniquement le camp déjà révélé. Les affectations publiques et la révélation finale disposent de vues séparées.

## 4. Corrections concrètes confirmées

- A3 : `disabled` sur « Monter la partie 1 » et « Descendre la partie 4 », sur les deux formats ; les déplacements intermédiaires restent disponibles. Apparence désactivée confirmée dans les captures.
- B1 : suppression du bandeau inférieur d'attente ; capsule supérieure conservée.
- B8 : camps portés à 56 px natifs, lisibles dans la réduction à 390 px, sans collision avec les noms et les mots.
- B11 : « Au tour de » et masque SVG présents dans les preuves finales ; galerie actualisée.

La préparation A conserve une action principale accessible en bas sur mobile, des boutons de 48 px et des champs d'au moins 16 px. L'image absente ne bloque pas les textes ni l'ouverture du salon. La réutilisation annonce une copie modifiable et préserve l'original. A6 distingue l'ouverture du salon de la distribution ultérieure.

## 5. Limites

Relecture de maquettes statiques : aucune application, API, autorité serveur, synchronisation d'images ou transition réelle n'a été testée. Les actions de formulaire, l'ordonnancement et le clavier ne sont pas validés comme fonctionnalités exécutables. Aucun essai OBS physique ni essai sur téléphone réel. Les captures mobiles entières facilitent la lecture ; les vues de viewport constituent la preuve de la commande fixée en bas. Les sept blocs configurables, les quatre layouts et le moteur commun futur restent des capacités documentées, pas des fonctionnalités démontrées. Tous les nouveaux écrans attendent la décision humaine : **AWAITING_APPROVAL**.
