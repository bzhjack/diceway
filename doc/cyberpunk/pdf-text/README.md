# Extractions texte du livre de base

Texte extrait de `doc/cyberpunk/pdf/Cyberpunk RED - Livre de base VF.pdf` (Arkhane Asylum, 2021, 464 pages) via :

```bash
pdftotext -q -layout -f <première page PDF> -l <dernière page PDF> "Cyberpunk RED - Livre de base VF.pdf" - \
  | grep -v -E '^\s*Paolo Bidault\s*$' > <fichier>.txt
```

Le `grep` retire le filigrane nominatif répété en pied de chaque page du PDF.

Rappel pagination : **page PDF = page livre + 4** (ex. livre p. 167 = PDF p. 171).
Les noms de fichiers indiquent les pages **livre**. Le texte est en deux colonnes : `-layout` les garde côte à côte, il faut donc lire chaque colonne séparément.

| Fichier | Chapitre du livre | Contenu | Pages livre |
| --- | --- | --- | --- |
| `cpr-complet.txt` | — | Livre entier, couverture comprise (`\f` entre les pages) | 1-460 |
| `01-never-fade-away-p5-16.txt` | Never Fade Away | Nouvelle d'ouverture (fiction) | 5-16 |
| `02-au-bord-du-gouffre-p17-26.txt` | Au bord du gouffre | Introduction au jeu de rôle, argot de la Rue | 17-26 |
| `03-roles-p27-42.txt` | L'âme et la nouvelle machine | Les rôles, les trois méthodes de création | 27-42 |
| `04-histoires-de-la-rue-p43-70.txt` | Histoires de la Rue | Parcours de vie (lifepath) | 43-70 |
| `05-caracteristiques-competences-equipement-p71-106.txt` | Paré pour le futur | Caractéristiques, compétences, armes et armures, attirail de départ | 71-106 |
| `06-cybermateriel-p107-120.txt` | Fusionner le cyber et le punk | Cyberpsychose, cyberimplants | 107-120 |
| `07-la-chute-des-tours-p121-124.txt` | La chute des tours | Fiction | 121-124 |
| `08-resolution-des-actions-p125-166.txt` | Passer aux choses sérieuses | Jouer une scène, résolution par compétence, liste des compétences, capacités de rôle, multiclassage | 125-166 |
| `09-combat-p167-194.txt` | Fusillade du vendredi soir | Combat à distance et de mêlée, dégâts, armure, combat en véhicule, réputation | 167-194 |
| `10-netrunning-p195-218.txt` | Netrunning | Actions et combat dans le NET, programmes, cyberconsoles, architectures | 195-218 |
| `11-trauma-team-p219-232.txt` | Trauma Team | Seuils de blessure, stabilisation et guérison, drogues, thérapie, cyberpsychose | 219-232 |
| `12-sombre-futur-p233-256.txt` | Bienvenue dans un sombre futur | Histoire jusqu'à la 4e Guerre corporatiste | 233-256 |
| `13-ere-du-rouge-p257-282.txt` | L'Ère du Rouge | Le monde après la guerre, néocorpos | 257-282 |
| `14-night-city-p283-314.txt` | Bienvenue à Night City | Histoire, habitants, gangs, sites | 283-314 |
| `15-vie-quotidienne-p315-332.txt` | La vie quotidienne à l'Ère du Rouge | Logement, transports, nourriture, loisirs | 315-332 |
| `16-economie-de-la-rue-p333-386.txt` | La nouvelle économie de la Rue | Marchés de nuit, catalogue du matériel, gagner sa vie | 333-386 |
| `17-maitriser-cyberpunk-p387-424.txt` | Maîtriser Cyberpunk | Arcs, progression, sbires et hommes de main, rencontres | 387-424 |
| `18-screamsheets-p425-434.txt` | Screamsheets | Accroches de scénario | 425-434 |
| `19-black-dog-p435-449.txt` | Black Dog | Nouvelle de clôture (fiction) | 435-449 |
| `20-fiche-de-personnage-p450-452.txt` | — | Fiche de personnage vierge | 450-452 |
| `21-index-p453-455.txt` | — | Index | 453-455 |

Usage : vérifier l'alignement de `doc/cyberpunk/rules/*.md` avec le texte du livre sans relancer `pdftotext`.
