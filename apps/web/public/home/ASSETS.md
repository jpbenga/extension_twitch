# Ressources de l’accueil

- `dmsans.ttf` : police variable DM Sans originale, récupérée depuis
  https://github.com/google/fonts/tree/main/ofl/dmsans ; licence `dmsans-OFL.txt`.
- `spacegrotesk.ttf` : police variable Space Grotesk originale, récupérée depuis
  https://github.com/google/fonts/tree/main/ofl/spacegrotesk ; licence `spacegrotesk-OFL.txt`.
- `undercover-reference.png` : copie binaire non modifiée de la référence utilisateur
  `docs/ux/redesign/accueil-desktop/approved.png`. Le CSS ne cadre que la zone de
  l’illustration ; aucune retouche ni génération d’image alternative. Repli local
  utilisé pendant le chargement ou si le CDN de l’illustration n’est pas accessible.

L’image distante originale est celle référencée par les deux exports HTML approuvés.
Le Cloud ne peut pas télécharger ce domaine (refus réseau HTTP 403). L’accueil peut
l’afficher directement lorsque le navigateur y accède, avec absence de référent et
sans credentials Stitch. Sa géométrie ne change pas au chargement. Aucun appel à
l’API Stitch ni fichier d’authentification n’est nécessaire au rendu ou au build.
Le repli a un recadrage plus serré que l’original ; il ne contient aucune donnée de partie.

Ces ressources statiques de référence ne constituent pas une bibliothèque de médias
utilisateurs. Ne pas appliquer la même copie à des captures de sessions privées.
