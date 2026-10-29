> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Vérification des maquettes — consolidation Undercover

**AWAITING_APPROVAL** · Contrôles de maquettes uniquement.

Une passe groupée Chromium a couvert les 24 références à 1440px desktop et 390px mobile. Une relecture indépendante a ensuite identifié deux défauts matériels : note de disponibilité contredisant l’image absente et titre de confirmation trop proche de la fermeture. Les trois ajustements initialement prévus ont été regroupés : retour vers l’accueil, poignée de déplacement explicite et capture fidèle du renderer existant dans l’aperçu.

Une passe de confirmation unique a suivi ces corrections. Résultat :

- 24/24 références sans débordement horizontal aux largeurs prévues ;
- toutes les images chargées ;
- Space Grotesk et DM Sans chargées depuis les données locales de la référence existante, sans CDN ;
- aucune cible bouton visible inférieure à 44px de hauteur ; commandes principales et média à 48px minimum ;
- aucun mot technique média ni ancien libellé Série dans le texte produit rendu ;
- texte secondaire sur surface surélevée : contraste 6,56:1 ; commande citron/texte foncé : 13,34:1 ;
- les quatre confirmations ont également été mesurées à 320 et 390px : titre entièrement dans la fenêtre, aucun chevauchement avec Fermer, aucun débordement horizontal.

Preuves : `qa.json`, `dialog-confirmation.json`, captures dans `screens/*/`. `viewport.png` et `viewport-bottom.png` illustrent le CTA fixé dans la vraie fenêtre mobile. `mobile-complete.png` remet le CTA en fin de document pour présenter la totalité du contenu dans Stitch ; ce n’est pas une simulation d’un viewport très haut avec CTA flottant au milieu.

Les références finales Stitch sont des PNG de ces maquettes, accompagnés ici de leur HTML responsive source. Le PNG seul ne prouve aucune interaction métier. Les dialogues reprennent la géométrie et la sémantique du patron existant ; leur gestion complète du clavier et du focus devra rester celle du composant applicatif existant lors d’une future intégration.

Le contrôle porte sur des maquettes locales Chromium et des ressources Stitch authentifiées. Aucun test physique iPhone, Safari iOS ou OBS, aucune intégration applicative, aucune nouvelle validation humaine n’est revendiqué. Les captures de la régie AC9/AC10 sont des études FOCUS sur contexte simplifié, pas des écrans de remplacement du B5.
