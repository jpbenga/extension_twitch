# Design System: accueil Extension Twitch

## 1. Visual Theme & Atmosphere

Références : les deux accueils APPROVED de ce dossier, puis leurs SPEC fonctionnelles.
Ambiance jeu de déduction, indigo/aubergine, lilas et bouton citron. Densité équilibrée,
une action dominante, illustration intégrée à la carte. Cette direction concerne
l’accueil uniquement. Elle ne remplace pas les tokens des régies et de l’émission.
La décision utilisateur sur les accents prévaut sur une recommandation générique de palette.

## 2. Color Palette & Roles

Tokens `--home-*` centralisés dans `apps/web/src/app/tokens.css`, sous `.home-page`.
Neon Show est la direction de référence : fond `#0C0C1F`, carte `#1A1A2D`, surface
surélevée `#28283C`, texte `#E2E0FB`, secondaire `#B7A8D4`, lilas `#CEBDFF`, action
citron `#C8F323` avec texte `#171E00`. Bord de contrôle `#7E7199`, ajusté pour le contraste.
Broadcast Studio conserve son turquoise `#20C9B4` et ses surfaces bleues ; On Air
Premium son champagne `#E6B96B` et ses surfaces graphite. Même géométrie et logique.
Aucune nouvelle valeur de préférence ; défaut Broadcast Studio conservé. OBS reste
scopé par son propre thème serveur, jamais par les variables locales de l’accueil.

## 3. Typography Rules

Space Grotesk : titres, boutons et libellés. DM Sans : textes. Fichiers variables
locaux et licences OFL conservées ; aucun CDN de police nécessaire. Titre desktop
40/48 px maximum, titre mobile 28/35 px ; les champs mobiles restent à 16 px pour
éviter le zoom automatique de saisie. Le zoom utilisateur du navigateur reste permis.

## 4. Component Stylings

Carte de jeu : rayon 12 px, illustration en arrière-plan, badges secondaires,
texte séparé des commandes. Commandes : rayon 8 px, cibles d’au moins 44 px, focus
visible de 3 px. Une reprise validée remplace la préparation comme action dominante.
Découvrir et l’aide au lien privé sont des disclosures accessibles. Apparence réutilise
le contrôle existant. Les erreurs d’invitation restent intégrées au formulaire.

## 5. Layout Principles

Desktop : contenu maximum 1440 px, marges 48 px aux grandes largeurs, grille 7/5,
carte principale de hauteur minimale 440 px, deux panneaux d’accès superposés.
Mobile : une colonne, marges 16 px, bandeau d’illustration 128 px, en-tête compact.
Les hauteurs s’adaptent aux contenus ouverts et aux erreurs. Une reprise disponible
vient avant la carte dans le DOM et sur mobile. Pas de largeur 390 px imposée à tous
les appareils, ni de marges reproduisant le canevas vide du PNG Stitch mobile.
Le catalogue reste accessible discrètement en pied de page.

## 6. Motion & Interaction

Transitions brèves sur les commandes, sans boucle décorative, animation permanente
ou attente artificielle. Respect de prefers-reduced-motion. Aucun changement de phase
ou de score simulé. Les états de vérification concernent seulement une référence GM
réellement présente ; pas de panneau permanent de diagnostic.

## 7. Anti-Patterns (Banned)

Ne pas copier le CDN Tailwind, les boutons inertes, l’interdiction du zoom ou le faux
état de reprise de l’export. Pas d’historique de compte inventé, de jeu à venir cliquable,
de secrets GM dans l’illustration, de changement de thème OBS ou de refonte des autres
surfaces. L’illustration ne détermine jamais les règles ni l’état de la partie.
