# Pont local Stitch → dépôt → Codex Cloud

Projet : **Extension Twitch UX Redesign**, `7117487747163082855`.

Les blocs Lobby et Joueur, validés humainement le 28 octobre 2026, proviennent
respectivement des projets `6846916727190844173` et `16851612906193292413`.
Leur [guide de synchronisation groupée](BLOCKS-3-4.md) utilise les 21 IDs précis
validés. Le défaut des commandes historiques reste le projet ci-dessus.

Les 21 références ont été reçues au commit `3c2e704`. Voir le
[bilan de leur intégration, les captures et le guide humain](LOBBY-PLAYER-IMPLEMENTATION.md).

Les **43 références APPROVED des blocs 5, 6 et 7** sont disponibles dans ce dépôt avec captures natives, HTML, SPEC complètes et rendus de viewport. Voir [le guide de reprise Cloud](BLOCKS-5-6-7.md) et [le manifeste exact](blocks-5-6-7/manifest.json). Leur validation humaine est acquise ; aucun accès Stitch ni nouvelle validation UX n’est nécessaire pour commencer l’intégration depuis ces artefacts.

Les **28 références APPROVED Undercover A/B** sont désormais disponibles dans [le dossier de reprise Cloud](undercover-next/README.md) : séries de stream et Broadcast TV. L’approbation humaine est acquise ; les captures, HTML, preuves mobiles/alpha et SPEC sont versionnés, sans accès Stitch requis. Voir aussi [le raccordement préparation/séries/Broadcast](UNDERCOVER-PREPARATION-BROADCAST-HANDOFF.md).

Les **36 références APPROVED de consolidation Undercover et Motion TV**, validées humainement le 29 octobre 2026, sont disponibles dans [le dossier de reprise Cloud](undercover-consolidation-motion/README.md) : 24 références UX, 12 fiches Stitch Motion, 4 prototypes et 8 vidéos. Lire le [handoff](undercover-consolidation-motion/HANDOFF.md) avant intégration. La validation visuelle est acquise ; les conséquences backend encore ouvertes restent distinguées.

```text
écran actuel → Stitch BEFORE → itération Stitch → validation humaine APPROVED
→ synchronisation locale → Git → Codex Cloud → implémentation de l’écran
→ capture réelle → comparaison avec la référence approuvée
```

Stitch définit la référence **visuelle**. Le dépôt reste la référence **fonctionnelle** :
sessions, permissions, moteur Undercover, projections privées/publiques, SSE et OBS.
On travaille écran par écran, sans reconstruire l’application à partir d’un export.
La dernière génération n’est jamais automatiquement considérée comme approuvée.

## Une commande après validation

Depuis le dépôt local sur le Mac, avec Node 24 et npm 11 :

```sh
npm ci
stitch --version
stitch status
npm run stitch:sync -- --screen <SCREEN_ID> --slug player-secret-mobile --approved
```

Remplacez `<SCREEN_ID>` par l’identifiant de **l’écran précis que vous avez validé**.
`--approved` est votre attestation de validation humaine ; ce n’est pas un statut
que le script prétend vérifier auprès de Stitch. Un titre contenant APPROVED ne
suffit pas à lui seul. Un ID ne sélectionne jamais automatiquement une nouvelle génération.

Pour un écran issu d'un autre projet, ajoutez `--project <PROJECT_ID>` : cette option
est transmise explicitement à chaque lecture et téléchargement. Elle ne réécrit
pas `.stitch.json` et ne change pas le projet par défaut. Le projet et l'écran
retournés sont contrôlés, et un changement de projet dans un dossier déjà exporté
exige `--replace`, même si le Screen ID est identique.

Vous pouvez préciser la surface dans le registre :

```sh
npm run stitch:sync -- --screen <SCREEN_ID> --slug player-secret-mobile --surface "Joueur · Secret · Mobile" --approved
```

Pour les deux écrans d’accueil déjà désignés comme validés par l’utilisateur :

```sh
npm run stitch:sync -- --screen 70b5e989c97d4b9fa64f3add659e116b --slug accueil-desktop --surface "Accueil · Ordinateur" --approved
npm run stitch:sync -- --screen 15989136117558531304 --slug accueil-mobile --surface "Accueil · Mobile" --approved
```

Ces deux références ont été synchronisées localement, poussées au commit `1f7607c`
et récupérées dans le Cloud. Les SPEC fonctionnelles ont été complétées au commit
`3c02734`. Voir le [bilan de leur première intégration](HOME-IMPLEMENTATION.md).

Résultat :

```text
docs/ux/redesign/player-secret-mobile/
├── before.png      # facultatif, ajouté séparément, jamais modifié par le script
├── approved.png    # ou .jpg/.webp selon les octets réellement reçus
├── approved.html   # seulement si fourni, téléchargé et contrôlé
└── SPEC.md
```

Le script renseigne l’origine et les références, mais ne remplit pas les intentions
fonctionnelles à votre place. Complétez les deux sections de SPEC.md avant de
demander l’implémentation. Conservez aussi les ressources nécessaires à la fidélité
du design si l’HTML dépend d’images distantes : ce premier pont ne les aspire pas.

Puis relisez et versionnez les artefacts :

```sh
git status --short
git diff -- docs/ux/redesign .stitch.json
git add docs/ux/redesign .stitch.json
git commit -m "docs: add approved Stitch screen"
git push
```

Le script ne fait **aucun commit ni push**. Les images doivent aussi être examinées
visuellement : aucun contrôle automatique ne peut garantir l’absence d’un secret
dessiné dans une image ou d’informations personnelles dans un design.

## Installation et commandes réellement vérifiées

La syntaxe a été consultée dans l’aide de la CLI officielle **@google/stitch 0.12.0**,
installée temporairement dans le Cloud pour l’audit, sans authentification. Le script
exige cette version précise ; si une autre version est installée, il s’arrête avec une
explication au lieu d’essayer une syntaxe non vérifiée. Au besoin, sur le Mac :

```sh
npm install -g @google/stitch@0.12.0
stitch login
stitch --help
stitch get screen --help
stitch download --help
```

Commandes de lecture disponibles, vérifiées dans cette version :

```sh
stitch status --json
stitch find projects --json
stitch get project 7117487747163082855 --json
stitch find screens --project 7117487747163082855 --fields id,title --format json
stitch get screen <SCREEN_ID> --project 7117487747163082855 --json --no-cache
stitch download screen <SCREEN_ID> --project 7117487747163082855 --format png --output <FICHIER_TEMPORAIRE> --json --no-cache
stitch download screen <SCREEN_ID> --project 7117487747163082855 --format html --output <FICHIER_TEMPORAIRE> --json --no-cache
```

Le script utilise les commandes get/download avec projet explicite, jamais generate,
edit, upload, create ou delete. Le téléchargement est géré par l’authentification
locale de la CLI ; le script ne lit pas ses fichiers d’identifiants et ne manipule
pas lui-même de jeton. Il n’utilise jamais `stitch status --token` ni `--trace`.

`.stitch.json` contient uniquement `{ "project": "7117487747163082855" }` : il est
versionnable. Cette forme a aussi été vérifiée avec `stitch config set project` dans
un dossier temporaire isolé, sans changer de projet réel. Un fichier existant avec
d’autres champs est refusé par le script, sans afficher ou réécrire son contenu.

## Mise à jour et préservation

- La synchronisation du même écran et du même slug actualise les références sans
  dupliquer le registre. Elle préserve les sections manuelles de SPEC.md, les notes,
  les ressources et les captures before.
- Pour un autre Screen ID, choisissez de préférence un nouveau slug. Pour remplacer
  explicitement la référence du même écran UX après nouvelle validation, ajoutez
  `--replace` à la commande. L’historique Git conservera la référence précédente.
- Les seules sections réécrites dans SPEC.md et SCREENS.md sont délimitées par les
  commentaires `stitch:reference:start/end` et `stitch:screens:start/end`. Ne les
  retirez pas. Le script refuse une structure ambiguë au lieu d’effacer le document.
- Les fichiers `approved.*` sont réservés aux exports. Un ancien HTML est retiré si
  la nouvelle synchronisation ne fournit pas d’HTML utilisable, afin de ne pas
  associer un export périmé à la nouvelle capture. Les changements restent visibles
  dans Git et ne sont jamais committés automatiquement.
- Capture obligatoire ; HTML facultatif. Les téléchargements passent d’abord dans
  un dossier temporaire local et sont contrôlés avant remplacement. Un échec de
  capture laisse les références antérieures intactes. Les synchronisations sont
  sérialisées par un verrou. Une erreur d’écriture tente de restaurer les fichiers
  précédents ; une coupure du processus/de la machine exige de relire git diff.
- Après une interruption brutale uniquement, vérifiez qu’aucun `stitch:sync` ne
  tourne encore avant de supprimer `docs/ux/redesign/.stitch-sync.lock`. Les fichiers
  de préparation `.stitch-next-*` sont ignorés et peuvent alors être nettoyés.

## Sécurité et indépendance du Cloud

Les credentials Google restent strictement locaux, hors Git. Le dossier `.stitch/`
est ignoré ; la configuration de projet `.stitch.json` est distincte. Ni réponses
JSON brutes de la CLI, ni URLs signées de téléchargement, ni diagnostics
d’authentification ne sont enregistrés dans les références. Les erreurs de commande
sont résumées sans afficher stdout/stderr. Un contrôle détecte des formats courants
de jetons, clés et liens signés dans les métadonnées/exports ; il ne remplace pas la
relecture humaine ni un audit de sécurité.

L’HTML est une **référence non fiable**, pas du code applicatif à exécuter ou copier
automatiquement. Il peut contenir des scripts et dépendances distantes propres à
Stitch. Il n’est ni servi par Next, ni importé, ni exécuté par la synchronisation.
Le script conserve les octets de l’export HTML, sans reformattage ni réécriture des
assets. Ne transmettez jamais d’identifiants à ses ressources externes.

Codex Cloud peut ensuite lire les artefacts committés sans Stitch, sans nouvelle
authentification et sans dépendance de compilation à la CLI. Aucun écran n’est
refondu par cette tâche. Les couleurs, typographies et composants futurs devront
être tirés des références réellement approuvées ; aucun DESIGN.md visuel n’est
inventé pendant la mise en place du transport.

## État de la vérification

La CLI Cloud temporaire confirme `authenticated: false` et aucune autorisation
Canvas. L’accès au projet réel et son téléchargement ne peuvent donc pas être
validés ici. Les tests automatisés du pont utilisent des réponses CLI et artefacts
fictifs isolés, sans credentials : ils vérifient le pipeline, pas la connexion Google.
Le premier export réel doit être lancé sur la machine locale déjà authentifiée.
