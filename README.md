# Diceway

Compagnon de jeu pour **Barbarians of Lemuria** (création de personnages, bestiaire, scénarios, table de jeu), et bientôt
**Cyberpunk RED**. Front Angular dans `front/`, API Laravel dans `backend/`, documentation des jeux dans `doc/`
(voir `doc/README.md`). Les conventions de code et le détail des écrans sont dans `CLAUDE.md`.

Ce fichier rassemble les commandes utiles au quotidien. Les commandes `docker exec` visent le conteneur `diceway` ;
remplacer `<email>` par l'adresse du compte concerné.

## Démarrer

```bash
# backend, depuis backend/ : l'image, puis l'API (port 8080) et mailpit (http://localhost:8025)
npm run docker:build
npm run docker:start
npm run docker:exec            # un shell dans le conteneur

# front, depuis front/ : le serveur de dev (http://localhost:4200, l'API est relayée vers 8080)
npm start
```

Le conteneur ne monte que `backend/app/` et `backend/database/` : un changement de `routes/`, `tests/` ou `phpunit.xml`
doit y être copié (voir plus bas).

## Après un pull

```bash
docker cp backend/routes/api.php diceway:/var/www/html/routes/api.php   # si les routes ont changé
docker exec diceway php artisan migrate                                  # nouvelles migrations
docker exec diceway php artisan migrate:status | grep Pending            # ce qui reste à passer
docker exec diceway php artisan cpr:reference                            # si backend/database/data/cpr/ a changé
```

Si de nouveaux fichiers de scénario sont arrivés (`doc/bol/scenarios/<saga>/app/*.json`), les réimporter (voir
« Scénarios »).

## Vérifier une modification

```bash
# front, depuis front/
npm run build                  # compilation de production : à lancer après tout changement
npm run lint                   # ESLint et Stylelint
npm test                       # tests unitaires (Vitest)
npm test -- --include src/app/bol/shared/tuile/tuile.spec.ts   # une seule spec
npm run lint:prune             # après avoir corrigé une dette listée dans les fichiers de suppressions

# back : les tests tournent dans le conteneur (SQLite en mémoire ; la machine hôte n'a pas le pilote)
docker cp backend/tests/. diceway:/var/www/html/tests/
docker exec diceway php artisan test
docker exec diceway php artisan test --filter BolSceneJets
```

## Scénarios

Les scénarios vivent dans la base de chaque machine, pas dans git : on les importe depuis leurs fichiers JSON (format :
`doc/bol/scenarios/format-import.md`).

```bash
docker cp doc/bol/scenarios/le-dieu-voile/app/ch1.json diceway:/tmp/ch1.json
docker exec diceway php artisan bol:import-scenario /tmp/ch1.json --user=<email> --dry-run   # vérifier seulement
docker exec diceway php artisan bol:import-scenario /tmp/ch1.json --user=<email>             # importer
```

- Importer les chapitres d'un scénario **dans l'ordre** (`intro`, puis `ch1`… `ch5`) : un chapitre reprend des
  personnages créés par les précédents.
- Un réimport met à jour ce que le fichier a créé, sans doublon, mais **écrase** les scènes et les fiches modifiées dans
  l'app depuis. Il ne touche pas aux portraits.

Ce qui est déjà importé, par saga :

```bash
docker exec diceway php artisan tinker --execute='echo json_encode(DB::table("bol_import_ref")->select("saga", DB::raw("count(*) n"))->groupBy("saga")->get());'
```

Les **jets** d'un nouveau scénario : le script lit la mise en scène (`jeu`) de ses scènes et propose des jets dans un
rapport à relire ; il n'écrit rien dans les fichiers JSON.

```bash
python3 -I doc/bol/scenarios/outils/extraire-jets.py doc/bol/scenarios/<saga>   # → <saga>/app/jets-a-relire.md
```

## Portraits

Les prompts des planches sont dans `doc/bol/image-prompts/` (catalogue) et `doc/bol/scenarios/<saga>/portraits.md`
(PNJ des scénarios). Une planche : 1536 × 1024, 3 colonnes × 2 lignes de cases de 512.

**Découper une planche** en six portraits 512 × 512 WebP, nommés `<saga>--<clé>.webp` (ou `<clé>.webp`), 3 px rognés par
bord pour ne rien garder de la case voisine :

```bash
magick planche.png -crop 512x512 +repage -shave 3x3 -resize 512x512 -quality 90 case-%d.webp
# case-0 … case-5 : ligne du haut de gauche à droite, puis ligne du bas ; renommer d'après le tableau des planches
```

Sans ImageMagick, Python (Pillow) fait la même chose :

```python
from PIL import Image
im = Image.open('planche.png').convert('RGB'); xs, ys, r = [0, 512, 1024, 1536], [0, 512, 1024], 3
noms = ['cl1-mariage-amer--khalaman', 'cl1-mariage-amer--jil']  # … les six, dans l'ordre des cases
for i, nom in enumerate(noms):
    c, l = i % 3, i // 3
    im.crop((xs[c] + r, ys[l] + r, xs[c + 1] - r, ys[l + 1] - r)).resize((512, 512), Image.LANCZOS).save(f'{nom}.webp', quality=90)
```

Si ChatGPT a décalé la grille, mesurer les coupures réelles et découper dessus, ou recadrer la case à la main.

**Poser les portraits** sur les fiches d'un compte (chaque fichier retrouve sa fiche par sa clé d'import) :

```bash
docker cp portraits/. diceway:/tmp/portraits
docker exec diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --dry-run
docker exec -u www-data diceway php artisan bol:import-portraits /tmp/portraits --user=<email>
docker exec -u www-data diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --force   # remplacer un portrait déjà posé
docker exec diceway rm -rf /tmp/portraits
```

Toujours avec `-u www-data` quand on écrit : en root, Apache ne peut plus écrire dans le dossier des portraits.

**Les fichiers** sont dans `storage/app/public/portraits/` du conteneur.

```bash
docker exec -u www-data diceway php artisan bol:prune-portraits --dry-run   # les fichiers qu'aucune fiche ne porte plus
docker exec -u www-data diceway php artisan bol:prune-portraits             # les effacer
docker cp diceway:/var/www/html/storage/app/public/portraits ./portraits-sauvegarde   # en garder une copie avant
docker exec -u www-data diceway php artisan bol:extract-portraits           # une fois par machine : sortir les anciens portraits base64 en fichiers
```

`bol:prune-portraits` ignore les fichiers de moins de 24 heures (un portrait tout juste envoyé n'est peut-être pas
encore enregistré sur sa fiche) : un portrait remplacé aujourd'hui n'est effacé que le lendemain.

## Cyberpunk RED

Les données de référence (les lignes du livre) sont dans `backend/database/data/cpr/<table>.php`, chacune avec un `id`
fixe. Après les avoir modifiées :

```bash
docker exec diceway php artisan cpr:reference --dry-run          # ce qui changerait
docker exec diceway php artisan cpr:reference                    # toutes les tables
docker exec diceway php artisan cpr:reference cpr_cyber          # une table
```

## Voir l'app dans un navigateur sans tête

Playwright est installé dans `front/`. Lancer son propre serveur sur le port 4400, pour ne pas gêner celui d'IntelliJ
sur 4200 :

```bash
cd front
npx ng serve --port 4400 &
APP_URL=http://localhost:4400 npm run screenshot -- /login /tmp/login.png   # une capture pleine page, avec les erreurs de la console
npm run e2e:theatre                                # la table de bout en bout : mode libre, scènes, casting, y compris en combat
npm run e2e:petit-bouclier
```

Les scripts e2e créent des tables « TMP … » (et `e2e:theatre` un scénario « TMP Théâtre ») sur le compte de test et les suppriment à la fin ; un script coupé en cours
peut en laisser une.
