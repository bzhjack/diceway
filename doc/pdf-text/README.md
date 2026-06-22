# Extractions texte du PDF de règles

Texte extrait de `doc/Pdf BoL Mythic Livre de base VF 1.3.pdf` (217 pages) via :

```bash
pdftotext -layout -f <première page PDF> -l <dernière page PDF> "Pdf BoL Mythic Livre de base VF 1.3.pdf" <fichier>.txt
```

Rappel pagination : **page PDF = page livre + 2** (ex. livre p. 56 = PDF p. 58).
Les noms de fichiers indiquent les pages **livre**.

| Fichier | Contenu | Pages livre |
| --- | --- | --- |
| `bol-complet.txt` | Livre entier | 1-215 |
| `01-creation-p12-55.txt` | Création des héros | 12-55 |
| `01b-races-p90-95.txt` | Options raciales jouables | 90-95 |
| `02-combat-p56-66.txt` | Actions et combat | 56-66 |
| `03-guerre-p67-81.txt` | Guerre terrestre et navale | 67-81 |
| `04-bestiaire-pnj-p108-135.txt` | Bestiaire, morts-vivants, démons, PNJ | 108-135 |
| `05-magie-p138-157.txt` | Alchimie, foi, sorcellerie | 138-157 |
| `06-progression-p164-166.txt` | Progression et suivants | 164-166 |

Usage : vérifier l'alignement de `doc/rules/*.md` avec le texte du livre sans relancer `pdftotext`.
