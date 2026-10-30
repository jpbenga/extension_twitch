# Revue finale UX

## Décisions principales

- `Tester avant le direct` devient l’action de raccordement depuis une série prête, sans prendre la place définitive de `Ouvrir le salon`.
- Le mode rapide est recommandé, mais la répétition avec de vrais joueurs reste un choix de premier niveau.
- La scène centrale traite la vidéo comme contenu dominant et l’habillage comme couche télévisuelle discrète.
- Une checklist courte remplace toute logique de dashboard ou de diagnostic technique.
- La caméra est facultative, locale et non bloquante.
- La fin rassure explicitement : aucune manche n’a été consommée.
- Twitch est un onboarding streamer séparé ; il ne conditionne pas la répétition locale.

## Éléments volontairement inchangés visuellement

- lobby ;
- GM ;
- joueur ;
- renderer public Broadcast ;
- transitions Motion ;
- éditeur avancé des blocs ;
- laboratoire développeur ;
- configuration Twitch développeur.

## Contrôles réalisés

- 12 écrans livrables rendus dans un navigateur réel ;
- quatre routes internes de raccordement parcourues séparément ;
- desktop contrôlé à 1440 × 1000 ;
- mobile contrôlé à 390 × 844 ;
- absence de scroll horizontal dans les compositions locales ;
- actions mobiles de 48px ou plus ;
- un seul CTA dominant par écran ;
- terminologie technique absente du prototype local ;
- parcours caméra refusée non bloquant ;
- distinction claire entre répétition, onboarding Twitch et direct réel.
- sortie volontaire distincte de la synthèse de réussite ;
- statut de diffusion présenté comme `À vérifier` tant qu’aucun contrat fiable ne l’atteste ;
- accès mobile au salon et rappel de préservation de la série conservés.
- séparation explicite entre le salon de vraie partie et le salon de répétition avec joueurs, sans redessiner le lobby ;
- branche sans caméra continue jusqu’au vote sans redemander l’activation.

## Référence de non-modification applicative

- dépôt source contrôlé : racine du dépôt ;
- commit : `496763aafcb1f9d2e505cb9171725b35ca553540` ;
- statut observé à la fin : uniquement `?? .DS_Store` ;
- aucun fichier applicatif n’a été écrit par ce travail de design.

## Note Stitch

Les premières générations Stitch ont ajouté une couche de régie technique non demandée. Les écrans ont été édités individuellement pour retirer ces éléments du HTML. Les vignettes de capture peuvent rester temporairement en cache ; les captures locales contrôlées dans `screens/` sont la référence de composition pour la validation.

## Statut

Revue indépendante finale : `SHIP` — aucun problème P0, P1 ou P2 restant.

`PRE_LIVE_REHEARSAL_UX_STATUS: APPROVED`
