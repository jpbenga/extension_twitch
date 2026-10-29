> Statut courant : **APPROVED** pour les seuls 28 IDs du registre [APPROVAL.json](../undercover-next/APPROVAL.json). Les mentions AWAITING_APPROVAL dans le corps décrivent l’état historique avant l’accord humain. Cet export documentaire ne lance aucune intégration.

# Chantier A — Undercover / préparation d’une série

Statut : **AWAITING_APPROVAL**. Maquettes uniquement.

## Intentions et composition

- A1 configure une partie et ajoute ses deux contenus à la série. Les valeurs illustrées restent 4 participants prévus, 2 tours d’indices, Classique. Les plages existantes 3–12 et 1–5 sont conservées.
- A2 édite les contenus A et B indépendamment. Nom et image sont séparés : changer l’un ne doit pas changer l’autre. Retirer une image conserve le texte.
- A3 présente le conducteur éditorial. Ajouter, modifier, dupliquer, retirer, réutiliser et déplacer sont identifiables sans grille administrative. Les commandes Monter/Descendre ont une cible de 48 px ; la poignée n’est pas l’unique manière de réordonner. Un menu est montré ouvert pour rendre Dupliquer/Retirer visibles.
- A4 retrouve une paire dans des préparations précédentes et en crée une copie modifiable. Le contenu d’origine reste intact. Les deux champs sont indépendants pour permettre une réutilisation partielle. Les exemples datés sont des titres de préparations, sans promesse d’historique de compte ou de synchronisation.
- A5 garde le nom, les paramètres et l’autre image ; reconnecter est une action calme et facultative. Enregistrer reste disponible.
- A6 distingue la préparation valide et la disponibilité d’images facultatives. Dix parties prêtes restent ouvrables malgré une image à reconnecter. Ouvrir le salon ouvre les invitations ; aucune distribution ni partie n’est lancée implicitement.

Un seul CTA citron par écran. Le mobile reprend la même intention, une colonne, 16 px dans les champs, des cibles de 48 px, une commande basse et de l’espace réservé sous le contenu. Les commandes secondaires ne concurrencent pas le CTA principal. Les captures pleine page représentent un défilement ; la barre fixe apparaît à sa position du premier viewport. Les captures `viewport.png` et `viewport-bottom.png` montrent les positions réelles à 390 px.

## Images et appareil

Les images sont facultatives. La seule explication produit est leur disponibilité sur cet appareil. La préparation textuelle reste utilisable quand elles manquent. Aucun écran de préparation n’expose de relais temporaire, identifiant, stockage, chemin, serveur, cache ou mécanisme de synchronisation.

Illustrations de Sasuke/Itachi partagées avec le chantier B, générées par Stitch et téléchargées via la CLI. Sources : projet `17376000961075708568`, écrans `c68763979d884461b38e13ab1f52fa36` et `c1a184a8cde8498d96d87935d6cd6256`. Ces illustrations sont embarquées uniquement dans les maquettes, hors dépôt applicatif. Les polices sont les fichiers locaux canoniques Space Grotesk et DM Sans.

## Raccordements futurs B2 / B5

- B2 : une préparation devient une entrée de série. Le nombre prévu ne limite pas les inscriptions réelles. Les rôles/distribution et réglages du plateau existants restent des accès secondaires fermés ; leur contenu n’est pas reconçu ici.
- Salon : une série ouvre son salon d’invitation, avant les commandes de distribution. Une seule partie est active à un instant donné.
- B5 — Partie suivante : propose la prochaine préparation dans l’ordre choisi. Le GM confirme le passage ; l’écran suivant ne doit pas distribuer ou lancer des secrets implicitement.
- B5 — Rejouer : réutilise la préparation actuelle, sans avancer l’index de série. Le comportement exact des invitations et accès reste celui du parcours B5 existant à raccorder lors de l’intégration.
- B5 — Retour à la série : revient au conducteur sans perdre les préparations. Le comportement d’une partie déjà active devra être explicite au moment de l’intégration.
- Passage automatique : non retenu comme défaut. Une éventuelle option doit faire l’objet d’un choix GM explicite, sans court-circuiter les contrôles et transitions serveur. Aucun nouvel écran B5 n’est produit.
- Suppression d’une préparation : action réversible à privilégier (retour Annuler), sans supprimer des médias partagés utilisés ailleurs. L’état de retour n’est pas représenté dans les six intentions demandées.

Ces raccordements, séries et médias locaux sont de nouvelles propositions demandées, **pas des capacités prétendues déjà implémentées**. Aucun contrat de production, moteur ou persistance n’a été modifié.

## Contrôle des maquettes

Douze générations Stitch sources conservées dans `generated/`. Une correction groupée des maquettes HTML a supprimé les règles/rôles, la navigation, la durée et la synchronisation inventés par la génération, ainsi que les mauvaises polices mobiles. Les versions corrigées sont dans `refined/` et réimportées dans Stitch sous v2. Les v1 sont superseded et ne constituent pas la proposition à valider.

Contrôle Chromium des douze HTML : viewports 1440 et 390 px, images et polices chargées, absence de défilement horizontal, boutons au moins 48 px, contenu visible et disclosures inspectés. Les textes secondaires utilisent `#B7A8D4`, pas la couleur de bordure `#7E7199`. Les captures et `qa.json` constituent les preuves de maquette. Les contrôles statiques de contenu excluent les règles, termes techniques et promesses inventés.

Limites : prototypes visuels statiques ; les boutons n’implémentent ni persistance ni commandes de jeu. Aucun test iPhone physique, OBS réel ou validation humaine n’est revendiqué. Aucun fichier React/Next.js ni source applicative modifié ; aucune intégration Codex, synchronisation fonctionnelle, branche, commit ou déploiement.
