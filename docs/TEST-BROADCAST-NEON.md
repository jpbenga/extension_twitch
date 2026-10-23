# Tester Broadcast Neon sur votre iPhone

Cette livraison conserve Undercover jouable et le Studio. Enchères et Qui est
l’espion restent en préparation. Les nouvelles couleurs ne changent pas les règles.

## Démarrer sur le Mac

Depuis le dossier Git du projet, conservez vos éventuelles modifications locales,
puis utilisez Node.js 24 et npm 11 :

Si l’application tourne encore dans le terminal, arrêtez-la avec **Ctrl+C** avant
de changer de branche. Elle sera relancée avec la dernière commande ci-dessous.

```sh
git fetch origin
git switch feat/broadcast-neon-design-system
npm ci
npm run dev:lan
```

Gardez ce terminal ouvert. Mac et iPhone sur le même Wi-Fi de confiance.
Ouvrez **l’adresse affichée par la commande**, suivie de `/creator/play`.
Par exemple, si l’adresse du Mac n’a pas changé :
**http://192.168.0.46:3000/creator/play**.
Ne saisissez pas localhost sur l’iPhone et n’exposez pas ce serveur sur Internet.

Si votre dossier est un ancien ZIP, récupérez plutôt
[l’archive de la nouvelle branche](https://github.com/jpbenga/extension_twitch/archive/refs/heads/feat/broadcast-neon-design-system.zip).
Décompressez-la, ouvrez le terminal dans son dossier et lancez les commandes npm.
Les commandes Git ne s’appliquent pas à une archive sans dépôt Git.

## Ouvrir la régie

1. Dans le **Laboratoire des jeux**, laissez 4 joueurs et 1 Undercover.
2. Touchez **Lancer une partie de démonstration**.
3. Dans **Point de vue**, gardez **Game Master**.
4. Ouvrez **Ouvrir cette vue sur un autre écran**, puis **Ouvrir la vue sélectionnée**.
   Vous êtes dans la régie. Ce lien est privé : ne le partagez pas.

Pour les autres vues du laboratoire, utilisez le sélecteur. Pour regarder beaucoup
de vues simultanément, préférez plusieurs appareils ou profils de navigateur.
Les nombreux flux HTTP locaux d’un même navigateur peuvent atteindre sa limite.

## Scénario 1 — Une confirmation à l’image du produit

| À faire dans la régie                                    | Résultat attendu                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Touchez **Distribuer les mots et commencer**.            | La phase passe à Discussion, avec l’état En cours.                                                                        |
| Touchez **Rejouer cette partie**.                        | Une fenêtre sombre Broadcast Neon s’ouvre : « Recommencer la partie ? ». Aucun encart système indiquant l’adresse du Mac. |
| Lisez les conséquences.                                  | Les accès sont conservés ; votes, éliminations et résultats seront effacés.                                               |
| Touchez **Annuler**.                                     | La fenêtre se ferme ; la discussion continue, sans nouvelle distribution.                                                 |
| Ouvrez à nouveau le dialogue et touchez **Recommencer**. | Le bouton est occupé pendant la requête, puis la phase revient à Préparation.                                             |
| Distribuez à nouveau.                                    | La partie démarre réellement ; chaque joueur reçoit son mot privé.                                                        |

Le laboratoire propose aussi **Recommencer le test**, avec la même confirmation.
Une perte réseau peut laisser le dialogue ouvert avec une erreur. Fermez-le, lisez
le message dans la page et utilisez la commande de reprise proposée. Ne videz pas
les données du navigateur pour forcer une seconde exécution.

## Scénario 2 — Piloter depuis le téléphone

| À faire                                             | Résultat attendu                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Ouvrez **Jeu**.                                     | Le jeu, la phase et l’effectif sont identifiables ; une seule section principale de pilotage est affichée. |
| Démarrez la distribution puis **Ouvrir les votes**. | La phase et ses instructions changent ; le vote est repéré en corail, sans être présenté comme une erreur. |
| Touchez **Joueurs**.                                | Les inscrits et leurs connexions réelles apparaissent ; l’onglet choisi est indiqué.                       |
| Revenez au **Jeu**.                                 | La partie et ses commandes sont conservées. Les joueurs sans vote sont identifiés.                         |
| Touchez **Plateau**.                                | Seules les informations publiques sont affichées : aucun mot ou camp caché.                                |
| Utilisez **Commandes du jeu** en bas.               | Retour rapide au pilotage, sans parcourir les réglages de session.                                         |

Pour terminer une partie : revenez au laboratoire, consultez les informations privées
GM pour identifier l’Undercover, puis faites voter les trois civils contre lui depuis
leurs vues. L’Undercover choisit un autre joueur. Revenez au GM, touchez **Révéler le
résultat du vote** et confirmez. Le plateau doit annoncer la victoire civile ; les
mots et camps sont révélés seulement à la fin. Le [guide Undercover](TEST-OFFICIAL-GAMES.md)
décrit aussi égalités, victoire Undercover, invitations réelles et OBS.

## Scénario 3 — Destruction explicite

1. Dans la régie, ouvrez **Session**.
2. Touchez **Réinitialiser le salon**.
3. Vérifiez que le bouton de confirmation est corail, avec le texte explicite
   **Réinitialiser le salon** et la conséquence de révocation des accès.
4. Touchez **Annuler** : les joueurs restent inscrits.
5. Si vous souhaitez réellement recommencer le salon, ouvrez à nouveau le dialogue
   et confirmez. Les joueurs sont retirés, leur ancien accès ne fonctionne plus.
   Votre accès GM et le plateau public sont conservés.

**Rejouer** conserve les joueurs ; **réinitialiser le salon** retire leurs accès.

## Scénario 4 — Cohérence du Studio

1. Ouvrez `/creator`, puis **Personnaliser un jeu** et choisissez **Impulsion collective**.
2. Changez l’objectif, puis **Enregistrer**. Une notification confirme le succès.
3. Touchez **Tester mon jeu**. Les changements doivent fonctionner dans le vrai jeu.
4. Revenez à l’édition, ouvrez **Studio avancé → Données**, ajoutez une donnée inutilisée.
5. Touchez **Supprimer cette donnée** : **Conserver** annule, **Supprimer** retire
   la donnée. Une donnée encore utilisée par une règle doit être protégée par un message.
6. Dans **Versions**, attestez les droits puis **Enregistrer une version** : la
   confirmation rappelle que cette copie reste privée et figée.

Les avertissements système quand vous quittez une page non enregistrée sont des
protections du navigateur. Ils restent possibles ; les confirmations de jeu et
d’édition doivent, elles, avoir la nouvelle présentation.

## Scénario 5 — Lisibilité, clavier et accessibilité

- Vérifiez la lisibilité des textes secondaires, boutons désactivés et messages.
- Vérifiez les cibles tactiles en portrait et l’absence de défilement horizontal.
- Ouvrez le clavier dans un champ : le champ et les commandes doivent rester
  accessibles. Refermez-le et vérifiez la stabilité des barres inférieures.
- Ouvrez un dialogue après avoir fait défiler la page ; tous les choix doivent
  rester atteignables, sans recouvrement par Safari.
- Si vous utilisez VoiceOver, vérifiez titre, description, boutons, ordre de lecture
  et retour au déclencheur après annulation. Avec clavier externe, testez Tab,
  Maj+Tab et Échap. Une opération en cours ne doit pas être interrompue par Échap.
- Activez Réduire les animations dans iOS et vérifiez que l’interface reste claire.

Le catalogue `/design-system` présente les composants en développement. Il ne
contrôle aucune partie et reste absent en production. Son exemple de confirmation
asynchrone sert au test des états, pas à simuler un résultat de jeu.

## Checklist de validation humaine

- [ ] Je distingue création, participation, vote, attention et destruction par les textes et couleurs.
- [ ] Je comprends la phase et trouve l’action principale sans chercher.
- [ ] J’annule un rejeu sans modifier la partie.
- [ ] Je confirme un rejeu et retrouve les mêmes joueurs.
- [ ] Je comprends la différence avec une réinitialisation du salon.
- [ ] Je peux passer entre Jeu, Joueurs, Session et Plateau sur mon iPhone.
- [ ] Chaque joueur voit seulement ses informations autorisées.
- [ ] Le plateau reste lisible, synchronisé et sans secrets avant révélation.
- [ ] Les champs, le clavier, les fenêtres et les commandes restent utilisables au doigt.
- [ ] Je peux revenir au Studio et enregistrer mes modifications.

## Vérification technique et captures

Vérifications locales terminées le **24 octobre 2026 (heure de Paris)**. Base
`512d936`, branche `feat/broadcast-neon-design-system`. Aucun changement du serveur,
des contrats métier, du moteur, des tables SQLite ou des règles d’Undercover.

| Commande exécutée     | Résultat                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| `npm run check`       | Réussi : formatage, **110 tests** sur 15 fichiers, TypeScript strict et compilation |
| `npm run test:e2e`    | **78 réussis**, 26 par format ; tous les parcours existants conservés               |
| `npm run test:games`  | **12 réussis**, quatre parcours Undercover par format                               |
| `npm run test:design` | **12 réussis**, quatre nouveaux parcours par format                                 |
| `npm run test:lab`    | **6 réussis**, dont trois nouveaux tests de composants/dialogues                    |
| `git diff --check`    | Réussi                                                                              |

Les suites navigateur utilisent ici
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Les formats sont 390 × 844,
768 × 1024 et 1440 × 1000 ; les dialogues sont aussi vérifiés à 320 × 568 et 320 × 360.
Le plateau est mesuré en 1920 × 1080, sans débordement dans le scénario livré.
Ces dimensions ne simulent ni tout Safari ni un véritable clavier d’iPhone.

Les nouveaux tests vérifient annulation sans mutation, focus clavier et retour au
déclencheur/titre, fond inerte, Échap, chargement, double soumission, refus serveur,
reprise, suppression avec références et notifications. Les tests de contraste lisent
la palette réelle. Les anciennes assertions de confidentialité, de résultats, de
reconnexion et d’immutabilité restent actives ; les confirmations applicatives sont
désormais manipulées dans le DOM, sans désactiver leur fonctionnement. Les tests
des avertissements natifs de navigation restent conservés.

Un chevauchement dans l’ancien aperçu `/demo`, lié à la hauteur des lignes, a été
corrigé en conservant sa composition 16:9 et ses assertions. Aucun avertissement
Next.js/hydratation n’a été observé dans les parcours de développement surveillés ;
aucun indicateur Next.js n’est masqué. Le workflow CI inclut `test:design` ; ces
résultats sont locaux, pas une affirmation d’exécution distante de la CI.

### Captures avant / après

Images Chromium de données fictives. Les images entières incluent le contenu sous
le premier écran ; une barre fixe peut donc apparaître au milieu de la capture.
Les comparaisons montrent la même zone produit, avec des parties de test différentes.

| Écran                      | Avant                                                  | Broadcast Neon                                                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Accueil Studio mobile      | [4B.1](screenshots/4b1/accueil-mobile.png)             | [Voir](screenshots/broadcast-neon/studio-mobile.png)            |
| Accueil application mobile | —                                                      | [Voir](screenshots/broadcast-neon/accueil-mobile.png)           |
| Régie mobile, préparation  | [5A](screenshots/5a/regie-mobile.png)                  | [Voir](screenshots/broadcast-neon/regie-preparation-mobile.png) |
| Régie mobile, discussion   | [5A](screenshots/5a/regie-mobile.png)                  | [Voir](screenshots/broadcast-neon/regie-discussion-mobile.png)  |
| Confirmation mobile        | Fenêtre système observée sur l’iPhone de l’utilisateur | [Voir](screenshots/broadcast-neon/confirmation-mobile.png)      |
| Erreur de confirmation     | —                                                      | [Voir](screenshots/broadcast-neon/erreur-mobile.png)            |
| Joueur mobile              | [5A](screenshots/5a/joueur-mobile.png)                 | [Voir](screenshots/broadcast-neon/joueur-mobile.png)            |
| Laboratoire mobile         | [5A](screenshots/5a/laboratoire-mobile.png)            | [Voir](screenshots/broadcast-neon/laboratoire-mobile.png)       |
| Plateau final 1920 × 1080  | [5A](screenshots/5a/plateau-final-1920.png)            | [Voir](screenshots/broadcast-neon/plateau-1920.png)             |
| Régie ordinateur           | [5A](screenshots/5a/regie-desktop.png)                 | [Voir](screenshots/broadcast-neon/regie-desktop.png)            |
| Studio ordinateur          | [4B.1](screenshots/4b1/accueil-desktop.png)            | [Voir](screenshots/broadcast-neon/studio-desktop.png)           |
| Confirmation ordinateur    | —                                                      | [Voir](screenshots/broadcast-neon/confirmation-desktop.png)     |

### Limites connues

- Pas de test physique iPhone/Safari iOS, VoiceOver ou OBS pendant cette livraison.
- Le navigateur doit être récent ; les styles utilisent notamment `color-mix` et
  les dialogues modaux HTML. Safari 16.4+ est la cible, à vérifier sur appareil réel.
- Pas de certification WCAG complète : les contrastes, noms et parcours clavier
  testés ne couvrent pas toutes les configurations de contenu, zoom et assistance.
- La régie bureau conserve plusieurs sections simultanées ; la navigation par
  contenu unique s’applique aux parties sur mobile/tablette. Les salons avant jeu
  gardent leurs contrôles existants.
- Les notifications sont locales à chaque navigateur. Les erreurs importantes
  restent intégrées dans la page ; une réponse incertaine utilise les reçus existants.
- La palette ne rend pas les jeux futurs jouables. Enchères, Qui est l’espion,
  l’éditeur d’overlays et le Store n’ont pas été développés dans ce jalon.

**Statut humain :** une première exploration iPhone du Studio et une utilisation
d’Undercover ont fourni les problèmes traités ici. Cette version Broadcast Neon,
VoiceOver, Safari iOS physique et OBS réel restent à valider. Aucun test automatisé
ne valide à votre place l’ergonomie, le plaisir ou le rythme d’une émission.
