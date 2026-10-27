# Undercover — formats disponibles et règles actives

Le jalon 7 se concentre uniquement sur Undercover. La définition serveur reste
**0.2.0** : aucun changement silencieux des règles des parties déjà créées.
Le testeur a confirmé dans la conversation un premier parcours complet réussi,
avec OBS réel et le guide d’installation. Ce retour valide ce workflow observé ;
il ne valide pas chaque répartition, chaque appareil ni les nouveaux layouts.

## Un format, plusieurs répartitions autorisées

Le format disponible utilise deux mots proches, une distribution aléatoire privée,
des indices oraux et une élimination au vote. Deux camps seulement : civils et
Undercover. Un joueur connaît son mot, pas son camp avant la révélation autorisée.
Le GM peut consulter la gestion privée. Aucun rôle blanc, attribution manuelle,
revote de départage, abstention ou minuteur n’est livré.

Le nombre d’Undercover peut varier. Il s’agit de configurations du même format,
pas de nouveaux jeux ou de règles supplémentaires officiellement approuvées.

| Joueurs inscrits | Undercover autorisés | Civils correspondants |
| ---------------- | -------------------- | --------------------- |
| 3                | 1                    | 2                     |
| 4                | 1                    | 3                     |
| 5                | 1–2                  | 4–3                   |
| 6                | 1–2                  | 5–4                   |
| 7                | 1–3                  | 6–4                   |
| 8                | 1–3                  | 7–5                   |
| 9                | 1–4                  | 8–5                   |
| 10               | 1–4                  | 9–6                   |
| 11               | 1–5                  | 10–6                  |
| 12               | 1–5                  | 11–7                  |

Les Undercover doivent être **strictement moins nombreux que les civils** au départ.
Le maximum est `min(5, floor((effectif−1)/2))`. La préparation affiche la répartition
prévue et ses limites. Avec de vrais invités, l’effectif réel est contrôlé par le
moteur lors de la préparation ; le nombre utilisé pour prévisualiser les cartes
n’inscrit personne. Le serveur reste seul responsable des règles.

## Réglages disponibles

| Réglage                             | Valeur initiale | Limites / effet réel                                      |
| ----------------------------------- | --------------- | --------------------------------------------------------- |
| Joueurs de démonstration            | 4               | 3–12, véritables identités distinctes                     |
| Nombre d’Undercover                 | 1               | 1–5 et minorité stricte selon l’effectif                  |
| Mot des civils / mot des Undercover | Phare / Fusée   | 1–80 caractères, deux mots différents, préparation privée |
| Tours d’indices                     | **2**           | 1–5 ; chaque actif parle une fois par tour                |
| Limite de manches                   | 10              | 1–30 ; nul si limite atteinte sans vainqueur              |

Pas de dérogation cachée permettant d’ouvrir un vote avant la fin des indices.
Le GM confirme chaque indice oral ; aucune saisie ou preuve audio n’est requise.
La distribution est cryptographique côté serveur, unique au démarrage de la partie.

## Cycle et résultat

1. Préparation, puis distribution privée des mots.
2. Tous les actifs parlent dans l’ordre d’inscription, pendant les tours prévus.
3. Le GM ouvre le scrutin seulement après tous les passages.
4. Chaque actif vote une fois pour un autre actif, sans modification ni abstention.
   Le GM peut enregistrer un vote délégué avec les mêmes contrôles.
5. Le dépouillement exige tous les votes. Seul en tête : élimination et camp révélé.
   Égalité : aucune élimination, puis nouvelle manche si la partie continue.
6. Zéro Undercover actif : victoire civile ; sinon parité ou majorité Undercover :
   victoire Undercover ; sinon poursuite ou nul à la limite de manches.
7. La fin autorise la révélation des camps et des mots. Rejouer garde les joueurs,
   accès, réglages et disposition ; remet votes/éliminations/résultat à zéro ;
   redistribue les mots au démarrage suivant.

Les anciennes sessions 0.1.0 gardent leur discussion libre historique. Le layout
ne migre pas leurs règles. Voir [OFFICIAL-GAMES-RULES.md](OFFICIAL-GAMES-RULES.md).

## Décisions encore ouvertes

Les variantes avec rôle blanc, révélation du camp à son porteur, changement de vote,
quorum, départage, durées et corrections après révélation restent à définir puis
à tester. Aucun réglage décoratif ne prétend les activer. Enchères et Qui est
l’espion ne sont pas développés dans ce jalon.
