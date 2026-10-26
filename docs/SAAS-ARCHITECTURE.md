# Préparation SaaS — décisions et frontières, sans infrastructure fictive

## Présent vérifiable

Une API de catalogue fermé et un lancement officiel indépendant du Studio sont actifs.
Aucun service d’abonnement inutilisé n’est ajouté. Les seules permissions exécutées sont
les capacités de session existantes. SQLite / SSE sur un processus Node, aucune identité
civile vérifiée, jetons sans expiration automatique, absence de récupération de compte :
l’application demeure un prototype privé, pas une plateforme ouverte prête à facturer.

## Identité et propriété cibles

Choisir un fournisseur d’identité après évaluation : récupération vérifiée, passkeys ou
mots de passe correctement hachés, MFA pour les comptes administratifs, révocation,
export/suppression, coût et résidence des données. Aucun choix de fournisseur validé.
Le serveur devra dériver userId d’une session authentifiée (cookie HttpOnly, Secure,
SameSite, rotation et CSRF appropriés), jamais d’un rôle ou userId du navigateur.

Modèle à migrer de manière additive, pas tables factices créées maintenant :

| Entité cible                   | Responsabilité et invariants                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| User                           | Identifiant stable, identité vérifiée, récupération et statut                                                                       |
| DeviceSession                  | Empreinte du secret/refresh, utilisateur, création, dernière activité, expiration et révocation ; liste d’appareils consultable     |
| SavedGameSettings              | Propriétaire, jeu officiel/version de paramètres, réglages privés validés, révision concurrente, dates ; aucun code exécutable      |
| GameSession ownership          | userId propriétaire facultatif pendant migration, version officielle figée, origine démonstration/réelle, politique de conservation |
| SessionGrant                   | Rôle GM/joueur, partie, expiration/révocation ; aucun champ de compte n’accorde un rôle joueur tiers                                |
| Entitlement snapshot           | Jeux, fonctions et plafonds autorisés, statut/validité ; calcul serveur à partir de données fiables                                 |
| Subscription / billing receipt | Référence fournisseur, statut vérifié, échéances, identifiants d’événements dédupliqués ; ultérieur                                 |

Les invités conservent des accès individuels sans compte. Les spectateurs lisent seulement
le plateau rendu public par le GM. L’identité de compte n’autorise pas une projection
joueur quelconque. Une réauthentification récente protège les changements de sécurité.
Révoquer un appareil coupe aussi les flux SSE concernés ; prévoir expiration serveur,
renouvellement et récupération sans publier des liens GM dans les journaux.

## Migration des capacités existantes

1. Sauvegarde cohérente SQLite (API de backup/checkpoint maîtrisé, pas copie à chaud du seul
   fichier en oubliant WAL) et test de restauration sur environnement séparé.
2. Ajout de propriétaire nullable et nouvelles tables d’identité, sans réécrire GameRun.
3. Rattachement volontaire d’une ancienne session après compte authentifié **et** preuve
   de capacité GM valide ; transaction unique, audit sans secret et protection contre
   rattachement concurrent. Le nom d’hôte ne constitue jamais une preuve de propriété.
4. Récupération accompagnée des anciennes bibliothèques ; leurs définitions ne sont pas
   automatiquement autorisées au catalogue. Migrer éventuellement des paramètres compatibles
   après validation et consentement, conserver l’archive et les versions originales.
5. Politique explicite pour données non réclamées, expiration et suppression. Pas de
   revendication publique par identifiant de session, pas de migration destructrice implicite.

## Droits et paywall futurs

Le serveur devra résoudre les droits avant catalogue personnalisé, création de partie,
enregistrement de réglages et fonctions premium. Un client affiche la décision mais
ne l’établit pas. La configuration officielle reste validée même si l’abonnement est valide.

| État à décider         | Politique à spécifier avant commercialisation                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Découverte sans compte | Fiches publiques et démo bornée ; aucune capacité d’administration globale                      |
| Essai                  | Jeux, durée, quotas et preuve de début d’essai vérifiés serveur ; pas d’essai public décidé ici |
| Actif                  | Catalogue et fonctions du plan ; limites de parties simultanées et participants                 |
| Impayé / grâce         | Délai explicite, information utilisateur et non-interruption brutale d’un live à décider        |
| Expiré / résilié       | Refus de nouvelles opérations payantes ; accès aux données/récupération selon politique         |
| Compte suspendu        | Révocation et procédure support, protection des invités et des données                          |

Les noms/prix/plafonds des plans ne sont pas fixés. Avant facturation : événements
signés, état serveur faisant foi, rejeux idempotents, concordance utilisateur/produit,
tests impayés/remboursements/résiliations et séparation test/production. Pas de paiement
ou Bits réel dans ce jalon. Ne pas appeler « paywall » un simple bouton masqué React.

## Routes et site vitrine

Conserver `/play`, `/sessions`, `/join` et les URL publiques de plateau. Le futur
site vitrine pourra occuper `/` tandis que l’accueil client sera déplacé vers `/app`,
avec redirections explicites ; ce déplacement n’est pas effectué maintenant.
Prévoir `/games`, `/pricing`, `/signup`, `/login`, `/account`, `/support`, `/legal`
sans pages factices ni boutons d’inscription inopérants à cette livraison.
Les routes publiques n’exposeront ni configurations privées ni historique client.

## Exploitation et portes de lancement

- **Hébergement** : processus Node persistant supportant SQLite et SSE, volumes durables,
  TLS, relais sans buffering SSE, connexions et délais adaptés. Pas de déploiement
  serverless multi-instance naïf. Le choix de fournisseur et de région reste ouvert.
- **Base** : un seul écrivain/diffuseur actuel ; surveiller disque, WAL et temps de transaction.
  Avant plusieurs instances : base partagée et diffusion interprocessus, tests de concurrence
  et migrations. Ne pas promettre la haute disponibilité du socle actuel.
- **Secrets** : stockage dédié par environnement, rotation, aucun secret NEXT_PUBLIC,
  aucun accès/token dans logs, traces, screenshots ou URL de requête.
- **Sauvegardes** : chiffrement, accès restreint, rétention définie ; exercice de restauration
  incluant accès/reçus. Objectifs RPO/RTO à fixer et mesurer avant bêta facturée.
- **Observabilité** : corrélation par identifiant non secret, erreurs et latences, connexions
  SSE, mémoire/disque, commande refusée, alerte de saturation ; données personnelles minimisées.
- **Abus** : conserver limites origine/débit/taille ; quotas par compte/IP, inscriptions et
  récupération protégées, protection DDoS adaptée à l’hébergement, politique de signalement.
  Aujourd’hui le relais Next fait voir son adresse au serveur Node : le quota réseau
  est partagé par les requêtes relayées. Avant une ouverture publique, définir les
  proxies de confiance et l’identité de débit sans accepter un X-Forwarded-For arbitraire.
- **Incidents** : responsable, support, détection, procédure de révocation, communication et
  restauration ; journal d’administration séparé des événements publics du jeu.
- **Déploiements** : CI, environnement de staging isolé, migrations compatibles, sauvegarde,
  retour arrière du code sans corruption des états, drain/reconnexion SSE et smoke tests.
- **Conformité** : CGU/CGV, confidentialité, rétractation/abonnements applicables, sous-traitants,
  durée de conservation et droits des personnes à faire valider ; le stockage externe des
  médias ne supprime pas les obligations. Aucun avis juridique définitif simulé.

Aucun hébergement payant ni serveur de développement ouvert sur Internet. Les essais
locaux utilisent dev:lan ; un cloud distant nécessite HTTPS et contrôle d’accès réels.
