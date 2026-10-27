# Tester Undercover et personnaliser son overlay

Le premier parcours complet avec OBS a été validé par votre essai. Ce guide permet
de vérifier la nouvelle personnalisation. Aucun compte Twitch ni diffusion en direct.
Préparez la disposition sur le Mac ; utilisez ensuite l’iPhone pour animer la partie.

## Démarrer

Dans le dossier du projet, avec Node 24 et npm 11 :

```sh
npm ci
npm run dev:lan
```

Gardez le terminal ouvert. Ouvrez **la même adresse réseau affichée** sur l’ordinateur
et l’iPhone, connectés au même Wi-Fi. Utilisez cette adresse sur le Mac aussi,
pour que les liens copiés soient utilisables sur l’iPhone. Pas de redirection Internet.

## 1. Préparer la partie et sa disposition

| Action sur l’ordinateur                                          | Résultat attendu                                                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Choisissez Undercover, puis 3 joueurs de démonstration           | Le résumé indique 2 civils, 1 Undercover ; 2 tours d’indices par défaut                               |
| Essayez 2 Undercover pour ces 3 joueurs                          | Le lancement est refusé avec une explication ; remettez 1                                             |
| Ouvrez « Personnaliser l’overlay »                               | Un cadre 16:9 présente les mêmes blocs que la source OBS ; les noms sont des exemples avant lancement |
| Choisissez « Joueurs en bas » puis confirmez                     | Les cartes passent dans la zone inférieure                                                            |
| Choisissez « Résultat » dans « Bloc à ajuster »                  | Ses champs de position et taille sont accessibles                                                     |
| Augmentez sa hauteur, par exemple de 380 à 390                   | Le panneau grandit immédiatement dans le cadre                                                        |
| Glissez un bloc, puis sa poignée ↘                               | Sa position et sa taille changent, sans sortir du cadre                                               |
| Si un avertissement de superposition apparaît, écartez les blocs | L’avertissement disparaît quand ils ne se recouvrent plus                                             |
| Lancez la démonstration                                          | La disposition est enregistrée dans cette partie et le laboratoire s’ouvre                            |

Avant lancement, la disposition est conservée automatiquement dans cet onglet.
Recharger la préparation garde ces réglages. Elle ne devient pas un modèle de compte.

## 2. Ouvrir l’aperçu et OBS

1. Dans le laboratoire, ouvrez **Aperçu de l’émission** : les cartes doivent être en bas.
2. Ouvrez **Source OBS transparente**, puis copiez l’adresse de cette page.
3. Dans OBS, utilisez votre scène de test déjà préparée. Dans la source **Navigateur**,
   remplacez l’URL par celle de cette nouvelle partie ; largeur 1920, hauteur 1080.
4. Gardez un fond coloré sous le plateau dans la liste des sources.
5. Vérifiez que la disposition est identique et que ce fond reste visible entre les
   panneaux. Le damier et les poignées ne doivent pas apparaître dans OBS.

Le décor de « Scène fictive » appartient à l’aperçu uniquement. Les joueurs, phases,
votes et résultats sont ceux du serveur réel. OBS reçoit le même plateau, sans ce décor.
Pour l’installation OBS Intel/Apple et les détails de scène, gardez le
[guide déjà testé](TEST-STREAM-PREVIEW.md). Ne cliquez pas sur Démarrer le streaming.

## 3. Jouer avec l’iPhone et l’ordinateur

| Action                                                           | Résultat attendu                                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Copiez le lien privé GM du laboratoire et ouvrez-le sur l’iPhone | Votre régie s’ouvre, sans déplacer les accès joueurs du Mac                                    |
| Depuis l’iPhone, distribuez les mots                             | Le plateau passe en discussion ; aucun mot secret n’est public                                 |
| Sur le Mac, passez par Joueur 1, 2 et 3                          | Chaque perspective affiche uniquement son mot personnel                                        |
| Confirmez les 3 passages du premier tour sur l’iPhone            | La progression apparaît dans l’aperçu et OBS ; le vote n’est pas encore disponible             |
| Confirmez les 3 passages du deuxième tour                        | Les indices sont terminés ; le GM peut ouvrir les votes                                        |
| Ouvrez les votes, puis votez depuis chaque joueur du Mac         | Le plateau affiche successivement 1 / 3, 2 / 3, 3 / 3 votes ; aucun choix individuel secret    |
| Révélez le résultat depuis le GM                                 | Décompte, élimination et victoire apparaissent dans les blocs positionnés                      |
| Touchez Rejouer puis confirmez                                   | Les mêmes accès restent valides, l’état revient en préparation et la disposition ne change pas |

À 3 joueurs, une élimination sans égalité termine la partie : intrus éliminé → civils ;
civil éliminé → Undercover. Pour forcer un résultat sans lire le code, le GM peut ouvrir
sa zone privée, identifier l’Undercover et faire voter les deux civils contre lui ;
l’Undercover doit voter pour un civil. Pour plusieurs manches, essayez 4 joueurs.
Une égalité n’élimine personne : commencez une nouvelle manche et ses tours d’indices.

## 4. Ajuster la disposition d’une partie existante

1. Sur le Mac, revenez au laboratoire et touchez **Personnaliser l’overlay**.
   Vous pouvez aussi l’ouvrir depuis l’onglet Plateau de la régie.
2. Choisissez **Présentation des joueurs → Grille**, puis ouvrez **Ordre visuel des joueurs**.
   Les flèches changent seulement l’ordre à l’écran, pas l’ordre de parole.
3. Activez **Déplacer les cartes individuellement**, puis glissez une carte.
   Le placement devient libre. Les rôles et identités restent inchangés.
4. Touchez **Enregistrer la disposition**.
   L’aperçu et OBS doivent changer automatiquement, avec leur URL actuelle.
5. Rechargez cette page : la disposition enregistrée doit être retrouvée.
6. Pour revenir au rendu initial, touchez **Rétablir la disposition par défaut**,
   confirmez puis **Enregistrer la disposition**. La partie ne redémarre pas.

Les ajustements non enregistrés ne changent pas le plateau public. Ils sont conservés
localement en revenant sur cette page. Si deux onglets modifient la disposition,
l’enregistrement concurrent est bloqué ; vos valeurs restent visibles. Notez vos
ajustements avant de choisir **Charger la disposition enregistrée**, puis réappliquez-les.

## 5. Points à apprécier vous-même

- Les noms, votes et résultats sont-ils lisibles dans votre vraie scène OBS ?
- La grille convient-elle mieux que le placement libre pour votre effectif ?
- Les cartes se chevauchent-elles ? Les zones laissées à la caméra sont-elles suffisantes ?
- Les commandes GM restent-elles confortables sur l’iPhone pendant que le Mac affiche OBS ?
- Une ouverture tardive de la source montre-t-elle le bon état sans ancienne animation ?
- Une nouvelle partie change d’URL ; rejouer la même partie conserve son URL et sa disposition.

Les tests Chromium ne remplacent pas ce contrôle OBS/iPhone réel. La validation
humaine du workflow précédent est acquise ; les nouveaux layouts attendent votre retour.
