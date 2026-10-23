# Jeux officiels — règles et variantes de démonstration, jalon 5

## Décisions établies et statut

PRODUCT.md impose trois jeux, la confidentialité, le serveur autoritaire, les trois
modes de participation et des règles configurables. Il ne fixe pas leurs variantes.
Seule la règle de débit des enchères est définitive : une offre ne débite rien ;
seule l’attribution confirmée débite le budget. STAGE-3.md propose une variante
Undercover, explicitement non validée. Aucune règle plus détaillée n’a été trouvée.

Les variantes ci-dessous sont des **hypothèses de démonstration**, pas une validation
produit des règles officielles. Le jalon 5 autorise leur implémentation sans attendre
une nouvelle validation. Les anciennes demandes d’attendre avant Undercover sont
remplacées par cette autorisation ; 4C et le Store restent reportés.

## 5A — Undercover, variante de démonstration

- 3 à 12 joueurs ; scénario rapide à 4 joueurs. Un ou plusieurs Undercover, toujours
  strictement moins nombreux que les civils au départ. Par défaut : 1.
- Le GM choisit deux mots distincts et le nombre d’Undercover. Aucune image fournie.
  Les mots libres, dont des noms de personnages, sont acceptés.
- Attribution aléatoire cryptographique côté serveur, une seule fois par partie.
  Le joueur reçoit seulement son mot ; il n’apprend pas son camp avant la révélation.
  Le GM voit les informations de gestion dans une zone privée explicite.
- Discussion orale, puis ouverture du vote par le GM. Les actifs doivent chacun
  voter une fois pour un autre joueur actif. Pas d’abstention ni de changement de
  vote dans cette variante. Les choix individuels restent privés ; le statut de
  participation est public, puis le décompte agrégé apparaît à la clôture.
- Le GM ne peut résoudre qu’après tous les votes. Une déconnexion n’est pas un vote.
  Un joueur revient avec son accès, ou le GM vote pour lui depuis la régie, avec
  les mêmes validations et une commande explicitement autorisée de délégation.
- Majorité relative : le joueur seul en tête est éliminé. Son camp est révélé,
  mais les mots restent privés jusqu’à la fin. Un éliminé conserve son accès en
  lecture, ne vote plus et ne peut plus être ciblé.
- Égalité : personne n’est éliminé ; nouvelle discussion puis nouveau scrutin.
  Le GM choisit le nombre maximal de tours (10 par défaut, 1 à 30). Si ce nombre
  est atteint sans victoire, la partie finit sans vainqueur. Cela borne les égalités.
- Victoire civile si aucun Undercover actif ne reste. Sinon victoire Undercover
  lorsque les Undercover actifs sont au moins aussi nombreux que les civils.
  Cet ordre de contrôle est explicite. La résolution GM détermine automatiquement
  le résultat et autorise alors la révélation de tous les camps et mots.
- Rejouer conserve les accès et la définition figée, efface votes/éliminations/résultat
  et redistribue seulement au prochain démarrage GM. Nouvelle partie = nouvel essai
  indépendant, configurable avant installation.

À décider après tests humains : rôle blanc, révélation du camp à son porteur,
modification/abstention, quorum, départage ou revote limité, minuteries, annulations
après révélation et critères de victoire alternatifs. Aucune de ces options n’est
présentée comme disponible.

## 5B — Enchères, proposition pour la verticale suivante

Non livré comme jeu jouable tant que son parcours complet n’a pas été vérifié.
Proposition : enchère ouverte ascendante, 2 à 12 joueurs, budgets de 1 000 crédits,
2 lots fictifs, premier minimum 100, incrément 50. Le serveur sérialise les offres :
la première offre valide acceptée devient la meilleure ; une offre égale à celle-ci
est refusée. Aucun débit au dépôt. Le GM clôture puis confirme l’attribution ;
une seule confirmation retire le montant au gagnant. Aucun acquéreur sans offre.
Classement proposé : lots acquis, puis budget restant, ex æquo explicites.
À valider : format anglais ou offres secrètes, retraits, incréments, compte à rebours,
annulation/remboursement, valeur des lots et score. Les primitives de ressources,
comparaison d’offres et attribution transactionnelle devront être réutilisables.

## 5C — Qui est l’espion ?, proposition distincte

Non livré comme jeu jouable tant que son parcours complet n’a pas été vérifié.
Proposition : les non-espions connaissent un lieu commun ; l’espion ne le connaît
pas et reçoit l’objectif de le déduire. Un cycle de questions/réponses (auteur et
joueur interrogé identifiés), puis un vote unique d’accusation. Majorité stricte
contre l’espion : victoire du groupe ; erreur ou égalité : victoire de l’espion.
Possibilité proposée d’une tentative de devinette finale par l’espion, à préciser
avant implémentation. Pas d’éliminations successives copiées d’Undercover.
À valider : nombre d’espions, tours de questions, réponse écrite/orale, moment de
la devinette, délai, quorum et score. Réutiliser distribution et scrutin ; ajouter
les questions ciblées et une condition de résultat propre à cette expérience.

## Frontières de validation

Implémentation et tests automatisés sont distincts du plaisir de jeu et du rythme
d’une émission. Aucun test iPhone physique, Safari iOS réel ou OBS physique n’est
revendiqué. La refonte du Studio 4B.1 et le gameplay attendent les retours humains.
