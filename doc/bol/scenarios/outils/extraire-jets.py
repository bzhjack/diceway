#!/usr/bin/env python3
"""Propose les jets d'une saga à partir du texte « jeu » (« Mise en scène ») de ses scènes.

Usage : python3 -I doc/bol/scenarios/outils/extraire-jets.py doc/bol/scenarios/la-perle-du-beshaar

Lit `<saga>/app/*.json` sans les modifier et écrit `<saga>/app/jets-a-relire.md` : pour chaque scène, les phrases qui citent un attribut
(Vigueur, Agilité, Esprit, Aura, ou « réaction », qui devient Esprit), avec l'attribut et la difficulté proposés (« Ardu » → ardue, sans
difficulté → moyenne). Les phrases de combat (Mêlée, Tir, Défense, « Att + n ») sont ignorées : ce ne sont pas des jets de la liste. Ce
qu'il ne sait pas trancher (deux attributs, deux jets dans une phrase, une difficulté qui ne colle pas à son modificateur) est signalé.
La relecture décide : le script ne fait qu'une proposition.
"""
import glob
import json
import os
import re
import sys

ATTRIBUTS = {'vigueur': 'vigueur', 'agilité': 'agilite', 'agilite': 'agilite', 'esprit': 'esprit', 'aura': 'aura', 'réaction': 'esprit'}
DIFFICULTES = [
    ('très facile', 'tres-facile', 2), ('très difficile', 'tres-difficile', -4), ('facile', 'facile', 1), ('moyenne', 'moyenne', 0),
    ('moyen', 'moyenne', 0), ('ardue', 'ardue', -1), ('ardu', 'ardue', -1), ('difficile', 'difficile', -2),
    ('impossible', 'impossible', -6), ('héroïque', 'heroique', -8),
]
COMBAT = re.compile(r"\b(mêlée|tir|défense|initiative)\b|\batt\s*[+−-]\s*\d", re.I)
# Un attribut s'écrit avec sa majuscule (« Esprit », « Aura ») ou après « jet de / jets d' » : « l'inhumation aura lieu », « l'esprit
# sacré du marais » ne sont pas des jets. « réaction » hors combat est un jet d'Esprit.
ATTRIBUT = re.compile(r"\b(Vigueur|Agilité|Esprit|Aura)\b|(?<=jet d')(?:vigueur|agilité|esprit|aura)\b|(?<=jets d')(?:vigueur|agilité|esprit|aura)\b|(?<=jet de )(?:vigueur|réaction)\b|\b(?<!jet de )réaction\b(?= (?:Ardue?|Difficile|Moyenne?|Facile|Très))")
DIFFICULTE = re.compile(r"\b(très facile|très difficile|facile|moyenne?|ardue?|difficile|impossible|héroïque)\b\s*(?:\(([+−-]?\s*\d)\))?", re.I)


def phrases(texte: str) -> list[str]:
    morceaux = []
    for ligne in texte.split('\n'):
        ligne = ligne.strip(' •-\t')
        if ligne:
            morceaux.extend(p.strip() for p in re.split(r'(?<=[.;!?])\s+(?=[A-ZÉÈÀ«])', ligne) if p.strip())
    return morceaux


def proposer(phrase: str) -> dict | None:
    attributs = []
    for m in ATTRIBUT.finditer(phrase):
        cle = ATTRIBUTS[m.group(0).lower()]
        if cle not in attributs:
            attributs.append(cle)
    if not attributs:
        return None
    alertes = []
    if COMBAT.search(phrase) and not re.search(r"\b(vigueur|agilit[ée]|esprit|aura)\b", phrase, re.I):
        return None
    if COMBAT.search(phrase):
        alertes.append('phrase de combat mêlée à un jet : garder seulement le jet')
    difficulte, trouvees = 'moyenne', []
    for m in DIFFICULTE.finditer(phrase):
        mot = m.group(1).lower()
        slug, mod = next((s, v) for nom, s, v in DIFFICULTES if nom == mot)
        trouvees.append(slug)
        if m.group(2) is not None:
            ecrit = int(m.group(2).replace('−', '-').replace(' ', ''))
            if ecrit != mod:
                alertes.append(f'« {m.group(0)} » : {mot} vaut {mod:+d}, le texte dit {ecrit:+d}')
    if trouvees:
        difficulte = trouvees[0]
    if len(attributs) > 2:
        alertes.append('plus de deux attributs')
    if len(set(trouvees)) > 1 or len(ATTRIBUT.findall(phrase)) > len(attributs):
        alertes.append('peut-être deux jets enchaînés : à couper en deux')
    if 'réaction' in phrase.lower():
        alertes.append('« réaction » hors combat → Esprit')
    return {'attributs': attributs[:2], 'difficulte': difficulte, 'alertes': alertes}


def main(saga: str) -> None:
    lignes = [f'# Jets à relire — {os.path.basename(saga.rstrip("/"))}', '',
              'Proposition du script `doc/bol/scenarios/outils/extraire-jets.py`, à relire : rien n\'est écrit dans les fichiers JSON.', '']
    total = 0
    for fichier in sorted(glob.glob(os.path.join(saga, 'app', '*.json'))):
        data = json.load(open(fichier, encoding='utf-8'))
        lignes.append(f'## {os.path.basename(fichier)}')
        lignes.append('')
        for scene in data.get('scenes', []):
            props = [(p, proposer(p)) for p in phrases(scene.get('jeu') or '')]
            props = [(p, j) for p, j in props if j]
            if not props:
                continue
            lignes.append(f'### {scene.get("cle")} — {scene.get("titre")}')
            for phrase, jet in props:
                total += 1
                attr = ' ou '.join(jet['attributs'])
                lignes.append(f'- **{attr}, {jet["difficulte"]}** — {phrase}')
                for alerte in jet['alertes']:
                    lignes.append(f'  - ⚠ {alerte}')
            lignes.append('')
    lignes.insert(3, f'{total} phrases proposées.')
    lignes.insert(4, '')
    sortie = os.path.join(saga, 'app', 'jets-a-relire.md')
    open(sortie, 'w', encoding='utf-8').write('\n'.join(lignes) + '\n')
    print(f'{total} phrases → {sortie}')


if __name__ == '__main__':
    main(sys.argv[1])
