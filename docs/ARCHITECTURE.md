# Architecture — socle technique

Statut : choix techniques validés par le porteur du projet. Implémentation limitée aux étapes 1 et 2 du plan initial.

## Choix validés

- TypeScript strict, npm workspaces et Node.js 24 LTS. Aucun orchestrateur de monorepo supplémentaire.
- Next.js / React pour une régie unique responsive et les routes d’aperçu overlay et joueur.
- Un processus serveur Node.js distinct pour le futur état autoritaire et les connexions persistantes.
- Un moteur indépendant des composants visuels ; trois modules autonomes, sans dépendances entre jeux.
- SQLite pour le développement initial, derrière un contrat de dépôt permettant une migration ultérieure.

Les options de persistance de production, d’authentification et d’hébergement ne sont pas décidées.

## Dépendances et frontières

```text
web ────────────────> contracts + descripteurs publics des jeux
  │ HTTP / SSE (via un relais Next.js de même origine)
  ▼
server ─────────────> contracts
  │ à connecter en étape 3
  ▼
engine <──────────── modules de règles indépendants (à implémenter)
  │ contrat SessionRepository
  ▼
adaptateur SQLite (à implémenter)
```

`contracts` contient Zod pour valider les données aux frontières. Le transport utilise les primitives HTTP Node.js : pas de framework serveur supplémentaire pour deux routes de sonde. SSE prépare la diffusion serveur → interfaces ; les futures commandes emprunteront HTTP. Le protocole de synchronisation des sessions reste à implémenter. SSE ne remplace pas le futur contrôle d’accès.

Les packages de jeu n’exposent aujourd’hui que leurs descripteurs. Lorsque des règles et états privés y seront ajoutés, conserver une entrée publique séparée pour les métadonnées ; ne pas importer de code contenant des secrets dans les composants clients. `engine` est destiné au serveur uniquement et n’est pas une dépendance de l’application web.

Le compilateur produit les packages et le serveur dans `dist`. Next.js compile ensuite l’application. `npm run dev` reconstruit les packages avant le lancement et surveille leurs sources. Une modification des contrats peut nécessiter une reconnexion ou un redémarrage du serveur pendant le développement.

## Contrats préparés, sans moteur exécuté

- `CommandEnvelope` : identifiant de commande, session, version attendue et jeu. L’enveloppe n’attribue aucun rôle ; l’identité viendra de l’authentification serveur.
- `GameModule` : configuration, décision, réduction des événements et projections. Aucun module concret ne l’implémente tant que les règles ne sont pas définies.
- `SessionRepository` : chargement et validation atomique d’une écriture avec détection des conflits et doublons. Aucun fichier SQLite n’est créé en étapes 1 et 2.
- DTO de démonstration public strict : participants fictifs uniquement. Le serveur devra construire chaque projection autorisée ; l’interface ne filtrera pas un état privé reçu par erreur.
- `SpectatorRequest` : simulation et interactions gratuites. Ce contrat ne reçoit aucune preuve d’achat.
- `InteractionPolicy` : activation GM, effet cosmétique ou gameplay, limites, délai, approbation et référence produit Twitch pour un futur tarif Bits. Aucun catalogue ni prix n’est validé.
- `VerifiedBitsReceipt` : frontière typée serveur, sans constructeur ni adaptateur actif. Le typage ne constitue pas une preuve cryptographique. La vérification réelle devra authentifier le reçu et vérifier canal, produit, validité et unicité.

L’étape 3 devra traiter les commandes séquentiellement par session, sauvegarder état et événements atomiquement et diffuser uniquement après validation. Une transaction externe devra être enregistrée avec son effet dans la même transaction de base de données. Ces garanties ne sont pas annoncées comme opérationnelles dans ce socle.

## Démonstration et identité visuelle

Une seule régie pour les trois tailles d’écran : navigation latérale sur ordinateur et tablette, en-tête compact sur téléphone. Palette sombre, accents violet, ambre et menthe, motifs de plateau et illustrations SVG originales. Aucune image protégée, police distante ou ressource payante.

Les interactions actuelles sont limitées au choix local d’un aperçu. Les fonctions non disponibles sont indiquées comme futures ; aucun démarrage de partie fictivement réussi. L’overlay ne contient pas de contrôles interactifs ni d’informations secrètes. Il conserve le ratio 16:9 et dispose d’une variante transparente. Les participants affichés sont des fixtures publiques, sans rôles.

La régie affiche l’état réel du transport SSE et sa reconnexion automatique. `Cache-Control: no-transform` évite que la compression d’un relais retarde les événements. Un futur déploiement devra aussi désactiver la mise en tampon SSE et adapter les délais de connexion.

## Hors périmètre et décisions ouvertes

L’étape 3 n’est pas commencée : aucune session autoritaire, commande métier, reprise de partie ou persistance SQLite effective. La PWA, les comptes, l’import de contenus et la véritable extension Twitch sont ultérieurs.

Avant les règles : définir les phases, égalités, victoires, modalités de vote, différences entre Undercover et espion, clôture et annulation des enchères. La règle déjà validée demeure : une enchère proposée ne débite rien, l’attribution confirmée seule déclenche le débit.

Avant les intégrations : définir les permissions GM/streamer, invitations, remise confidentielle des informations en mode animé, actions annulables, catalogue d’interactions, règles Twitch applicables et équilibrage. Les paiements réels nécessitent une demande explicite et une validation de conception.
