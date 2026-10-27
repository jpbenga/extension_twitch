# Aperçu d’émission et source OBS — addendum du jalon 6

Base vérifiée : `e3c83be`, branche propre `feat/product-focus-saas`, identique à la
branche distante et descendante des travaux Undercover et Broadcast Neon.
Travail : `feat/stream-preview-obs`.

## Périmètre réel

L’aperçu est une scène fictive de régie avec le véritable overlay synchronisé.
Il n’émet et ne lit aucun flux Twitch. Pas de compte Twitch, Bits, vidéo distante,
éditeur de scènes, upload de médias ou paiement. Undercover est le seul jeu jouable ;
aucune enchère ni mécanique d’espion n’est inventée pour remplir le simulateur.
Le rendu sait afficher des valeurs publiques mais cela ne livre pas ces jeux.

## Une seule source de rendu

```text
Serveur autoritaire → projection publique → HTTP/SSE authentification publique
                                               │
                             useSession(id, "public")
                                               │
                                         BroadcastFeed
                                               │
                                       BroadcastOverlay
                             ┌─────────────────┼────────────────┐
                      /sessions/:id/stream   :id/obs       comparatif du labo
                      scène + contrôles     transparent    scène + joueur séparé
```

Les trois surfaces montent le même `BroadcastFeed` / `BroadcastOverlay`. L’aperçu
ajoute un décor fictif ou un damier de contrôle ; ces éléments ne font pas partie
de la source OBS. Aucun iframe ne récupère des secrets ni ne partage une projection
GM. Chaque surface ouvre son propre flux public sans Bearer, conformément à la
politique d’observation existante. Le rendu reçoit uniquement PublicSessionView ;
aucun état complet ni donnée filtrée par React à partir de secrets.

L’ancien `/sessions/:id/public` reste le plateau public classique, pour préserver
ses liens et les anciens parcours. `/overlay` reste une maquette historique ; ce
n’est pas la nouvelle source réelle. La nouvelle source est `/sessions/:id/obs`.

## Affichage

Cadre strictement 16:9, dimensions de référence 1920×1080. Les unités de conteneur
mettent à l’échelle typographie et panneaux dans le même rapport. Fond transparent
hors des panneaux ; leur fond sombre conserve la lisibilité sur vidéo. En cas de
viewport différent, la source est centrée dans un espace transparent sans déformation.

Affichage public : titre, phase, manche, actifs/éliminés, tours d’indices et passage
courant, statut et progression des votes, décompte, élimination/égalité, victoire,
valeurs réellement révélées et trois événements publics récents de la partie courante. Aucun bouton de
commande dans OBS. Les noms et valeurs très longs peuvent être tronqués visuellement
pour tenir dans le cadre ; les données complètes restent dans le plateau classique.
La miniature mobile respecte le cadrage de diffusion : le contrôle détaillé des
petits textes est plus confortable sur ordinateur et dans OBS en 1920×1080.

## Synchronisation et animations

Une transition, un vote ou un résultat accepté par le serveur produit un nouvel état
et un événement public versionné. Le curseur `nextPublicCue` anime uniquement le
dernier événement correspondant à une version nouvelle, pas tout le journal. Les
mises à jour de présence, qui gardent la même version, ne redéclenchent pas l’effet.
Un refus serveur ne crée pas d’événement de jeu et n’est pas inventé dans le plateau.

`useSession.streamEpoch` identifie chaque connexion SSE effective. Son premier
instantané définit une référence sans animation, même si la partie est déjà finie.
Une coupure efface immédiatement l’effet temporaire une fois détectée ; la reconnexion
restaure l’état courant et redéfinit la référence. Aucun ancien résultat ni vote
n’est rejoué comme une action nouvelle. Les effets expirent après 2,6 secondes,
se remplacent au prochain événement et respectent prefers-reduced-motion.
L’état durable et le journal restent visibles après cette expiration.

Rejouer efface le résultat et les anciennes valeurs de la projection serveur ;
le plateau revient en préparation. Le journal à l’antenne commence au nouveau rejeu,
sans effacer l’historique conservé par le serveur. Un effet « réinitialisée » peut accompagner la
vraie commande, puis disparaît. Pas d’effet de victoire conservé artificiellement.
La reconnexion reste celle du transport existant : délais bornés, instantané récent,
pas de répétition des mutations. Le transport vérifie également l’identifiant de
session de chaque projection pour éviter un mélange entre connexions.

## Spectateurs : trois frontières distinctes

1. **Affichage public** : opérationnel et synchronisé, pas un droit de commande.
2. **Interface de test spectateur** : panneau dans l’aperçu et dans la perspective
   Spectateur du labo ; il lit les capacités réellement exposées par le serveur.
3. **Twitch natif** : non connecté. Aucun vote, achat Bits, récompense ou chat simulé
   présenté comme une intégration opérationnelle.

`GET /sessions/:id/spectator-interactions` vérifie que la session publique existe,
puis renvoie le contrat versionné `spectatorCapabilitiesSchema` : lecture seule,
actions vides et Twitch non connecté. Ce n’est pas une préférence frontend : les
schémas de définition v1/v2/v3 interdisent déjà les actions de rôle spectateur.
Aucun endpoint POST ne donne une autorité GM à un spectateur. Le panneau ne propose
pas de commandes fictives ou désactivées laissant croire à une fonction livrée.

L’abstraction existante `SpectatorRequest` distingue demande de démo et interaction
gratuite Twitch ; `ExternalInteraction` et `VerifiedBitsReceipt` séparent événements
externes et reçu serveur futur. Le nouveau contrat de découverte est la frontière
consommée dès maintenant par l’interface. Il n’existe pas encore de dispatcher actif.

Pour autoriser ultérieurement une interaction : déclarer une liaison serveur entre
interaction et commande permise, authentifier la source et l’identité, vérifier jeu,
phase, politique GM, quotas et identifiant d’idempotence, puis passer par la transaction
du moteur. Le navigateur ne choisira ni le rôle ni une commande GM à exécuter. Twitch
exigera une validation d’authenticité de l’événement ; les Bits exigeront en plus un
reçu vérifié et un effet atomique unique. Ces garanties ne sont pas simulées ici.

## Laboratoire et accès

- « Aperçu de l’émission » ouvre une page publique dédiée, sans transmettre de jeton GM.
- « Source OBS transparente » ouvre la source seule.
- Le comparatif ordinateur réutilise le même rendu de diffusion et conserve le joueur
  sélectionné dans son contexte privé distinct. Mobile : une perspective à la fois.
- Les invitations réelles et les liens privés restent séparés des liens d’observation.
  Copier le lien GM pour l’iPhone, garder le sélecteur des joueurs sur l’ordinateur.
- Le plateau, l’aperçu et OBS ne peuvent pas usurper un joueur : ils n’ont ni son
  accès individuel ni une permission de simulation sur le serveur.

Aucune nouvelle dépendance, table SQLite, migration, identité publique, récupération
de compte, API d’usurpation ou hébergement payant. Les versions et sessions antérieures
restent utilisables. Guide humain : [TEST-STREAM-PREVIEW.md](TEST-STREAM-PREVIEW.md).

## Validation

Les tests et captures de livraison sont consignés à la fin du document après exécution.
Les tests Chromium et du moteur ne constituent pas une validation iPhone physique,
Safari iOS, OBS réel ou du rythme d’une émission.

## Résultats de livraison

Environnement : Node 24.19.0, npm 11.9.0 et Chromium système `/usr/bin/chromium`.
Aucune permission, limite anti-abus ou validation de commande n’est retirée pour les tests.

| Commande              | Résultat exécuté                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run check`       | Format, **138 tests** unitaires/intégration (18 fichiers), TypeScript strict et compilation réussis |
| `npm run test:stream` | **9 réussis** : 3 scénarios × ordinateur, tablette, téléphone                                       |
| `npm run test:e2e`    | **42 réussis**, parcours produit et sessions conservés                                              |
| `npm run test:games`  | **12 réussis**, parties Undercover existantes conservées                                            |
| `npm run test:design` | **12 réussis**, dialogues/focus/erreurs et responsive conservés                                     |
| `npm run test:legacy` | **60 réussis**, compatibilité locale de l’ancien Studio conservée                                   |
| `npm run test:lab`    | **6 réussis**, développement, dialogues et véritables commandes                                     |

Total : **141 cas navigateur**, dont 75 produit compilé et 66 compatibilité/développement.
Les anciens 127 tests métier sont conservés ; 11 nouveaux contrôlent le curseur,
la déduplication, les changements de connexion, la portée du journal et les droits
spectateur. Un passage ciblé supplémentaire vérifie le comparatif avec Joueur 1
sélectionné ; il ne compte pas comme un nouveau cas unique.

Le scénario complet utilise des contextes distincts GM (390×844 tactile), trois
joueurs, aperçu, OBS et ouverture tardive. Les actions sont de vraies commandes UI.
Il vérifie les deux tours, votes, victoire, révélation, rejeu et égalité du HTML durable
des deux overlays. Les accès publics ne sollicitent aucun endpoint privé/de commande ;
la réponse publique brute ne contient ni mots avant révélation, préparation, invitation
ni gestion privée. Le scénario de coupure interrompt seulement le vrai transport dans
un contexte de test : le GM continue sur le serveur réel, puis le flux récupère l’état
courant sans effets historiques. Pas de résultat de jeu fabriqué dans le navigateur.

La source est vérifiée en **1920×1080**, sans contrôle interactif, avec fonds html/body
transparents. Les captures PNG sont RGBA, alpha nul dans les espaces hors panneaux.
Le mode mouvement réduit, l’expiration des effets, la miniature 16:9, l’absence de
débordement et douze participants sont contrôlés. Le cas à douze joueurs vérifie la
préparation et le cadrage, pas une deuxième partie complète à douze. La partie complète
nouvelle utilise trois joueurs ; les suites existantes couvrent aussi plusieurs manches.

L’Overlay classique reste compatible. Aucun OBS physique, Safari iOS/VoiceOver réel ou
iPhone physique n’est testé ici. Le plaisir, le rythme, le cadrage sur la scène réelle
et la lisibilité sur l’encodage Twitch restent à valider humainement. Le workflow CI
inclut la nouvelle suite, sans revendiquer une exécution distante. Les outils Next.js
restent visibles en développement ; le guide explique l’essai compilé sans ces outils,
sans cacher artificiellement des erreurs.

## Captures Chromium

Données fictives uniquement, aucune capacité privée affichée :

- [Aperçu ordinateur](screenshots/stream-preview/apercu-desktop.png).
- [Aperçu téléphone](screenshots/stream-preview/apercu-mobile.png).
- [Source OBS transparente 1920×1080](screenshots/stream-preview/obs-transparent-1920.png).
- [Joueur et émission côte à côte](screenshots/stream-preview/comparatif-desktop.png).
- [Douze participants dans le cadre](screenshots/stream-preview/douze-joueurs.png).

Ces images montrent un navigateur, pas une capture OBS ou un iPhone physique.

## Retour humain ultérieur — jalon 7

Après la livraison technique ci-dessus, le testeur a confirmé un premier parcours
réussi de bout en bout avec OBS réel et a validé le workflow et le guide de scène.
Ce retour ne vaut pas validation exhaustive de Safari, VoiceOver, de tous les
effectifs ou des nouveaux layouts. La personnalisation ciblée Undercover ajoute
un champ public de session sans changer les principes du rendu partagé : voir
[UNDERCOVER-LAYOUT.md](UNDERCOVER-LAYOUT.md).
