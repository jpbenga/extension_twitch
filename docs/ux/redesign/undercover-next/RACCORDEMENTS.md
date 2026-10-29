> Statut courant : **APPROVED** pour les seuls 28 IDs du registre [APPROVAL.json](APPROVAL.json). Les mentions AWAITING_APPROVAL dans le corps décrivent l’état historique avant l’accord humain. Cet export documentaire ne lance aucune intégration.

# Raccordements à étudier après validation visuelle

Ces notes préparent une future intégration. Elles ne modifient aucun comportement existant et ne constituent pas une spécification serveur approuvée.

## État observé

Le dépôt applicatif a été lu au commit `5a7a2f233f6bd10de28f66ace4b155ab8647f5db`, sans changement local au début du chantier.

- Le Bloc 2 est intégré : 3–12 participants prévus, 1–5 tours d'indices avec 2 par défaut, format Classique, préparation puis salon, distribution séparée.
- Le nombre prévu ne fixe pas une capacité du salon. L'effectif réel est contrôlé dans le parcours existant.
- Les séries éditoriales, images locales associées aux deux contenus et deux nouveaux modes de projection Broadcast ne sont pas des capacités déjà livrées dans ce code.
- Le renderer public `BroadcastOverlay` est commun à l'aperçu, OBS et au comparatif. Son entrée est une projection publique indépendante ; aucun filtrage de la vue GM ne doit le remplacer.

## B2 → série → salon

La série ajoute une couche de préparation éditoriale, sans changer les règles d'Undercover. Ajouter, dupliquer ou réutiliser crée une préparation modifiable ; cela ne distribue pas de mot et ne crée pas une partie active implicitement. Les paramètres essentiels et les contenus restent identifiables au niveau de chaque partie.

Le bouton d'ouverture mène au salon de la première préparation choisie. Une image absente propose une reconnexion facultative et un rendu textuel utilisable ; elle ne bloque pas l'ouverture. La disponibilité des médias doit être recontrôlée sur l'appareil réel au moment utile.

## B5 après une partie

« Partie suivante » sélectionne la prochaine préparation. « Rejouer » reprend la préparation courante selon le parcours de rejeu existant. « Retour à la série » revient au conducteur éditorial. Ne pas confondre ces intentions avec la réinitialisation du salon, qui révoque aujourd'hui des accès joueurs.

Pour cette proposition, la progression manuelle est le comportement prudent : aucun départ automatique, nouvelle distribution ou révélation privée n'est implicitement déclenché par une transition graphique. Toute automatisation ultérieure exige un choix produit explicite et des commandes serveur adaptées.

## Série → Broadcast

Le conducteur complet et les contenus des parties suivantes restent privés. La projection publique ne reçoit que la partie courante et, si voulu, un libellé de transition autorisé. Un écran « Partie suivante » ne doit pas publier la prochaine paire avant l'instant choisi.

Le duo anonyme publie les deux contenus courants sans relation avec un joueur. Les affectations visibles utilisent un autre contrat public explicitement choisi. Masquer des données privées par CSS, dans un attribut ou dans un script du rendu anonyme ne respecte pas cette séparation.

## Layouts et effets TV

Les sept blocs et quatre dispositions restent personnalisables. Les presets subtils regroupent visuellement les informations et ne montrent les événements que lorsqu'ils deviennent pertinents. Les anciens minima géométriques et la politique de visibilité devront être adaptés sans effacer les dispositions personnalisées existantes.

Les moments temporaires ne doivent pas être rejoués en rafale après une reconnexion. Le résultat durable reste accessible même si son apparition spectaculaire est passée. Ce comportement reste à concevoir et vérifier dans l'implémentation future ; une maquette statique ne le prouve pas.
