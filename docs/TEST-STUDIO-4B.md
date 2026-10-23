# Tester le Studio Créateur visuel 4B

Validation technique terminée — Validation humaine iPhone en attente.
Les formats Chromium téléphone, tablette et ordinateur ne constituent pas une
validation physique de Safari iOS, d’OBS ou du réseau Wi-Fi de votre domicile.

## Préconditions et lancement

Node.js 24 et npm 11. Depuis le dépôt :

```sh
git fetch origin
git switch feat/creator-studio-4b
npm ci
npm run dev:lan
```

Ouvrez sur l’iPhone l’adresse privée affichée, puis `/creator`, par exemple
`http://192.168.1.20:3000/creator`. Le téléphone et l’ordinateur doivent être sur
le même Wi-Fi ; autorisez le port web 3000 dans le pare-feu local si nécessaire.
N’utilisez pas `localhost` pour inviter un autre appareil. Le port serveur 4000
reste privé. Aucun tunnel Internet n’est ouvert. Dans un cloud distant, cette
adresse privée n’est pas accessible depuis chez vous : utiliser une origine HTTPS
protégée fournie par votre hébergement, avec `PUBLIC_ORIGIN` appropriée (README),
ou lancer le dépôt sur votre ordinateur local. Ne publiez pas le serveur de
développement directement sur Internet.

Pour travailler uniquement sur cet ordinateur : `npm run dev`, puis
`http://127.0.0.1:3000/creator`.

Créer une bibliothèque privée. Conserver « Conserver mon accès créateur » : ce
lien est un secret propriétaire, distinct de l’invitation aux joueurs. Il ne s’agit
pas d’un compte avec récupération par e-mail. Plusieurs onglets peuvent être
utilisés ; chaque identité joueur est isolée par son identifiant et son jeton.

## Parcours 1 — Partir d’un jeu existant

1. Choisir « Utiliser ou personnaliser un jeu existant ».
2. « Créer une variante de Impulsion collective ». Le brouillon est indépendant ;
   « Origine et attributions » indique l’auteur et la version d’origine.
3. Dans Général, modifier le titre et éventuellement le maximum d’une contribution.
4. Dans Actions, sélectionner « Contribuer ». Modifier ses effets ou conditions à
   l’aide des formulaires. Chaque effet conserve sa position ; les boutons Monter
   et Descendre changent explicitement l’ordre.
5. Enregistrer le brouillon. La mention « Brouillon enregistré » confirme la sauvegarde.
6. Dans Tester, « Enregistrer et tester mon jeu », puis suivre la procédure d’essai
   ci-dessous. L’original du catalogue ne change pas.

Les jeux personnels publiés peuvent également servir d’origine, via leur bouton
« Créer une variante ». Les installations du catalogue sont des versions figées ;
les jeux communautaires n’ont pas encore de Store public. Les jeux installés
proposent « Créer une variante du jeu installé ».

## Parcours 2 — Assistant guidé

1. Choisir « Créer un jeu avec un guide ».
2. Étape 1 : Compteur collectif ou Réponses privées.
3. Étape 2 : pour le compteur, fixer objectif, maximum, multiplicateur et répétition.
   Pour les réponses, consulter les phases et la confidentialité du modèle.
4. Revenir à l’étape précédente puis avancer : les choix doivent être conservés.
5. Étape 3 : donner un nom, puis « Créer le brouillon guidé ».
6. Poursuivre librement dans le Studio visuel, sauvegarder et tester.

Le guide compteur produit la recette 4A. Une modification avancée non représentable
bloque explicitement le retour à cette recette, sans effacer les règles. Le modèle
Réponses privées crée une variante de la définition officielle ; les choix de
règles supplémentaires se font ensuite dans le Studio. Ni équipes, ni vote à
candidats, ni correction automatique d’un quiz ne sont simulés.

## Parcours 3 — Construire une règle sans JSON

1. Créer librement dans le Studio avancé. Le modèle minimal contient Score,
   En direct et une action GM « Ajouter un point ».
2. Participants et rôles : ajouter un rôle « Invité VIP », lui donner une description.
   Ce rôle reste joueur. Les droits GM proviennent de l’accès serveur.
3. Variables : ajouter une variable. Choisir nom, identifiant, type, portée,
   visibilité et valeur initiale. Pour une information individuelle privée,
   choisir portée Chaque participant et visibilité Ce joueur et le GM.
4. Si un modèle utilise v1, « Activer les expressions v2 » conserve ses règles et
   rend disponibles les conditions composées, sans ouvrir le JSON.
5. Actions : Ajouter une action, nommer « Gagner un point ». Le rôle joueur par
   défaut et la phase initiale sont présélectionnés. Ajouter un effet : Ajouter /
   soustraire, variable Score, valeur fixe 1.
6. Ajouter une condition composée. Choisir ET, puis sur son premier opérande
   Inférieur, Variable Score et Nombre 2. Laisser le second opérande à Vrai.
   L’action sera proposée tant que Score < 2. Le constructeur produit des
   expressions v2 ; le serveur les vérifie et les exécute.
7. Phases et transitions : ajouter une phase « Résultat ». Une alerte indique
   d’abord qu’aucune transition n’y mène.
8. Actions : sélectionner l’action GM « Ajouter un point », la renommer « Terminer ».
   Supprimer son effet avec confirmation. « Après cette action » → Résultat.
9. Enregistrer. Essayer de supprimer Score : le Studio doit signaler ses usages.
   Aucune référence n’est supprimée automatiquement.
10. Tester comme décrit ci-dessous. Depuis la régie, Terminer passe en Résultat et
    retire l’action joueur de la phase précédente.

Les valeurs sont bornées : une initiale hors des bornes bloque la sauvegarde.
Les erreurs restent affichées et les saisies restent dans l’éditeur. Les paramètres
d’action sont disponibles dans les effets, pas dans les conditions d’autorisation.
Les variables individuelles sont modifiables par une action joueur, pour lui-même.
Une révélation publique demande une action réservée au GM.

## Essai réel et liens des trois vues

Dans Tester, « Enregistrer et tester mon jeu » crée un instantané de session.
L’éditeur reste ouvert sur cette page. Un conflit de révision bloque la préparation
plutôt que de tester silencieusement une autre modification.

1. Dans « Votre test est prêt », Ajouter deux joueurs fictifs. Nova et Atlas ont
   chacun un lien privé distinct.
2. Pour un autre appareil réel, utiliser « Invitation du test pour un autre appareil »
   avant installation. Chaque joueur rejoint avec son nom.
3. « Installer le jeu pour cet essai » fige l’effectif et charge la définition exacte.
4. Ouvrir les liens : « Ouvrir la régie du test », « Fictif · Nova », « Fictif · Atlas »,
   « Plateau du test ». Les adresses sont générées par la session :
   `/sessions/<id>/gm`, `/sessions/<id>/player/<joueur>`, `/sessions/<id>/public`.
5. Depuis la régie, lancer la transition initiale si le modèle en possède une.
6. Depuis un joueur, effectuer l’action. Vérifier la valeur dans toutes les vues.
7. « Vérifier le refus d’une action GM » doit afficher le refus attendu 403.
8. « Revenir à l’éditeur » revient au brouillon sans changer l’essai en cours.
9. Pour recommencer les valeurs avec les mêmes joueurs : « Rejouer cette expérience »
   dans la régie. Pour tester une définition modifiée, préparer un nouvel essai.
   « Réinitialiser le salon » dans la régie révoque les joueurs et retire la définition.

Les identités fictives utilisent uniquement les API normales, sans privilège de
simulation. Chaque nouvel essai a son propre identifiant. Conserver les liens avant
rechargement de la page Studio : les liens d’essai sont conservés uniquement en
mémoire. Les sessions persistent en SQLite et leurs liens privés permettent leur
reprise. Aucun accès propriétaire n’est transmis au joueur ou au plateau.

Pour terminer le modèle Réponses privées : dans la régie, ouvrir « Affecter les
rôles des joueurs », puis choisir Relecteur pour Fictif · Atlas. Nova reste
Contributeur. Le GM demande un souvenir ; Nova envoie sa réponse. Le GM passe en
relecture, Atlas confirme la relecture, puis le GM révèle les réponses après
confirmation. Le plateau doit alors afficher la réponse autorisée ; avant cette
révélation il n’affiche que les statuts publics. Rejouer remet les rôles par défaut.

## Publication privée et erreurs d’édition

Dans Publier, choisir une version, déclarer les droits nécessaires puis confirmer.
Cette version apparaît dans la bibliothèque et reste immuable ; le brouillon peut
continuer à évoluer. Publier ne rend rien découvrable sur Internet.

Les modifications locales sont signalées et sauvegardées dans l’onglet. Une alerte
avant fermeture est demandée au navigateur, sans garantie Safari iOS. Conserver
l’accès privé et enregistrer régulièrement. En cas d’erreur réseau, ne pas changer
d’onglet : reprendre la commande incertaine avec le bouton prévu. Pour un conflit,
actualiser la bibliothèque, comparer, puis charger explicitement la copie serveur ;
la copie locale remplacée reste disponible en sauvegarde. Aucune fusion automatique.

Le document JSON secondaire permet de conserver et modifier les configurations
techniques existantes. Une expression n’est jamais simplifiée parce qu’un autre
champ est modifié. Un JSON invalide reste présent et bloque les formulaires qui ne
peuvent pas le lire. Les quotas existants restent applicables : définition 6 000
octets, 8 rôles/variables/phases/actions, 4 paramètres et 6 effets par action,
profondeur d’expression 4. Une saisie technique invalide doit être corrigée dans
le panneau technique ; les erreurs intermédiaires des formulaires restent éditables.

## Checklist de validation humaine

- [ ] Préconditions : même Wi-Fi, adresse réseau correcte, bibliothèque privée conservée.
- [ ] iPhone portrait : parcourir les trois entrées, modifier une règle sans JSON,
      sauvegarder ; menu Section du Studio et actions tactiles lisibles, aucun débordement.
- [ ] Deuxième navigateur : ouvrir Nova et Atlas séparément, agir à tour de rôle.
- [ ] GM : constater le score synchronisé, le changement de phase et le refus d’une
      opération non autorisée ; les données personnelles restent disponibles au GM.
- [ ] Joueur : ne voir que ses données privées et ses actions autorisées ; une action
      devenue indisponible disparaît après la mise à jour serveur.
- [ ] Spectateur : voir uniquement le score, la phase et les informations publiques.
- [ ] Rejouer, revenir à l’éditeur, modifier le brouillon et créer un nouvel essai :
      l’ancienne session et la version publiée gardent leurs propres règles.
- [ ] Appréciation humaine : confort de saisie, clavier iOS, profondeur des conditions,
      compréhension des permissions, retours de sauvegarde et du réseau, lisibilité plateau.

## Limites de 4B

L’apparence préserve les scènes et assets, mais le placement graphique et la liaison
visuelle widget/variable attendent 4C. Les médias ne sont ni transférés ni rendus.
Pas de graphe interactif, transitions automatiques, équipes, nouveaux événements,
comptes, Store ou intégration Twitch. Les rôles/actions/phases ont une description
facultative ; pas de nouvelle règle métier des trois jeux officiels. Les invariants
GM et confidentialité restent imposés par le serveur. Le guide est limité aux deux
modèles décrits, sans traduction inverse automatique des règles avancées.
