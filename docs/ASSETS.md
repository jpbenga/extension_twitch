# Assets — Bring Your Own Storage

Une définition utilise un identifiant logique (ex. `backdrop`). Une configuration
associe éventuellement cet identifiant à une référence fournisseur. Les médias ne
sont jamais stockés dans SQLite, transférés ni récupérés par ce socle. Le navigateur
n’effectue pas non plus de téléchargement automatique : toutes les références ont
un affichage de remplacement dans cette livraison.

| Source                     | Compromis et accès futur                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fichier navigateur OBS     | Pas de transfert serveur. Autorisation propre à cet appareil ; après rechargement, nouvelle sélection possible. Aucun chemin fichier n’est partagé aux joueurs. La persistance des permissions n’est pas garantie.                                     |
| HTTPS public               | Dépend du fournisseur, de CORS, de la disponibilité et des droits. V1 refuse identifiants, query/hash, adresses locales et formats actifs ; aucune requête serveur. Un futur résolveur devra revalider DNS/redirections et réseaux privés contre SSRF. |
| Connecteur cloud personnel | Référence opaque seulement. OAuth et accès délégué non implémentés. Les jetons et URLs signées restent côté serveur/coffre approprié, jamais dans une projection publique. Un fichier privé n’est pas automatiquement partageable.                     |
| Stockage géré éventuel     | Fonctionnalité future avec consentement explicite, quotas, coût, suppression et politique d’accès. Aucun engagement de mise à disposition dans ce lot.                                                                                                 |

Les métadonnées comprennent identifiant logique, type, fournisseur, référence, usage,
visibilité, taille/format facultatifs, disponibilité et politique d’accès. Une
référence requiert une déclaration de droits. Dans ce lot, toutes les références
importées sont utilisateur ; aucune origine officielle déclarée par un client
n’est acceptée. Les références peuvent être désactivées
ou supprimées de la configuration (pour ce socle : nouvelle configuration après
réinitialisation). Un asset désactivé ne peut être résolu. Les assets officiels seront
issus d’un catalogue serveur contrôlé ; un utilisateur ne peut pas déclarer le sien
« officiel ». La projection actuelle ne contient que l’identifiant logique, son type,
son libellé de remplacement et son état, jamais la référence de stockage.

Les liens HTTPS ne sont pas une autorisation de proxy. Le type MIME déclaré n’est
pas une preuve du contenu : tout futur téléchargement devra vérifier octets, taille,
redirections et type réel. SVG/HTML, scripts, CSS et URL data/javascript sont refusés.
Le lecteur futur devra limiter les origines et isoler les contenus actifs ; aucune
évaluation de code dans le serveur ou l’overlay.

Le stockage externe ne supprime pas les obligations juridiques de la plateforme.
Avant ouverture publique : signalements, traçabilité, désactivation rapide des
références, procédure de retrait, conditions d’utilisation et gestion des droits.
Aucun contournement d’accès tiers ni bibliothèque d’images protégées n’est fourni.

## Variantes et publications 4A

La bibliothèque conserve un manifest distinct de la définition et de l’état de
session. Publication privée et duplication ne copient les références que si
l’emplacement est public, la référence HTTPS publique/active et la redistribution
explicitement autorisée. Les autres références sont retirées avec une raison de
remplacement ; attribution et droits sont conservés. Le brouillon original peut
garder ses références privées, sans les exposer dans un manifest d’export.
Le manifest d’export est une liste blanche sans définition brute, paramètres
privés ni références de stockage ; il n’est pas un export complet réimportable.

Un futur registre de révocation/modération devra pouvoir désactiver une publication
ou une dépendance au moment de sa résolution, sans réécrire une version immuable.
Ce registre et le signalement ne sont pas actifs ; aucun média n’est résolu ici.
Le stockage externe ne dispense pas du traitement des droits et signalements.
