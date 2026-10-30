# Accueil — accès animateur et thème

**APPROVED**. Projet `7117487747163082855`. Huit références finales, desktop/mobile. Validation humaine enregistrée le 29 octobre 2026.

| Écran                                                           | Screen ID / Stitch                                                                                              | Intention                                                 |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| PROPOSAL — Accueil — Partie en cours — Desktop — v1             | [12808420961637518022](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=12808420961637518022) | Ouvrir la régie autorisée et retrouver les préparations   |
| PROPOSAL — Accueil — Partie en cours — Mobile — v1              | [15869293504868770608](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=15869293504868770608) | Ouvrir la régie autorisée et retrouver les préparations   |
| PROPOSAL — Accueil — Première visite — Desktop — v1             | [17138499846574791502](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=17138499846574791502) | Préparer une première partie sans session fictive         |
| PROPOSAL — Accueil — Première visite — Mobile — v1              | [1530838904113415362](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=1530838904113415362)   | Préparer une première partie sans session fictive         |
| PROPOSAL — Thème — Sélecteur ouvert — Desktop — v1              | [16085048505469292242](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=16085048505469292242) | Choix visuel, fermeture après sélection, indépendance OBS |
| PROPOSAL — Thème — Sélecteur ouvert — Mobile — v1               | [11298174379680081132](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=11298174379680081132) | Choix visuel, fermeture après sélection, indépendance OBS |
| PROPOSAL — Espace animateur — Navigation ouverte — Desktop — v1 | [273287362999373699](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=273287362999373699)     | Accès aux parties préparées, à la régie et à la diffusion |
| PROPOSAL — Espace animateur — Navigation ouverte — Mobile — v1  | [10415891108119039135](https://stitch.withgoogle.com/projects/7117487747163082855?node-id=10415891108119039135) | Accès aux parties préparées, à la régie et à la diffusion |

[Prototype interactif](prototype.html?review=1) · [Raccordements](HANDOFF.md) · [Brief anglais](BRIEF.en.md) · [Vérifications](QA.json) · [Relecture](REVIEW.md).

Le prototype permet de choisir les états première visite, préparation, salon et partie en cours. Aucun appel à une API ni droit GM réel. Les sélecteurs appliquent les thèmes de démonstration et se ferment après choix ; ESC, clic extérieur et retour de focus sont vérifiés à 1440/390/1905.

Les ressources finales sont des PNG importés dans Stitch, avec HTML responsive interactif compagnon. Les PNG sont récupérés et les IDs contrôlés ; aucun test OBS/iPhone physique revendiqué. Le domaine des liens CLI est corrigé vers withgoogle.com conformément à celui vérifié précédemment.

L’ancienne génération native Stitch reste SUPERSEDED et ne fait pas partie des huit références finales. Aucun code applicatif n’a été modifié. Le contrat d’intégration approuvé est publié sur la branche `ux/home-host-access-approved`, commit `c82f22454328c3cea7baa5f459d6812defce3516`.

`HOME_HOST_ACCESS_STATUS: APPROVED`
