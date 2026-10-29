Intègre les références Undercover visuellement approuvées de la branche `docs/undercover-approved-consolidation-motion`.

Commence par `docs/ux/redesign/undercover-consolidation-motion/HANDOFF.md`, `APPROVAL.json` et les deux manifests liés. Les 36 références sont APPROVED : aucune nouvelle validation UX ni connexion Stitch n'est nécessaire. Captures, HTML, 4 prototypes et 8 vidéos sont dans Git.

L'application auditéе inclut déjà les séries persistantes, médias A/B et TV v2 au commit d27458974b4c763e2911952b5295b4b0deae893d. Travaille sur la base applicative actuelle en conservant ces capacités. Ne remplace pas le travail plus récent éventuel par cette base historique.

Intègre la consolidation UX (24 références) et le Motion TV (12 fiches) conformément au handoff, sans reconstruire l'application depuis les HTML. Conserve les expériences acquises, fonctionnalités, données, moteur, permissions, reçus, SSE, 7 blocs, 4 dispositions et renderer commun. AC9/10 sont des FOCUS à greffer à B5. Respecte la séparation publique Duo/Affectations/Final et la confidentialité.

La validation visuelle ne décide pas des conséquences serveur absentes de pause/reprise, fin anticipée et abandon : poursuis toute l'intégration supportée, et isole le contrat à arbitrer avant de développer ces nouvelles commandes. Aucune commande fictive ou victoire inventée. Ne redemande pas une validation de design déjà acquise.

Teste les comportements ciblés, desktop/mobile, 3/6/12 joueurs dont vote12/12, reduced-motion, interruption, ouverture tardive/reconnexion et absence de secrets. Compare des captures réelles aux références, puis fournis bilan, tests exécutés, captures et arbitrages restants. Ne fusionne pas vers main et ne déploie pas automatiquement.
