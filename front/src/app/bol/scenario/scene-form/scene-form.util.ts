import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {BolSceneChanges, BolSceneDistributionSaisie, BolSceneJet, BolSceneModel, SceneMoment} from '../../models/bol-scene.model';
import {CombatantKind, CombatCatalogEntry} from '../../models/combat-selection.model';
import {combatantRankKey} from '../../session/combat-statblock.util';
import {LibraryRang} from '../../shared/models/library-rows.model';
import {EMPTY_AVATAR} from '../../../shared/avatar-fallback/avatar.util';
import {JetSaisie, SceneFormValue, ScenePersonnageVue} from '../models/scene-form.model';

/** Nom du type d'une fiche, au singulier. */
export const KIND_LABEL: Record<CombatantKind, string> = {hero: 'Héros', pnj: 'PNJ', creature: 'Créature', demon: 'Démon'};

/** Au plus, les exemplaires d'une créature ou d'un démon (`BolSceneDistribution::QTY_MAX`). */
export const QTY_MAX = 30;
/** Au plus, les personnages d'une scène (`BolSceneDistribution::SAISIE_MAX`). */
export const PERSONNAGES_MAX = 60;

/** Texte rogné ; `null` s'il est vide. */
function texte(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

/** La valeur du formulaire pour une scène : les champs absents deviennent des textes vides, un danger absent devient 0. */
export function sceneFormValue(scene: BolSceneModel | null): SceneFormValue {
  if (!scene) {
    return {titre: '', region_id: null, lieu: '', moment: null, meteo: null, danger: 0, lecture: '', jeu: '', notes: '', jets: [], pistes: []};
  }
  return {
    titre: scene.titre,
    region_id: scene.region_id,
    lieu: scene.lieu ?? '',
    moment: scene.moment,
    meteo: scene.meteo,
    danger: scene.danger ?? 0,
    lecture: scene.lecture ?? '',
    jeu: scene.jeu ?? '',
    notes: scene.notes ?? '',
    jets: (scene.jets ?? []).map(jetSaisi),
    pistes: (scene.pistes ?? []).map((piste) => ({...piste})),
  };
}

/** Un jet enregistré, à saisir : ses textes absents deviennent vides. */
function jetSaisi(jet: BolSceneJet): JetSaisie {
  return {
    titre: jet.titre,
    attributs: [...jet.attributs],
    difficulte: jet.difficulte,
    enjeu: jet.enjeu ?? '',
    echec: jet.echec ?? '',
    reussite: jet.reussite ?? '',
    carriere: jet.carriere ?? '',
    quand: jet.quand ?? '',
  };
}

/** Les jets à enregistrer : textes rognés, vides à `null`, jets sans titre retirés ; aucun jet : `null`. */
function jetsAEnregistrer(jets: readonly JetSaisie[]): BolSceneJet[] | null {
  const gardes = jets
    .map((jet) => ({
      titre: jet.titre.trim(),
      attributs: [...jet.attributs],
      difficulte: jet.difficulte,
      enjeu: texte(jet.enjeu),
      echec: texte(jet.echec),
      reussite: texte(jet.reussite),
      carriere: texte(jet.carriere),
      quand: texte(jet.quand),
    }))
    .filter((jet) => jet.titre !== '');
  return gardes.length ? gardes : null;
}

/** Les changements à enregistrer pour une valeur du formulaire : textes rognés, vides à `null`, danger 0 à `null`, jets sans titre et
 * pistes sans texte retirés (aucun : `null`). L'illustration n'y est pas : elle ne change pas. */
export function sceneChanges(value: SceneFormValue): BolSceneChanges {
  const pistes = value.pistes
    .map((piste) => ({texte: piste.texte.trim(), scene_id: piste.scene_id}))
    .filter((piste) => piste.texte !== '');
  return {
    titre: value.titre.trim(),
    region_id: value.region_id,
    lieu: texte(value.lieu),
    moment: value.moment,
    meteo: value.meteo,
    danger: value.danger > 0 ? value.danger : null,
    lecture: texte(value.lecture),
    jeu: texte(value.jeu),
    notes: texte(value.notes),
    jets: jetsAEnregistrer(value.jets),
    pistes: pistes.length ? pistes : null,
  };
}

/** Les personnages d'une scène, à éditer : camp `adversaires` et attitude `null` pour les scènes enregistrées avant qu'ils n'existent. */
export function personnagesDe(scene: BolSceneModel | null): BolSceneDistributionSaisie[] {
  return (scene?.distribution ?? []).map((entree) => ({
    kind: entree.kind,
    source_id: String(entree.source_id),
    qty: Math.max(1, entree.qty),
    camp: entree.camp === 'heros' ? 'heros' : 'adversaires',
    attitude: entree.attitude ?? null,
  }));
}

/** Les mêmes personnages, dans le même ordre, avec les mêmes réglages. */
export function memesPersonnages(gauche: readonly BolSceneDistributionSaisie[], droite: readonly BolSceneDistributionSaisie[]): boolean {
  return (
    gauche.length === droite.length &&
    gauche.every((p, i) => {
      const q = droite[i];
      return p.kind === q.kind && p.source_id === q.source_id && p.qty === q.qty && p.camp === q.camp && p.attitude === q.attitude;
    })
  );
}

const RANG_DE_LA_CLE = {rival: 'R', coriace: 'C', pietaille: 'P'} as const;
/** Ce qu'on lit à voix haute en une minute, en mots. */
const MOTS_PAR_MINUTE = 150;

/** Le rang d'une fiche, en lettre comme dans les bibliothèques (`bol-rang`). */
export function rangDe(fiche: CombatCatalogEntry): LibraryRang {
  const cle = combatantRankKey(fiche);
  return cle ? RANG_DE_LA_CLE[cle] : 'C';
}

const MOMENT_EN_PHRASE: Record<SceneMoment, string> = {aube: "à l'aube", jour: 'de jour', crepuscule: 'au crépuscule', nuit: 'de nuit'};

/** L'ambiance d'une scène en une phrase, pour le bandeau d'« Ajouter des personnages » : « Jalad Nût, de nuit, danger 4 ». */
export function ambianceEnPhrase(value: Pick<SceneFormValue, 'lieu' | 'moment' | 'danger'>): string {
  return [value.lieu.trim(), value.moment ? MOMENT_EN_PHRASE[value.moment] : '', value.danger > 0 ? `danger ${value.danger}` : '']
    .filter(Boolean)
    .join(', ');
}

/** Une fiche a un vrai portrait (pas l'avatar vide) : sinon, son initiale le remplace. */
export function aUnPortrait(avatar: string | null | undefined): boolean {
  return Boolean(avatar) && avatar !== EMPTY_AVATAR;
}

/** Combien de personnages la scène met de chaque côté, exemplaires compris. */
export function compteDesCamps(personnages: readonly BolSceneDistributionSaisie[]): {adversaires: number; allies: number; heros: number} {
  return personnages.reduce(
    (compte, p) =>
      p.kind === 'hero'
        ? {...compte, heros: compte.heros + 1}
        : p.camp === 'heros'
          ? {...compte, allies: compte.allies + p.qty}
          : {...compte, adversaires: compte.adversaires + p.qty},
    {adversaires: 0, allies: 0, heros: 0},
  );
}

/** Le temps de lire un texte à voix haute, à la minute près (« 2 min ») ; `null` pour un texte vide. */
export function dureeDeLecture(texte: string): string | null {
  const mots = texte.trim().split(/\s+/).filter(Boolean).length;
  return mots ? `${Math.max(1, Math.round(mots / MOTS_PAR_MINUTE))} min` : null;
}

/** La clé d'un personnage ou d'une fiche dans la scène : `pnj:12`, `creature:4`. */
export function cleDuPersonnage(kind: string, sourceId: string | number): string {
  return `${kind}:${sourceId}`;
}

/** La scène avec une fiche de plus, en adversaire, sans attitude : une fiche déjà là (PNJ, créature ou démon) gagne un exemplaire plutôt
 * qu'une ligne de plus (jusqu'à `QTY_MAX`), et une scène pleine (`PERSONNAGES_MAX`) ne prend plus de fiche nouvelle. */
export function avecLaFiche(personnages: readonly BolSceneDistributionSaisie[], fiche: CombatCatalogEntry): BolSceneDistributionSaisie[] {
  const kind = fiche.kind;
  const sourceId = String(fiche.sourceId);
  // Un héros (casting de la table) entre une fois, dans son camp, sans attitude.
  if (kind === 'hero') {
    const absent = !personnages.some((p) => p.kind === 'hero' && p.source_id === sourceId);
    return absent && personnages.length < PERSONNAGES_MAX ? [...personnages, {kind, source_id: sourceId, qty: 1, camp: 'heros', attitude: null}] : [...personnages];
  }
  const deja = personnages.findIndex((p) => p.kind === kind && p.source_id === sourceId);
  if (deja >= 0) {
    return avecLeReglage(personnages, deja, {qty: personnages[deja].qty + 1});
  }
  if (personnages.length >= PERSONNAGES_MAX) {
    return [...personnages];
  }
  return [...personnages, {kind, source_id: sourceId, qty: 1, camp: 'adversaires', attitude: null}];
}

/** La scène avec un personnage réglé autrement (nombre, camp, attitude) ; son nombre reste entre 1 et `QTY_MAX`. */
export function avecLeReglage(
  personnages: readonly BolSceneDistributionSaisie[],
  index: number,
  reglage: Partial<Pick<BolSceneDistributionSaisie, 'qty' | 'camp' | 'attitude'>>,
): BolSceneDistributionSaisie[] {
  return personnages.map((p, position) => {
    if (position !== index) {
      return p;
    }
    const regle = {...p, ...reglage};
    return {...regle, qty: Math.min(QTY_MAX, Math.max(1, regle.qty))};
  });
}

/** Les personnages à montrer : chacun avec le nom, le portrait et le type de sa fiche dans le catalogue. Une fiche absente d'un
 * catalogue lu (`catalogueLu`) se dit introuvable ; tant qu'il ne l'est pas (chargement, échec), son nom attend. */
export function personnagesVus(
  personnages: readonly BolSceneDistributionSaisie[],
  catalogue: readonly CombatCatalogEntry[],
  catalogueLu = true,
): ScenePersonnageVue[] {
  const parCle = new Map(catalogue.map((entree) => [cleDuPersonnage(entree.kind, entree.sourceId), entree]));
  return personnages.map((p) => {
    const fiche = parCle.get(cleDuPersonnage(p.kind, p.source_id));
    return {
      ...p,
      nom: fiche?.nom ?? (catalogueLu ? 'Fiche introuvable' : '…'),
      avatar: fiche?.avatar ?? EMPTY_AVATAR,
      type: KIND_LABEL[p.kind],
      rang: fiche ? rangDe(fiche) : null,
      vitalite: fiche?.vitalite ?? null,
      introuvable: catalogueLu && !fiche,
    };
  });
}

/** Ouvre « Préparer la scène » sur sa page ; elle revient à `returnUrl`, par défaut là où l'on est (la table). Depuis un dialogue
 * (« Gérer les scènes », la lecture agrandie), `dialog` les ferme d'abord : un dialogue ne se ferme pas de lui-même quand la page change. */
export function preparerLaScene(router: Router, sceneId: string, returnUrl = router.url, dialog?: MatDialog): void {
  dialog?.closeAll();
  void router.navigate(['/create/scene', sceneId], {state: {returnUrl}});
}

/** Ouvre « Préparer la scène » pour une nouvelle scène, qui naîtra au dernier rang de ce chapitre ; elle revient à `returnUrl`. */
export function creerUneScene(router: Router, chapitreId: string, returnUrl: string): void {
  void router.navigate(['/create/scene'], {queryParams: {chapitre: chapitreId}, state: {returnUrl}});
}
