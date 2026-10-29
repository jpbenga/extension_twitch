# Spécification d’intégration — accueil / accès animateur

## Portée

Implémenter la petite refonte approuvée de l’accueil. Préserver Undercover, l’invitation joueur, la découverte du jeu, les deux jeux à venir non cliquables, les trois thèmes existants et les permissions actuelles. Ne pas créer de compte, de cloud de préparations, de nouveau dashboard, de nouvelle route métier ni de nouveau thème.

## État contextualisé du bloc animateur

Afficher une seule action dominante justifiée par l’état réel :

| État vérifié                                                           | Présentation et action                                                                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Aucun accès GM courant et aucune préparation significative à reprendre | `Votre prochain stream` ; la carte Undercover garde `Préparer une partie` comme action dominante.                          |
| Préparation locale identifiable                                        | `Continuer la préparation` vers la série/préparation réellement sélectionnée.                                              |
| Session GM autorisée encore au salon                                   | `Ouvrir le salon` vers la route GM existante.                                                                              |
| Session GM autorisée en jeu                                            | `Ouvrir la régie` vers la route GM existante.                                                                              |
| Référence périmée, refusée, terminée ou réseau indisponible            | Aucun faux accès. Conserver une explication concise et `Retrouver un accès`. Les préparations locales restent accessibles. |

`useRecentSession` ne doit jamais accorder un accès depuis le seul `sessionStorage` : conserver la vérification du jeton via la réponse privée serveur. Si le modèle existant ne permet pas d’identifier sans ambiguïté une préparation inachevée, ne pas fabriquer cet état ; `Mes parties préparées` reste disponible.

## Navigation `Espace animateur`

Ajouter une entrée permanente et nommée dans l’en-tête :

- `Mes parties préparées` → `/play/undercover?view=series` ;
- `Ma régie` → `/sessions/[id]/gm`, uniquement avec accès GM validé ;
- `Diffusion` → `/sessions/[id]/stream` pour la session autorisée, sinon la vue de diffusion de la préparation locale sélectionnée lorsqu’elle existe ;
- masquer ou rendre réellement indisponible toute destination qui ne possède pas de contexte valide ; ne jamais créer de faux lien GM.

Le menu est un popover léger sur desktop et une feuille focalisée sur mobile. Échap, clic extérieur et fermeture explicite le ferment. Le focus revient au déclencheur. Une feuille modale rend l’arrière-plan inerte et piège le focus jusqu’à sa fermeture.

## `Thème`

- Renommer le contrôle visible et son nom accessible de `Apparence` vers `Thème` / `Thème de l’application`.
- Conserver exactement `Broadcast Studio`, `Neon Show` et `On Air Premium`, leurs IDs, la valeur par défaut et la persistance locale existante.
- Afficher les trois choix comme actions nommées avec un indicateur sélectionné non fondé uniquement sur la couleur.
- Choisir une option applique le thème et ferme immédiatement le panneau, y compris si elle est déjà sélectionnée.
- Échap, clic extérieur et bouton fermer ferment le panneau ; le focus revient au déclencheur.
- Le thème privé ne modifie jamais le thème public de l’émission/OBS.

## Responsive et accessibilité

- Desktop : conserver la relation carte Undercover / bloc animateur / invitation des références approuvées.
- Mobile : bloc animateur avant la carte de jeu, puis invitation ; aucune largeur horizontale ni contrôle minuscule.
- Cibles interactives de 44 px minimum, focus clavier visible, zoom navigateur autorisé, champs à 16 px minimum sur mobile.
- Préserver les erreurs d’invitation, l’état de vérification GM, le fonctionnement sans stockage et `prefers-reduced-motion`.

## Fichiers applicatifs probables

- `apps/web/src/components/welcome.tsx`
- `apps/web/src/components/application-theme.tsx`
- `apps/web/src/components/resume-session.tsx`
- `apps/web/src/app/home.css`
- éventuellement un petit hook/composant dédié à l’accès animateur, sans déplacer la logique métier dans la présentation
- `tests/e2e/home.spec.ts`
- `tests/e2e/ux-experiences.spec.ts`, `tests/e2e/lobby-player.spec.ts`, `tests/e2e/prepare-undercover.spec.ts` si le nom accessible partagé change
- tests unitaires ciblés autour des thèmes et de la reprise

## Critères d’acceptation

1. Les états première visite et session active correspondent aux PNG desktop/mobile approuvés.
2. Le menu animateur ouvre les bonnes destinations existantes et n’expose aucune destination GM sans autorisation.
3. Une préparation locale reste accessible après une session périmée ou refusée.
4. Une seule action contextuelle dominante apparaît.
5. Le sélecteur `Thème` ferme après toute sélection et rend le focus.
6. Clic extérieur et Échap ferment les deux panneaux.
7. Aucun thème OBS, secret, moteur de jeu ou route serveur n’est modifié.
8. Les tests existants sont adaptés sans affaiblir les assertions de permission, d’invitation, de persistance et de contraste.
9. Captures réelles desktop et mobile comparées aux références approuvées ; aucun scroll horizontal.
