# Tester les blocs 5, 6 et 7 — iPhone, ordinateur et OBS

Les designs ont été validés humainement. Ce guide concerne la nouvelle implémentation,
qui reste à essayer sur un véritable iPhone et dans OBS. Le premier workflow OBS
antérieur reste validé pour le parcours déjà observé.

## Ouvrir la version intégrée

Les blocs 5 (régie), 6 (Broadcast / OBS) et 7 (laboratoire) sont maintenant réunis
sur `integration/blocks-5-6-7`. Les branches `ux/block-*` sont conservées comme
provenance. Utilisez la branche d’intégration pour essayer tout le parcours.
Voir le [bilan de fusion et de validation](INTEGRATION-BLOCKS-5-6-7.md).

Arrêtez d’abord l’ancien serveur avec **Ctrl+C** dans son terminal, puis copiez :

```sh
cd ~/extension-twitch-studio-4b &&
git fetch origin &&
git switch integration/blocks-5-6-7 &&
git pull --ff-only &&
nvm use 24 &&
npm ci &&
npm run dev:lan
```

Si Git signale des modifications locales, conservez-les avant de changer de branche.
Gardez le terminal ouvert. Ouvrez l’adresse affichée sur l’ordinateur et l’iPhone,
sur le même Wi-Fi de confiance. L’adresse du conteneur Cloud ne remplace pas cette
adresse locale. Aucun compte Twitch n’est nécessaire.

Pour comparer avec les références Stitch, choisissez **Neon Show** dans Apparence.
Le thème de l’émission se choisit séparément dans la préparation de l’overlay ;
changer l’apparence privée ne doit pas recolorer OBS. Les autres thèmes sont conservés.

## Préparer une démonstration

1. Ouvrez l’accueil, puis Undercover. **Attendu :** les réglages existants du jeu.
2. Choisissez quatre joueurs de démonstration, un Undercover et deux tours d’indices.
   **Attendu :** une configuration valide, sans saisie technique.
3. Touchez « Lancer une partie de démonstration ». **Attendu :** le laboratoire privé.
4. Copiez le lien privé GM pour l’iPhone. Ouvrez-le sur l’iPhone. **Attendu :** la régie
   avec Partie / Joueurs / Plateau. Ne partagez pas ce lien avec un participant.
5. Gardez le laboratoire sur l’ordinateur. Ouvrez « Accès aux vues » pour les liens
   individuels, le plateau public, l’aperçu et OBS. **Attendu :** chaque accès possède
   son rôle réel ; la page du laboratoire ne doit pas être partagée.

## Bloc 5 — animer la partie

1. Sur l’iPhone, identifiez « Prêt à distribuer ». Touchez « Distribuer les mots et
   commencer ». **Attendu :** Discussion, manche 1 et premier tour d’indices.
2. Sur l’ordinateur, sélectionnez chaque joueur. **Attendu :** un seul mot individuel
   dans chaque perspective. Aucun mot privé sur le plateau public.
3. Donnez les indices oralement ; sur l’iPhone, confirmez chaque passage. **Attendu :**
   le joueur courant et la progression changent après chaque confirmation serveur.
4. Confirmez quatre passages, puis quatre autres. **Attendu :** deux tours complets.
   Le vote n’est pas proposé avant leur fin ; aucun indice écrit n’est obligatoire.
5. Touchez « Ouvrir les votes ». **Attendu :** participation à 0 / 4, puis évolution
   au rythme des vrais votes. La révélation attend les quatre votes.
6. Pour atteindre rapidement une victoire civile, consultez les informations privées
   GM et repérez l’Undercover. Faites voter les trois autres contre lui ; lui-même
   doit choisir un autre joueur. **Attendu :** pas d’auto-vote ni de deuxième vote.
7. Touchez « Révéler le résultat du vote », puis « Annuler ». **Attendu :** rien n’est
   dépouillé. Rouvrez et confirmez. **Attendu :** élimination et victoire calculées
   par le serveur ; les révélations finales deviennent publiques.
8. Touchez « Rejouer cette partie », puis confirmez. **Attendu :** mêmes joueurs et
   mêmes accès ; mots et votes remis à zéro avant la prochaine distribution.

Pendant une partie en cours, le rejeu est rangé dans « Accès et réglages de la partie ».
Cet espace permet aussi de renommer l’émission et de conserver l’accès privé GM.
« Réinitialiser le salon » est différent : après confirmation, les joueurs sont retirés
et leurs anciens accès révoqués. Faites cet essai sur une démonstration dispensable.

Pour une égalité, faites voter chaque joueur contre son voisin dans l’ordre des
inscriptions. **Attendu :** une voix chacun, aucune élimination et possibilité de
continuer si la limite de manches n’est pas atteinte. Une limite atteinte sans victoire
produit le nul prévu par le serveur.

## Bloc 6 — observer l’émission et régler sa disposition

1. Ouvrez « Aperçu de l’émission » sur l’ordinateur. **Attendu :** scène fictive,
   véritable plateau synchronisé, sans flux Twitch réel.
2. Faites avancer les indices et les votes depuis les vues GM/joueurs. **Attendu :**
   joueur courant, passages confirmés et participation publique évoluent sans rechargement.
3. Avant le dépouillement, vérifiez l’absence de choix individuels et de secrets.
   Après révélation, vérifiez le résultat autorisé. **Attendu :** aucune information
   provenant d’un panneau privé ne remplit le plateau.
4. Ouvrez la source OBS transparente. **Attendu :** même rendu public, sans commandes
   GM/joueur ni décor de scène. Dans OBS, ajoutez une source navigateur de 1920 × 1080
   avec cette URL publique, au-dessus d’un fond coloré pour contrôler la transparence.
5. Ouvrez la personnalisation de l’overlay depuis les accès GM. **Attendu :** sept blocs,
   quatre dispositions et réglages bornés. Le damier de l’éditeur n’appartient pas à OBS.
6. Modifiez légèrement une coordonnée ou une taille autorisée. **Attendu :** état non
   enregistré et bouton d’enregistrement disponible. Enregistrez. **Attendu :** le
   même lien OBS se met à jour, sans réinitialiser la partie.
7. Pour un conflit, ouvrez l’éditeur dans deux onglets GM. Modifiez les deux, puis
   enregistrez le premier. **Attendu :** le second conserve son travail et demande
   une résolution ; annuler le chargement distant ne remplace pas ses modifications.
8. Changez l’apparence privée de l’application. **Attendu :** le thème de l’émission
   reste celui de la session. Rechargez OBS : l’état actuel revient, sans rejouer les
   anciennes animations.

La grille automatique existante conserve quatre colonnes au maximum : six joueurs
peuvent donc apparaître en 4 + 2, contrairement aux six colonnes de certaines références.
Les layouts enregistrés ne sont pas réorganisés silencieusement.

## Bloc 7 — changer de perspective sans mélanger les accès

1. Sélectionnez Joueur 1, puis Joueur 2. **Attendu :** l’identité annoncée et le mot
   correspondent au joueur sélectionné ; une seule perspective privée est montée.
2. Rechargez. **Attendu :** la perspective de cet onglet est conservée.
3. Sur ordinateur, activez « Comparer avec l’émission ». **Attendu :** perspective
   privée et vrai renderer public côte à côte. Les accès ouverts se replient pour
   laisser voir le comparatif. Sur téléphone, une seule perspective reste prioritaire.
4. Ouvrez « Vérifier les permissions · avancé » et lancez le contrôle. **Attendu :**
   la tentative de gestion avec l’accès joueur est réellement refusée par le serveur.
   Une erreur réseau doit être présentée comme une erreur, pas comme un refus réussi.
5. Ouvrez « Outils de test », puis « Recommencer le test ». Annulez d’abord, puis
   confirmez. **Attendu :** annulation sans effet ; confirmation conservant les accès.
6. Si une préparation a été interrompue, utilisez « Reprendre la préparation ».
   **Attendu :** reprise du même essai, sans duplication des joueurs.
7. Ouvrez uniquement l’URL du laboratoire dans un navigateur neuf. **Attendu :**
   accès local indisponible, sans attribution automatique de droits QA.

## Points à vérifier sur un véritable iPhone

- Les commandes restent touchables, y compris les derniers réglages sous la barre fixe.
- Le clavier ne masque pas les champs et les commandes ; le zoom reste possible.
- Aucun défilement horizontal ; les noms longs et les erreurs restent lisibles.
- Les confirmations expliquent les conséquences, Annuler fonctionne et le focus revient.
- Les mises à jour entre ordinateur et iPhone arrivent sans actualisation manuelle.

Les tests Chromium, même aux dimensions d’un iPhone, ne prouvent ni Safari/VoiceOver
sur appareil physique, ni le rendu d’une véritable scène OBS. Aucune nouvelle
validation humaine de ces implémentations n’est revendiquée dans ce guide.
