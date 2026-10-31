# Importer un scénario dans l'app

Un fichier JSON par chapitre décrit le scénario, ses personnages et ses scènes. La commande
`bol:import-scenario` le charge dans la bibliothèque d'un compte.

```bash
# depuis la racine du dépôt (le conteneur ne monte que app/ : copier le fichier d'abord)
docker cp doc/scenarios/la-perle-du-beshaar/app/ch1.json diceway:/tmp/ch1.json
docker exec diceway php artisan bol:import-scenario /tmp/ch1.json --user=<email> --dry-run   # tout vérifier
docker exec diceway php artisan bol:import-scenario /tmp/ch1.json --user=<email>             # importer
```

- **Contrôle avant écriture.** La commande lit tout le fichier avant d'écrire quoi que ce soit. Elle liste
  **toutes** les erreurs d'un coup, chacune avec son chemin, par exemple
  `scenes[2].region : « Atlantide » est inconnu du catalogue (region)`. Une erreur annule tout.
- **`--dry-run` :** fait l'import complet puis l'annule. Il vérifie aussi les personnages repris d'un autre
  chapitre.
- **Propriété.** Tout appartient au compte `--user`, jamais au catalogue public. Ce sont des suppléments du
  commerce.
- **Réimporter met à jour.** La commande retrouve ce qu'elle a créé (table `bol_import_ref`) et le met à jour.
  Les ids ne changent pas, donc une session qui a chargé une scène la garde.
  - Une scène retirée du fichier est supprimée.
  - **Une fiche modifiée dans l'app entre-temps est écrasée** par le fichier.

## Structure

```jsonc
{
  "saga": "perle-du-beshaar",        // regroupe les chapitres d'une même saga
  "scenario": { "cle": "ch1", "titre": "Perle du Beshaar — 1. Sacrilège à Satarla", "pitch": "…" },
  "personnages": { "<clé>": { … } },
  "scenes": [ { … } ]
}
```

**Clés** (`saga`, `scenario.cle`, clés de personnage et de scène) :
- caractères permis : minuscules, chiffres, `-` et `_` ;
- 60 caractères au plus ;
- elles ne changent pas d'un import à l'autre, car c'est par elles que le réimport retrouve ce qu'il a créé.

**Noms du catalogue** (région, carrière, arme, armure, avantage, désavantage, capacité, pouvoir, taille,
catégorie) : ils se comparent sans tenir compte de la casse ni des espaces en trop, et `'` vaut `’`. Un nom
inconnu est une erreur : la commande ne devine pas.

## Personnages

Un personnage est soit une fiche créée pour le scénario, soit une référence au catalogue.

**Référence au catalogue :**

```json
"dino": { "kind": "creature", "catalogue": "Dinohyus" }
```

`kind` vaut `pnj`, `creature` ou `demon`. La valeur de `catalogue` est le nom de la fiche publique.

**PNJ :**

```jsonc
"surdral": {
  "kind": "pnj", "nom": "Surdral Prados", "rang": "rival",          // rival | coriace | pietaille
  "vigueur": 0, "agilite": 2, "esprit": 1, "aura": 1,                // -5 à 10, 0 si absent
  "initiative": 1, "melee": 1, "tir": 0, "defense": 1,
  "vitalite": 10,                                                    // obligatoire
  "heroisme": 0, "vilenie": 0, "foi": 0, "pouvoir": 0,               // 0 si absent
  "region": "Malakut", "commentaire": "Canne au pommeau plombé.",
  "carrieres": [{ "nom": "Voleur", "rang": 3 }],
  "armes": ["Gourdin", { "nom": "Sabre", "degats": "d6+1", "type": "M" }],
  "armures": ["Petit bouclier"],
  "avantages": ["Dur à cuire", { "nom": "Arme favorite", "detail": "sabre" }],
  "desavantages": ["Cupide"]
}
```

- **Armes :**
  - une chaîne désigne une arme du catalogue ;
  - un objet avec `degats` crée une arme propre au scénario (`type` : `M` pour mêlée, `T` pour tir ; `portee`
    et `notes` facultatifs). Elle est créée dans la bibliothèque du compte, retrouvée par son nom au réimport.
- **Équipement :** le PNJ porte toutes ses armes et armures.
- **Vilénie d'un rival :** sa valeur dans le livre, sinon 3, à signaler dans le commentaire de la fiche (consigne de Lionel du
  2026-10-23).
- **Points d'un rival :** la fiche PNJ et le combat n'utilisent que `vilenie`. Les points d'héroïsme d'un
  rival allié (Surdral) se portent donc en `vilenie`. `heroisme` est enregistré, mais l'app ne l'affiche pas
  pour un PNJ.
- **Exemplaires :** un PNJ n'a qu'un exemplaire par entrée de distribution. `"qty": 2` produit deux entrées,
  donc deux cartes.

**Créature :**

```jsonc
"hippocampe": {
  "kind": "creature", "nom": "Hippocampe géant", "taille": "Moyenne",   // la taille donne le rang
  "vigueur": 0, "agilite": 1, "esprit": 0, "attaque": 1, "defense": 0,
  "vitalite": 6, "degats": "d6M", "protection": "1",
  "capacites": [{ "nom": "Attaque spéciale", "detail": "souffle dans la conque : alerte générale" }],
  "commentaire": "…"
}
```

**Démon :**

```jsonc
"tolometh": {
  "kind": "demon", "nom": "…", "categorie": "Majeur",                  // Mineur | Inférieur | Majeur
  "vigueur": 0, "agilite": 0, "esprit": 0, "aura": 0, "melee": 0, "tir": 0, "defense": 0,
  "vitalite": 40, "degats": "d6B",
  "pouvoirs": [{ "nom": "…", "detail": "…" }]
}
```

**Capacités et pouvoirs.** Chacun ne figure qu'une fois par fiche. Une capacité propre au livre (*Gardien
éternel*, *Corps de sable*…) va dans le `detail` d'une capacité générique (`Attaque spéciale`…) ou dans le
`commentaire`.

**Reprendre un personnage d'un autre chapitre.** Un personnage cité dans une distribution sans être défini dans
le fichier est cherché parmi ceux qu'un import précédent **de la même saga** a créés. Surdral, défini dans
`ch1.json`, peut ainsi apparaître dans `ch2.json` sans être redéfini.

## Scènes

Les scènes sont dans l'ordre de la frise :

```jsonc
{
  "cle": "temple",
  "titre": "Le temple de Shazzadion",             // 120 caractères au plus
  "region": "Satarla", "lieu": "Île d'Ajamba",     // lieu : 120 au plus
  "moment": "nuit",                                // aube | jour | crepuscule | nuit
  "meteo": "clair",                                // clair | couvert | pluie | brume | vent | orage | cendres
  "danger": 2,                                     // 1 à 4
  "lecture": "…",                                  // à lire aux joueurs, 5 000 au plus
  "jeu": "…",                                      // En jeu : jets, difficultés, tables, 10 000 au plus
  "notes": "…",                                    // secret du MJ, 10 000 au plus
  "image": "/assets/…",                            // https://… ou /assets/…
  "pistes": [{ "texte": "Entrer dans le sanctuaire", "vers": "sanctuaire" }],
  "distribution": [
    { "perso": "pretre", "qty": 2, "attitude": "neutre" },
    { "perso": "surdral", "camp": "heros", "attitude": "amical" }
  ]
}
```

- **Pistes :**
  - 8 au plus, 200 caractères chacune ;
  - `vers` est facultatif ; s'il est présent, c'est la clé d'une scène **du même fichier** ;
  - pour mener au chapitre suivant, écrire une piste sans `vers`.
- **Distribution :**
  - `qty` va de 1 à 30 (1 par défaut) ;
  - `camp` vaut `adversaires` (par défaut) ou `heros` pour un allié ;
  - `attitude` vaut `hostile`, `mefiant`, `neutre` ou `amical` ;
  - les cartes sont placées par défaut au chargement.
