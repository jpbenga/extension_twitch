# Blocs 3 et 4 — intégration des propositions validées

## Validation acquise

Le 28 octobre 2026, l'utilisateur a explicitement confirmé la validation humaine
des 8 écrans du Bloc 3 (Lobby) et des 13 écrans du Bloc 4 (Joueur), et demandé
leur intégration dans l'application. Le précédent statut AWAITING_APPROVAL est
donc remplacé par cette validation. Aucune nouvelle validation de ces mêmes
propositions n'est demandée pour leur export.

Les IDs exacts, projets, surfaces et dossiers de destination sont recensés dans
[le manifeste d'export](../../../scripts/stitch-sync-blocks-3-4.ts).

- Lobby : projet `6846916727190844173`, 8 écrans.
- Joueur : projet `16851612906193292413`, 13 écrans.
- Accueil et préparation Undercover : projet `7117487747163082855`, inchangé.

## Références transférées — obstacle levé

Le commit `3c2e704` de `feat/stitch-lobby-player` contient les 21 captures et
exports HTML reçus depuis le Mac du testeur. Ils ont été récupérés dans le Cloud.
Le préparatif précédent (`ba77ed8`) était bloqué par leur absence ; ce blocage
est levé. Voir le [bilan d'intégration et les captures réelles](LOBBY-PLAYER-IMPLEMENTATION.md).

Les références ne sont pas recréées à partir des seuls intitulés. Aucun accès
Stitch n'est effectué depuis le Cloud. La commande ci-dessous reste disponible
pour resynchroniser les mêmes références, mais n'est plus une étape à effectuer
pour tester la livraison intégrée.

## Export local en une commande

Sur le Mac déjà connecté à Stitch, avec la CLI `@google/stitch@0.12.0` :

```sh
cd ~/extension-twitch-studio-4b &&
nvm use 24 &&
git fetch origin &&
git switch feat/stitch-lobby-player &&
git pull --ff-only &&
npm ci &&
npm run stitch:sync:blocks-3-4 -- --approved
```

La commande lit les 21 références individuellement dans leur projet exact,
sans dépendre du catalogue incomplet de Stitch. Elle produit les captures,
les HTML disponibles et les SPEC, puis actualise SCREENS.md. Elle ne modifie
ni le projet Stitch, ni `.stitch.json`, ni les références des blocs précédents.
Les intitulés de Stitch sont conservés tels quels ; un titre AFTER n'empêche
pas d'enregistrer l'attestation de validation explicite dans SPEC.md.

Chaque écran est traité séquentiellement. Si un export échoue, les autres
sont tentés, les références reçues sont conservées et le bilan liste les
dossiers à reprendre. Relancer la même commande resynchronise les 21 références
sans supprimer les intentions fonctionnelles manuelles ni les captures BEFORE.
Un échec de capture ne remplace pas un export valide précédent. Le succès du
lot exige 21 captures reçues ; l'absence éventuelle d'HTML est signalée.

Après vérification des images et de l'absence d'informations privées :

```sh
git status --short
git add docs/ux/redesign &&
git commit -m "docs: sync approved lobby and player Stitch screens" &&
git push
```

Aucun commit ni push n'est effectué par la commande d'export. Les credentials
restent sur le Mac et ne doivent pas être ajoutés aux artefacts. Les tests du
pont utilisent des fixtures et ne prouvent pas l'accès réel à ces deux projets.

## Invariants à conserver lors de l'intégration

- Salon vide : invitation prioritaire. Effectif valide : préparation prioritaire.
- Préparer ferme les inscriptions ; distribuer les mots est une action distincte.
- L'effectif inscrit ne prouve pas la présence en ligne ; Prêt reste facultatif.
- Un joueur ne reçoit que sa projection privée ; les spectateurs restent publics.
- Le mot est masquable visuellement ; les indices sont donnés oralement.
- Le vote confirmé est exécuté par le serveur, jamais par une simulation locale.
- Un joueur éliminé suit la partie sans retrouver le droit de voter.
- Les transitions restent pilotées par le GM ; le moteur détermine les résultats.
- Les formulations personnelles victoire/défaite ne remplacent pas le résultat
  global existant et doivent respecter les informations autorisées.
- Garder le moteur, SQLite/SSE, les accès distincts, les trois thèmes et
  l'indépendance de l'overlay public.

Les captures réelles, la comparaison visuelle, les tests et le guide iPhone sont
référencés dans le bilan d'intégration. Aucun test sur iPhone physique n'est
revendiqué par l'agent.
