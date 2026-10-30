# Handoff combiné — Accueil animateur et Répétition avant direct

Statut des deux lots : **APPROVED** par validation visuelle humaine.

## Ordre conseillé

1. Intégrer la petite refonte de l’accueil : accès animateur contextuel et contrôle `Thème`.
2. Intégrer `Répétition avant direct` depuis la série Undercover prête.
3. Vérifier ensemble les raccordements : accueil → préparations → répétition ou vrai salon.

## Lot 1 — Accueil / Espace animateur / Thème

Références : `home-host-access/APPROVAL.json`, `manifest.json`, `SPEC.md`, `HANDOFF.md`, les huit PNG et `approved.html`.

- Conserver l’accueil direct, l’invitation joueur et les jeux indisponibles.
- Ajouter `Espace animateur` sans créer de dashboard, compte ou stockage cloud.
- Exposer uniquement les destinations réellement autorisées par les données et permissions existantes.
- Renommer `Apparence` en `Thème` et fermer le sélecteur immédiatement après tout choix.
- Conserver les trois thèmes, leurs identifiants, leur valeur par défaut et l’indépendance du thème OBS.

## Lot 2 — Répétition avant direct

Références : `pre-live-rehearsal/APPROVAL.json`, `manifest.json`, `SPEC.md`, `HANDOFF.md`, `STORYBOARD.md`, les douze PNG et `prototype.html`.

- Ajouter une session de répétition isolée sans modifier la préparation originale.
- Réutiliser moteur, GM, joueur, projections, Broadcast et Motion existants.
- Proposer le test rapide avec participants système et la répétition avec vrais joueurs.
- Garder la caméra facultative et locale.
- Garder Twitch facultatif et séparé ; ne jamais simuler le lancement d’un direct.

## Frontières communes

- `Ouvrir le salon` prépare la vraie partie.
- `Tester avant le direct` ouvre la répétition.
- Une référence GM locale n’accorde jamais un accès sans validation serveur.
- Les secrets et projections privées restent absents des surfaces publiques.
- Les prototypes HTML sont des références visuelles et comportementales, pas du code React à copier.
- Les captures locales approuvées priment sur une éventuelle vignette Stitch en cache.

## Hors périmètre

- comptes et authentification SaaS ;
- stockage cloud des préparations ;
- intégration Twitch développeur ou OAuth factice ;
- détection OBS simulée ;
- nouvelle règle Undercover ;
- refonte du lobby, de la régie, du compagnon joueur, du Broadcast ou du Laboratoire ;
- fusion vers `main` et déploiement.
