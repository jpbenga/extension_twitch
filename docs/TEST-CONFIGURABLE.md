# Tester le socle configurable et le laboratoire

**Validation technique terminée — Validation humaine iPhone en attente.**
Les formats Chromium téléphone/tablette/desktop sont des tests automatisés, pas un
essai Safari iOS, OBS ou appareil physique. Le retour humain reste nécessaire.

## Lancer et retrouver les liens

Prérequis : Node.js 24, npm 11, ordinateur macOS/Linux et iPhone sur le même Wi-Fi
privé. Dans ce dépôt, branche `feat/configurable-game-foundation` :

```sh
npm ci
npm run dev:lan
```

Ouvrir sur l’iPhone **l’adresse réseau affichée**, puis ajouter `/lab` au chemin.
Aucune adresse `localhost` ne doit être partagée entre appareils. En cas de plusieurs
interfaces, choisir votre IP Wi-Fi :

```sh
PUBLIC_ORIGIN=http://192.168.1.42:3000 npm run dev:lan
```

L’adresse ci-dessus est un exemple à remplacer. Le [guide réseau](TEST-IPHONE.md)
explique pare-feu, Wi-Fi invité, sauvegarde et hébergement distant HTTPS protégé.
Ce conteneur cloud ne fournit pas de prévisualisation publique utilisable et aucun
serveur n’est ouvert sur Internet par cette livraison.

Dans `/lab`, choisir un exemple et toucher **Créer une démonstration réelle**.
Le navigateur crée une session, inscrit « Fictif · Nova » et « Fictif · Atlas », puis
installe la définition via les contrats du produit. Les liens directs GM, chaque
joueur et plateau apparaissent. Le laboratoire garde leurs capacités en mémoire,
seulement dans cet onglet : il a donc accès aux deux identités. Ne pas partager
cet onglet ni copier tous ses liens vers un spectateur. Chacun ouvre uniquement
son lien privé. Les interfaces normales isolent les capacités par session/identité
et onglet. Recharger le laboratoire efface ses liens, pas la session en base.
Conserver les liens privés depuis la régie/compagnon si une récupération est voulue.

Le plateau public est accessible sans jeton et utilisable comme source navigateur
OBS. Il contient les seules valeurs publiques, jamais le panneau de gestion du GM.
En développement, le lien laboratoire apparaît aussi sur l’accueil. En production
(`npm start` après `npm run build`), `/lab` renvoie 404 :
aucune API de simulation ni élévation de permission n’existe.

## Checklist 1 — Compteur collectif

**Préconditions :** démonstration « Impulsion collective » créée ; ouvrir les quatre
liens. Les joueurs fictifs sont déjà inscrits. Pour de vraies inscriptions, créer
une session normale sur `/`, inviter les deux personnes puis installer l’exemple
via la section Jeu du GM. Après installation, l’effectif est figé.

- [ ] **iPhone GM :** ouvrir la régie, vérifier « Préparation », toucher **Ouvrir la collecte**.
- [ ] **Deuxième navigateur / Nova :** saisir 2 dans « Points (1 à 3) », toucher **Contribuer**.
- [ ] **GM et spectateur :** constater le compteur à 2 sans recharger. Le bouton de contribution disparaît uniquement chez Nova.
- [ ] **Atlas :** contribuer avec 3 ; le compteur commun devient 5.
- [ ] **Laboratoire :** toucher **Tester une action interdite** ; constater le refus serveur 403, le titre reste intact.
- [ ] **GM :** toucher **Terminer la collecte**, confirmer ; toutes les vues passent à « Terminé ».
- [ ] **GM :** **Rejouer cette expérience**, confirmer ; même session, joueurs conservés, compteur à 0 et phase Préparation.

**Attendu joueur :** une seule contribution par partie, paramètres bornés, aucun
bouton GM. **Attendu spectateur :** compteur et phases, pas de marqueurs personnels
« contribution envoyée ». Le fond affiche un remplacement : aucun média chargé.

**Appréciation humaine :** accès aux commandes depuis le raccourci inférieur,
clavier numérique, lisibilité des phases, retours de chargement, orientation portrait,
absence de débordement et fluidité perçue entre appareils.

## Checklist 2 — Réponses privées et rôle personnalisé

**Préconditions :** créer une nouvelle démonstration « La boîte à réponses ».
Ouvrir GM, Nova, Atlas et public ; ne pas réutiliser les anciens liens d’une autre session.

- [ ] **iPhone GM :** dans **Affecter les rôles des joueurs**, attribuer **Relecteur** à Atlas.
- [ ] **GM :** toucher **Demander un souvenir de live**.
- [ ] **Nova :** saisir une phrase identifiable et toucher **Envoyer ma réponse**.
- [ ] **GM :** la phrase apparaît dans les informations privées, mais pas dans l’aperçu du plateau.
- [ ] **Atlas et spectateur :** constater « Réponse reçue : Oui » pour Nova ; la phrase n’apparaît jamais. Atlas n’a pas le bouton d’envoi.
- [ ] **GM :** toucher **Passer en relecture**. La révélation n’est pas disponible avant la confirmation du relecteur.
- [ ] **Atlas :** **Confirmer la relecture**. Il vérifie les statuts reçus, sans accès aux réponses privées.
- [ ] **GM :** **Révéler les réponses**, confirmer. La phrase devient publique dans toutes les vues.
- [ ] **Spectateur :** recharger ; la phase et la révélation sont conservées.

**Attendu GM :** commande de révélation disponible seulement après la confirmation.
**Attendu joueur :** sa propre réponse privée avant révélation. **Attendu public :**
réponses uniquement après l’action GM. Ce jeu n’applique pas de score ni de victoire.

**Appréciation humaine :** compréhension des rôles et du caractère privé/public,
clarté de la confirmation, nombre de gestes et emplacement des informations.

## Checklist 3 — Incident et remise à zéro

- [ ] Conserver les liens privés, arrêter avec `Ctrl+C`, relancer la même commande avec la même base et adresse.
- [ ] Les clients se reconnectent avec phase, valeurs et identités conservées. Aucun effet n’est rejoué ; une commande incertaine se reprend par **Réessayer la commande**.
- [ ] Depuis le GM, **Réinitialiser le salon**, confirmer : définition et joueurs disparaissent, accès joueurs révoqués, invitation renouvelée, GM et lien public conservés.
- [ ] Inviter de nouvelles personnes ou recréer une démonstration depuis `/lab`.

**Appréciation humaine :** comportement de Safari en arrière-plan, compréhension des
erreurs et de la récupération. Remonter navigateur, taille, étape, résultat observé
et résultat attendu ; ne pas joindre un lien privé ou une base contenant des données réelles.

## Effectif, portée et suites

La définition installée est une copie versionnée. Changer le catalogue ne modifie
pas les parties existantes. Rejouer remet également les rôles personnalisés à leur
valeur par défaut. Une nouvelle définition demande une réinitialisation du salon.

Livré : interpréteur, contrôle serveur, rôles personnalisés joueur, paramètres bornés,
transitions, confidentialité, révélation, persistance et interfaces génériques.
Schémas seulement : canevas/widgets et références d’assets BYOS. Aucun éditeur de
scènes, rendu de média, connecteur cloud, script utilisateur, jeu Undercover complet,
paiement ou connexion Twitch. Les exemples sont pédagogiques, leurs règles ne
constituent pas des décisions sur Undercover, Enchères ou Qui est l’espion.

Suites recommandées : retours ergonomiques ; primitives de vote/distribution après
choix des règles ; Undercover déclaratif ; puis édition sans code et rendu de scènes.
Les équipes, chronomètres, interactions Twitch et migrations restent à concevoir.
