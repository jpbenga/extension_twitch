# Raccordement produit et hypothèses d’implémentation

Ce document transmet des décisions validables. Il ne définit pas un backend définitif.

## Mapping des surfaces

### Modifiées légèrement

- **Série prête / fin de préparation** : ajouter `Tester avant le direct` et la garantie que la série restera intacte.
- **Diffusion** : ajouter un accès discret au statut Twitch streamer et, si utile, à la répétition de la partie courante.
- **Game Master** : ajouter un accès discret `Répétition` ou `Retour à la répétition` lorsque la session temporaire existe.

### Nouvelles

- choix `Test rapide` / `Avec mes joueurs` ;
- scène centrale de répétition ;
- checklist de vérification et synthèse finale ;
- états Twitch streamer déconnecté/connecté.

### Réutilisées sans refonte

- lobby et invitations ;
- commandes Game Master ;
- compagnon joueur ;
- projection spectateur et renderer Broadcast ;
- animations/Motion déjà approuvées ;
- éditeur avancé des sept blocs et quatre layouts ;
- Laboratoire QA et outils développeur.

## Hypothèses backend à confirmer par Codex

1. Une répétition est une **session temporaire isolée** créée à partir d’un snapshot immuable de la partie préparée.
2. La session temporaire possède un type explicite `rehearsal`, distinct de `live`, avec expiration et nettoyage idempotent.
3. Les commandes GM, le moteur, les projections joueur/public et le renderer Broadcast sont les vrais composants existants ; seule la source de session change.
4. La fin, l’abandon ou l’expiration d’une répétition ne modifie jamais l’ordre, le contenu, les médias ni l’avancement de la partie préparée.
5. Le test rapide peut réutiliser la capacité existante de participants système du laboratoire, mais sous une surface produit dédiée et sans vocabulaire QA.
6. La répétition avec joueurs réutilise le lobby et les permissions existants, avec une indication claire que la session est une répétition.
7. La caméra est capturée localement par le navigateur et n’est pas envoyée ni conservée sans décision produit explicite ultérieure.
8. Twitch OAuth/statut de chaîne relève de l’onboarding streamer. Aucun secret ni réglage développeur ne doit être envoyé au client ou affiché.
9. Le sens de `Diffusion prête` doit être défini par un contrat produit fiable ; l’interface ne doit pas simuler une détection OBS inexistante.

## Invariants fonctionnels

- même moteur de jeu ;
- mêmes transitions et animations ;
- mêmes projections publiques et privées ;
- même distinction Duo anonyme / Affectations visibles ;
- aucune information privée disponible au renderer public en Duo anonyme ;
- aucun média préparé supprimé ou consommé ;
- caméra facultative et non bloquante ;
- Twitch non requis pour répéter localement.

## Recommandation responsive

- **Desktop prioritaire** pour la scène centrale, car il permet de contrôler la vidéo, le rail de vérification et la régie en parallèle.
- **Mobile prioritaire** pour l’entrée depuis la série, le choix du mode, la synthèse et l’onboarding Twitch.
- **GM mobile existant** réutilisé lorsqu’un streamer pilote la répétition depuis son téléphone ; aucune nouvelle régie compacte n’est créée dans cette itération.
