# Répétition avant direct — dossier de validation UX

Statut : `APPROVED`

Validation visuelle humaine enregistrée le 30 octobre 2026. L’intégration peut s’appuyer sur les douze références de `manifest.json` sans nouvelle validation UX.

Ce dossier décrit la proposition UX de la capacité commerciale **Répétition avant direct** pour Undercover. Il ne contient aucune modification de l’application, aucun contrat backend implémenté et aucune configuration Twitch développeur.

## Références

- Projet Stitch : `6533527202779027418`
- Projet : <https://stitch.withgoogle.com/projects/6533527202779027418>
- Prototype local : `prototype.html`
- Captures locales contrôlées : `screens/`
- Manifeste Stitch : `manifest.json`
- Storyboard : `STORYBOARD.md`
- Raccordement produit/technique : `HANDOFF.md`
- Revue finale : `REVIEW.md`

## Ouvrir le prototype local

Servir le dossier avec un serveur HTTP local puis ouvrir :

```text
prototype.html?screen=partie-ready-desktop
```

Le manifeste recense les 12 écrans livrables synchronisés dans Stitch. Le prototype contient aussi quatre routes internes nécessaires pour vérifier les branches sans ajouter de nouveaux livrables Stitch :

- `live-lobby-handoff` : frontière vers le salon de vraie partie ;
- `rehearsal-lobby-handoff` : frontière vers le salon de répétition avec joueurs ;
- `rehearsal-discussion-no-camera-desktop` ;
- `rehearsal-vote-no-camera-desktop`.

Ces routes internes servent uniquement à rendre les raccordements testables. Elles ne redessinent pas le lobby, le GM, le joueur ou le Broadcast existants.

## Source de vérité visuelle

Les captures locales constituent la composition de référence contrôlée et approuvée pour cette itération. Les écrans Stitch portent les mêmes intentions. Certaines vignettes Stitch peuvent conserver temporairement une ancienne capture en cache après une édition HTML ; Codex doit alors privilégier les PNG locaux approuvés.

`PRE_LIVE_REHEARSAL_UX_STATUS: APPROVED`
