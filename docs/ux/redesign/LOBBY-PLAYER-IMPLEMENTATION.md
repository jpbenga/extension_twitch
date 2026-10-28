# Blocs 3 et 4 — salon et compagnon Undercover

## Périmètre et architecture

Les 21 références du commit `3c2e704` ont reçu une validation humaine explicite.
Leurs captures APPROVED et HTML restent inchangés. Les sections fonctionnelles
des 21 SPEC sont complétées à partir des contrats et comportements actuels.

- `StitchLobby` remplace le salon officiel avant `game.use-prepared`. La validité
  utilise les limites serveur, pas la présence réseau ni le statut Prêt. Préparer
  ferme les inscriptions ; distribuer les mots reste une action GM distincte.
- `UndercoverCompanion` utilise uniquement la projection du participant, dans sa
  page et dans le laboratoire. Les mots masqués sont retirés du DOM visible.
  Les actions, candidats, tours, décomptes et rôles révélés viennent du serveur.
  Une ancienne session peut avoir un gameId de salon Undercover tout en exécutant
  une autre définition : elle garde alors son interface générique et ses actions,
  au lieu de rester bloquée dans l'attente d'un mot Undercover.
- `SessionEntry` conserve le POST, l'idempotence, les capacités personnelles et
  les réponses incertaines. Un nom déjà pris conserve la saisie et affiche le refus.
- `useSession`, le moteur, SQLite/SSE, les reçus et les permissions sont conservés.
  Une réponse incertaine est reprise avec le même identifiant de commande.
- Un ajout API : `preparedGame.clueRounds`, facultatif, borné à 1–5 et réservé
  aux métadonnées GM. Il permet un résumé exact sur un autre appareil. Aucun mot,
  état serveur complet ou configuration secrète n'est ajouté aux projections.
  Sans cette valeur, une ancienne partie affiche « Réglages enregistrés ».
- Le dialogue de vote réutilise `FeedbackProvider` et sa gestion du focus, des
  erreurs et de l'asynchrone, avec une variante visuelle `presentation: stitch`.
  Les autres dialogues, notamment GM, ne changent pas.
- Victoire/défaite personnelles sont des textes dérivés du résultat officiel et
  du camp déjà révélé, jamais du mot. Le nul correspond à `round-limit`. Un joueur
  éliminé peut gagner avec son camp. Aucun joueur ne reçoit de commande de rejeu.

L'écran de configuration du Bloc 2 n'est pas refondu par cette livraison. La
régie pendant le jeu, le laboratoire et les rendus OBS gardent leur composition.
Le laboratoire affiche toutefois le même nouveau compagnon pour incarner un joueur.
Pas de service, dépendance, média distant ou intégration Twitch ajouté.

## Continuité visuelle et responsive

Space Grotesk et DM Sans restent locaux, mutualisés dans `brand-fonts.css`.
Les tokens de l'accueil sont partagés par les seules classes `stitch-page` et
`stitch-dialog`. Aucune valeur de l'accueil ou des tokens GM/OBS n'est changée.

Neon Show reprend l'indigo `#0C0C1F`, les surfaces `#1A1A2D` / `#28283C`, le
lilas `#CEBDFF` et l'action citron `#C8F323`. Les deux autres thèmes conservent
leur palette et la même structure. Le défaut reste Broadcast Studio ; choisir
Neon Show dans Apparence pour comparer aux références.

Le compagnon a une largeur de lecture maximale de 390 px et reste fluide sur
petit téléphone. Le salon utilise deux colonnes sur ordinateur et une sur mobile.
Cibles de 44 px minimum, champs de 16 px, zoom conservé, safe areas et mouvement
réduit. La préparation est sticky sur mobile, avec sa place réservée dans le flux ;
elle redevient statique sur petites hauteurs et quand le clavier est détecté.

## Adaptations fonctionnelles aux maquettes

- Les larges marges vides des exports mobiles ne deviennent pas un téléphone de
  largeur fixe dans l'application. Les captures réelles montrent toute la page.
- Partager apparaît uniquement si Web Share existe. En HTTP LAN, cette API peut
  manquer ; Copier et son repli manuel sont conservés.
- Synchronisation, reconnexion, erreurs, reprise de commande et récupération
  privée restent accessibles même s'ils ne sont pas dessinés dans une référence.
  Le titre personnalisé de la partie reste visible dans l'attente joueur et suit
  les renommages serveur, y compris après reconnexion.
- L'erreur de nom déjà pris n'est pas affichée artificiellement à l'arrivée.
  Une invitation inconnue est détectée lors de l'inscription existante, sans
  nouvelle API de prélecture. Fermeture et erreur réseau gardent leur propre message.
- Mot masqué, attente et tour oral sont composés selon la phase réelle. Une fois
  le mot masqué, le tour ou le vote devient prioritaire. Pas d'écran autonome ajouté
  uniquement pour reproduire une composition sans nouvelle intention fonctionnelle.
- La disponibilité disparaît après préparation, avant même la distribution. Un
  état d'attente explicite remplace alors le contrôle facultatif Je suis prêt.
- Les prénoms ne déterminent pas le genre. Les résultats globaux du serveur restent
  affichés avec les formulations personnelles. Les mots n'apparaissent en commun
  qu'après la révélation autorisée.

## Captures réelles et comparaison

Chaque dossier validé reçoit `implementation-mobile.png`, ou
`implementation-desktop.png` pour les deux salons desktop, à côté de `approved.png`.
Les fichiers APPROVED ne sont jamais remplacés. Exemples :

- [Salon vide desktop](lobby-empty-desktop/implementation-desktop.png)
- [Salon prêt desktop](lobby-ready-desktop/implementation-desktop.png)
- [Salon vide mobile](lobby-empty-mobile/implementation-mobile.png)
- [Salon prêt mobile](lobby-ready-mobile/implementation-mobile.png)
- [Arrivée et refus de nom](player-arrival-mobile/implementation-mobile.png)
- [Mot privé](player-secret-mobile/implementation-mobile.png)
- [Tour oral](player-clue-turn-mobile/implementation-mobile.png)
- [Vote](player-vote-mobile/implementation-mobile.png)
- [Confirmation](player-vote-confirm-mobile/implementation-mobile.png)
- [Résultat intermédiaire](player-round-result-mobile/implementation-mobile.png)
- [Victoire](player-victory-mobile/implementation-mobile.png)
- [Nul](player-draw-mobile/implementation-mobile.png)

Version compilée, commandes réelles, SQLite temporaire, personnages fictifs.
Les codes d'invitation appartiennent à des bases de test détruites. Aucun jeton GM
ou joueur n'est affiché. Le défilement réel place la barre sticky en fin de page
pour les captures complètes, sans modification CSS de présentation.

Desktop : viewport 1280×1024, DPR 2 ; capture vide 2560×2048 et prête 2560×2092.
Mobile : viewport 390×884, DPR 2 ; largeur 780 px, hauteur variable pour montrer
tout le contenu. Les pages longues, notamment le salon, conservent les informations
réelles de connexion, le lien copiable et les aides de récupération. Cela augmente
leur hauteur par rapport à certaines propositions nominales.

## Contrôles exécutés

Node 24.19.0, npm 11.9.0 et Chromium système. Bases et serveurs isolés, permissions
réelles conservées. Les passages ciblés de diagnostic ne sont pas additionnés.

| Commande               | Résultat                                                                          |
| ---------------------- | --------------------------------------------------------------------------------- |
| `npm test`             | **197 tests réussis**, 24 fichiers                                                |
| `npm run typecheck`    | TypeScript strict réussi                                                          |
| `npm run build`        | Packages, serveur et Next.js compilés                                             |
| `npm run format:check` | Réussi                                                                            |
| `npm run test:players` | **16 cas réussis**, 4 parcours × desktop/tablette/mobile/320 px                   |
| `npm run test:e2e`     | **42 cas réussis**                                                                |
| `npm run test:games`   | **12 cas réussis**                                                                |
| `npm run test:ux`      | **12 cas réussis**                                                                |
| `npm run test:design`  | **12 cas réussis**                                                                |
| `npm run test:stream`  | **9 cas réussis**                                                                 |
| `npm run test:layout`  | **6 cas réussis**                                                                 |
| `npm run test:home`    | **16 cas réussis**                                                                |
| `npm run test:legacy`  | **60 cas réussis**, maintenance locale uniquement                                 |
| `npm run test:lab`     | **6 cas réussis**, développement, dialogues et absence d'erreurs Next/hydratation |

Total : **191 cas navigateur**. Les nouveaux parcours utilisent de vrais GM,
joueurs et spectateurs dans des contextes distincts. Ils couvrent les refus, les
votes, une élimination intermédiaire, une victoire/défaite personnelle, un nul,
le rejeu, le mauvais accès, la reconnexion et le reçu exact après coupure réseau.
Les quatre tests de sélection du compagnon préservent aussi l'interface générique
d'une ancienne définition différente de l'identifiant de son salon.

Les tests ne constituent pas une validation humaine de l'ergonomie. Aucun iPhone,
Safari/VoiceOver physique ni nouvel essai OBS n'est revendiqué ; le workflow OBS
précédent reste humainement validé pour le parcours observé.

## Guide simple iPhone et ordinateur

Après récupération de `feat/stitch-lobby-player`, depuis le projet local :

```sh
nvm use 24
npm ci
npm run dev:lan
```

1. **iPhone** : ouvrez l'adresse réseau imprimée, puis Préparer une partie.
   Choisissez « Inviter de vrais participants », puis créez la partie. Le salon
   est vide et Préparer est désactivé. Choisissez Neon Show dans Apparence.
2. Copiez l'invitation vers l'ordinateur. Elle est destinée aux joueurs ; elle
   est distincte de votre lien privé GM, dans « Ma régie et mon plateau ».
3. **Ordinateur** : ouvrez l'invitation dans trois onglets et inscrivez Alex,
   Lou et Sam. Chaque onglet reçoit un accès distinct. Essayez deux fois Alex :
   le deuxième formulaire conserve sa saisie et explique le refus.
4. Un joueur touche **Je suis prêt**. Le GM voit ce statut ; les deux autres
   peuvent rester en préparation. Le bouton GM devient quand même disponible.
5. **iPhone** : touchez **Préparer la partie**. Les inscriptions se ferment,
   les joueurs attendent encore leurs mots. Touchez ensuite la commande existante
   **Distribuer les mots et commencer**.
6. **Ordinateur** : chacun ne voit que son mot. Essayez Masquer / Voir mon mot.
   L'instruction du tour oral désigne le bon joueur, sans champ de saisie d'indice.
7. **iPhone** : confirmez les indices pendant les deux tours. Le vote n'est pas
   disponible avant leur fin. Ouvrez ensuite les votes.
8. **Ordinateur** : choisissez une cible, touchez Voter puis Annuler. Aucun vote
   ne doit être enregistré. Recommencez et confirmez : cible et Vote enregistré
   apparaissent. Rechargez : identité et vote doivent rester les mêmes.
9. Faites voter les autres. **iPhone** : révélez le résultat. À trois joueurs,
   une élimination majoritaire termine la partie ; Alex→Lou→Sam→Alex crée une égalité.
   Le GM lance la manche suivante lorsque les règles le permettent.
10. Vérifiez résultat personnel et plateau public, puis Rejouer cette partie côté
    GM. Les mots redeviennent indisponibles et les joueurs conservent leurs accès.

Avec quatre joueurs, éliminer un civil permet une manche intermédiaire. Pour un
nul rapide, réglez la limite à une manche dans la préparation existante puis faites
une égalité. Le mode de démonstration et son sélecteur privé restent utilisables
pour incarner plusieurs participants sans inscription manuelle.

À apprécier : longueur des pages, clarté des états, bouton mobile, clavier/zoom,
safe areas Safari, carte privée et confort de vote. Utilisez l'adresse dev:lan
pour l'autre appareil, jamais localhost. Les nouvelles interfaces attendent cet
essai humain, distinct de l'approbation des maquettes.
