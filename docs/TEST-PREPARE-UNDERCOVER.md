# Tester la préparation Undercover — Bloc 2

## Ouvrir l’application

Node 24 et npm 11 sont nécessaires. Sur le Mac, si votre dépôt est toujours dans
`~/extension-twitch-studio-4b`, récupérez la branche dédiée (arrêtez d’abord le serveur
avec Ctrl+C dans son terminal) :

```sh
cd ~/extension-twitch-studio-4b
git fetch origin
git switch ux/block-2-prepare-undercover
git pull --ff-only
nvm use 24
npm ci
npm run dev:lan
```

Gardez le terminal ouvert. Sur le Mac et l’iPhone, ouvrez l’adresse réseau affichée,
puis **Undercover**. Les deux appareils doivent être sur le même Wi-Fi de confiance.
L’adresse est celle du terminal, pas nécessairement celle des guides précédents.

## Préparer pour de vrais invités

1. Sur `/play/undercover`, repérez **Participants**, **Tours d’indices** et **Classique**.
   Sans préférence mémorisée, vous voyez 4 participants prévus et **2 tours**.
2. Avec − / + ou le champ, choisissez 3 participants. Sélectionnez 2 tours.
   Le résumé change immédiatement. Il s’agit d’une prévision, pas d’une capacité de salon.
3. Ouvrez **Mots** et choisissez deux mots différents. Ouvrez **Rôles et distribution**
   pour conserver 1 Undercover et régler la limite de manches. Refermez les options :
   leurs valeurs sont conservées, y compris après un rechargement dans cet onglet.
4. Touchez **Préparer la partie**. Vous arrivez au salon **vide** : aucun joueur de
   démonstration, aucun mot distribué. Copiez l’invitation et rejoignez depuis le Mac.
5. Faites rejoindre d’autres joueurs avec leurs accès indépendants. Un quatrième
   peut rejoindre même si vous aviez prévu trois participants. Le salon contrôle
   l’effectif réel et la majorité civile avant de préparer.
6. Depuis le salon, **Préparer la partie** ferme les inscriptions et ouvre le pilotage.
   Les mots ne sont toujours pas distribués.
7. **Distribuer les mots et commencer** donne à chaque joueur son mot privé et ouvre
   les indices. Consultez chaque accès joueur séparément ; le plateau public ne doit
   jamais montrer les mots avant la révélation finale.

Pour jouer ensuite les deux tours, voter et rejouer :
[guide multi-appareils](TEST-MULTI-DEVICE-GAMES.md) et
[guide des blocs 5 à 7](TEST-APPROVED-BLOCKS-5-6-7.md).

## Tester seul, sans invités

1. Revenez à la préparation. Ouvrez **Tester avec le laboratoire**, sous les options.
2. Choisissez 3 joueurs de démonstration, puis **Lancer une partie de démonstration**.
   Le véritable laboratoire s’ouvre avec trois accès distincts ; ce n’est pas le salon
   d’invitation. La distribution demeure une commande GM.
3. Utilisez les perspectives joueurs et le lien privé GM pour l’iPhone. Chaque joueur
   ne doit voir que son mot. Le spectateur utilise sa propre projection publique.
4. Revenez à la préparation : son bouton principal ouvre toujours un salon d’invitation,
   même si vous venez d’effectuer une démonstration.

## Apparence et plateau

1. Ouvrez **Plateau de diffusion**. Changez son thème et une dimension de bloc.
   Les noms dans l’aperçu sont uniquement des exemples, aucun joueur n’est créé.
2. Changez ensuite l’**Apparence** privée dans l’en-tête. Le thème de l’émission doit
   rester celui choisi dans les options du plateau.
3. Sur téléphone, utilisez les champs de position/dimension, les listes et dispositions
   existantes. Les poignées miniatures sont remplacées par ces mêmes réglages numériques
   dans ce petit aperçu ; l’éditeur B6 de la session reste disponible sans changement.

## Erreurs et reprise

- Mettez le même mot dans les deux champs, puis préparez : un message vous demande
  de corriger ; vos réglages restent présents et aucun salon n’est créé.
- Dans le laboratoire, 2 Undercover pour 3 joueurs est refusé. Corrigez l’effectif.
  Dans le parcours invité, l’effectif réel est contrôlé au salon.
- Si la connexion est interrompue pendant une préparation, ne créez pas un nouvel essai.
  Utilisez **Reprendre la préparation**, dans le même onglet, une fois la connexion revenue.
  La même demande et son accès sont réutilisés. Si vous avez changé des réglages,
  l’écran restaure la tentative précédente et vous invite à reprendre.
- Si le stockage de l’onglet est bloqué, l’erreur reste visible. Autorisez-le avant
  de réessayer ; aucune préparation ne part sans que son accès puisse être conservé.

## À vérifier sur votre véritable iPhone

- Pas de défilement horizontal, commandes faciles à toucher et zoom permis.
- Une seule action principale citron ; les options restent repliées au départ.
- Le bas du formulaire et les erreurs restent accessibles au-dessus du bouton.
- Avec le clavier ouvert, faites défiler jusqu’au champ et vérifiez qu’il est lisible.
- Safari portrait/paysage, barres du navigateur et safe area : aucun contenu perdu.

Les contrôles Chromium automatisés ne valident pas Safari, VoiceOver ou un iPhone
physique. Le premier workflow OBS déjà observé reste acquis ; cette nouvelle
préparation attend votre vérification ergonomique sur appareil réel.
