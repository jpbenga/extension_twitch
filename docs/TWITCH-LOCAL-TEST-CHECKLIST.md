# Checklist Twitch Local Test

Date : __________ · Commit : __________ · Compte/version Twitch : __________

Cocher uniquement ce qui a été observé. Les tests automatisés du Helper sont des fixtures de frontière ; ils ne valident ni votre compte Twitch ni la visibilité de l’extension sur la chaîne.

## État de validation

- **AUTOMATED_VERIFIED** : build, contrats, passerelle HTTPS publique, confidentialité HTTP/SSE, rendu et gameplay automatisés. Voir le bilan pour les résultats exacts.
- **LOCAL_RUNTIME_VERIFIED** : démarrage et transport HTTPS vérifiés dans l’environnement de test Cloud ; la confiance du certificat mkcert sur votre Mac reste à vérifier.
- **TWITCH_CONSOLE_REQUIRED** : extension, version Local Test, Configuration Service, comptes autorisés, installation/activation et association de session.
- **HUMAN_TWITCH_TEST_REQUIRED** : vrais rendus Twitch desktop/mobile, CSP réelle, authentification Helper et écriture de configuration chez Twitch.

## Première installation

- [ ] Node 24 et npm 11 actifs.
- [ ] Ancien serveur arrêté avant le lancement.
- [ ] `npm run twitch:cert` terminé ; aucun contournement TLS.
- [ ] `npm run twitch:local` lancé, Next Ready.
- [ ] Testing Base URI ouverte sans avertissement de certificat.
- [ ] Extension **Panel**, version en Local Test, compte de test autorisé.
- [ ] Configuration Service activé.
- [ ] Lien public associé ; aucun lien privé copié dans Twitch.
- [ ] Aucun clic Review, Release ou Publish ; aucun live lancé pour le scénario de base.

## Session

- [ ] GM connecté, sur iPhone ou desktop.
- [ ] Joueurs connectés avec leurs accès distincts.
- [ ] Session correcte visible dans le Panel Twitch réel.
- [ ] Commande GM visible immédiatement côté joueurs et Twitch.
- [ ] Action joueur visible côté GM et Twitch lorsque les règles la rendent publique.
- [ ] Rechargement de la vue Twitch : état courant conservé.
- [ ] Coupure/reconnexion : état récupéré sans rejeu des anciens effets.
- [ ] Nouvelle session : association explicitement mise à jour.

## Gameplay réel

- [ ] Attente/préparation sans distribution implicite.
- [ ] Discussion.
- [ ] Joueur actif.
- [ ] Deux tours d’indices, vote prématuré impossible.
- [ ] Vote et compteur public.
- [ ] Choix individuels privés absents avant dépouillement.
- [ ] Élimination intermédiaire avec cinq joueurs, ou égalité.
- [ ] Révélation finale autorisée.
- [ ] Cycle d’indices/votes suivant avec la même paire, si aucune victoire.
- [ ] Préparation suivante après résultat final, sans révélation automatique.
- [ ] Fin par victoire ou nul.
- [ ] Rejouer conserve les accès, remet l’affichage à zéro et ne fait pas avancer la liste.

## Broadcast

- [ ] Rendu léger, centre dégagé ; aucun panneau GM ou QA dans le Viewer.
- [ ] Duo anonyme : deux contenus seulement, aucune association avec un joueur.
- [ ] Affectations visibles uniquement après publication explicite GM.
- [ ] Images présentes après publication autorisée.
- [ ] Image absente : texte conservé, aucun blocage.
- [ ] Textes/noms longs lisibles ; numéros stables, pages correctes à douze joueurs.
- [ ] Apparitions temporaires discrètes ; résultat durable après animation.
- [ ] Mouvement réduit respecté.
- [ ] Le Panel est identifié comme Panel, sans prétendre simuler la composition vidéo Twitch.

## Responsive et contexte Twitch

- [ ] Desktop, Panel réel dans la chaîne.
- [ ] Petit Panel / largeur 320 px.
- [ ] Lecteur de différentes tailles et disposition de la page Twitch.
- [ ] Chat ouvert.
- [ ] Chat fermé.
- [ ] Mobile Twitch réel, **si Local Test disponible pour le compte et la version**.
- [ ] Si mobile indisponible : limite notée ci-dessous, pas de réussite revendiquée.
- [ ] Overlay vidéo : non testé par défaut ; si évalué séparément, préciser la contrainte live et l’autorisation du test.

## Hosted Test ultérieur

- [ ] Archive construite, fichiers à la racine, sans secret.
- [ ] Origine backend HTTPS réellement accessible aux appareils de test.
- [ ] Client ID public et CORS exact configurés si assets sur le CDN Twitch.
- [ ] CSP Twitch autorise les connexions/images de cette origine.
- [ ] Upload et changement Hosted Test effectués humainement.
- [ ] Comptes de test uniquement ; aucune Review/Release.
- [ ] Aucun backend de développement rendu publiquement accessible par simple redirection de port.

## Observations humaines

Disponibilité hors ligne du Panel : __________

Mobile Local Test disponible / indisponible et raison : __________

Confiance certificat / demande d’accès réseau local : __________

Lisibilité, rythme, placement et interaction avec l’UI Twitch : __________

Erreurs ou différences attendues/réelles : __________
