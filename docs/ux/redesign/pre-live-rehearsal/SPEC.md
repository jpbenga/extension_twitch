# Spécification d’intégration — Répétition avant direct

## Portée approuvée

Ajouter à Undercover une répétition isolée permettant de vérifier le vrai moteur, les commandes GM, les projections joueur/publique, le renderer Broadcast et les animations sans consommer ni modifier la partie préparée. Ne pas modifier les règles Undercover et ne pas simuler un direct Twitch.

## Parcours

1. Depuis une série prête, proposer `Tester avant le direct` sans remplacer définitivement `Ouvrir le salon`.
2. Choisir `Test rapide` avec trois participants système ou `Avec mes joueurs` en réutilisant le lobby existant.
3. Ouvrir une scène de répétition où la vidéo est dominante et l’overlay public réel reste discret.
4. Parcourir au minimum discussion et vote avec les vraies commandes et projections.
5. Permettre la continuation sans caméra.
6. Terminer par une synthèse et revenir à la préparation originale intacte.

## Invariants

- La répétition est distincte d’une vraie partie et ne modifie jamais l’ordre, les contenus, les médias ou l’avancement de la série.
- Le renderer public ne reçoit jamais les affectations privées en mode Duo anonyme.
- Le test rapide réutilise des participants système sans exposer le vocabulaire Laboratoire ou QA.
- La répétition avec joueurs conserve les permissions et projections existantes.
- La caméra est locale au navigateur, facultative, non persistée et non bloquante.
- Twitch n’est pas requis pour répéter ; aucun OAuth factice, secret, réglage développeur ou bouton `Lancer le direct` n’est ajouté.
- Le statut OBS/diffusion ne doit jamais être inventé lorsqu’aucun contrat fiable ne permet de l’établir.

## États attendus

- série prête, desktop et mobile ;
- choix du mode, desktop et mobile ;
- caméra inactive ;
- discussion ;
- vote ;
- caméra indisponible avec continuation ;
- répétition terminée, desktop et mobile ;
- onboarding Twitch connecté/déconnecté, séparé et facultatif.

## Architecture à confirmer pendant l’intégration

La recommandation approuvée est une session temporaire isolée de type explicite `rehearsal`, créée depuis un snapshot immuable de la préparation, avec fin/abandon/nettoyage idempotents. Codex doit d’abord auditer les contrats actuels et retenir l’extension minimale qui préserve les sessions existantes et les protections serveur.

## Critères d’acceptation

1. Les deux contextes `Ouvrir le salon` et `Inviter mes joueurs pour répéter` restent séparés.
2. Le test rapide utilise le vrai moteur et de vraies projections, pas une animation autonome.
3. Une répétition complète ou abandonnée laisse la préparation originale strictement intacte.
4. La caméra refusée n’empêche aucune vérification fonctionnelle.
5. Les données privées ne sont jamais présentes dans la projection publique.
6. Les surfaces desktop/mobile suivent les captures approuvées sans scroll horizontal ni contrôle minuscule.
7. Les tests couvrent création, permissions, progression, abandon, expiration/nettoyage, confidentialité et non-consommation de la préparation.
8. Aucun compte Twitch, OBS réel, publication, fusion vers `main` ou déploiement n’est requis pour valider l’intégration.
