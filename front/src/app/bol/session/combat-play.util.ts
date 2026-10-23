import {AVANTAGE_RECUPERATION_RAPIDE_ID, DESAVANTAGE_SOUFFRETEUX_ID} from '../bol-rules.constants';
import {BolFightSessionModel, CombatCamp} from '../models/bol-fight-session.model';
import {BolHerosTraitsModel} from '../models/bol-trait.model';
import {buildInitiativeOrderFrom} from './initiative.util';
import {InitiativeSource} from './models/initiative.model';
import {RecoveryTraits} from './models/after-combat-dialog.model';
import {PlayCombatStats, PlayToken, PlayBoard} from './models/combat-play.model';

export const EMPTY_AVATAR = '/assets/bol/empty-avatar.jpg';

/** Portrait d'un PNJ posé en session ou en combat : son avatar s'il en a un, sinon le portrait livré dans les assets —
 * qui n'existe que pour les PNJ du catalogue (sans propriétaire, ids 1 à 15). Un PNJ d'utilisateur sans avatar n'en a
 * pas : deviner son URL ne ferait qu'un 404. */
export function pnjAvatar(p: {pnj_id: string | null; pnj?: {user_id?: string | null; origines?: {avatar: string | null} | null} | null}): string | null {
  if (p.pnj?.origines?.avatar) {
    return p.pnj.origines.avatar;
  }

  return p.pnj && !p.pnj.user_id && p.pnj_id ? `/assets/bol/pnj/${p.pnj_id}.jpg` : null;
}

/** Un pouvoir démoniaque, comparé sans tenir compte de la casse. */
function hasPouvoir(pouvoirs: readonly (string | null)[], nom: string): boolean {
  return pouvoirs.some((pouvoir) => pouvoir?.trim().toLowerCase() === nom);
}

/** Protection d'un démon d'après ses pouvoirs (04-pnj-creatures-demons.md) : Cuirasse `d6 (4)`, sinon Armure `d6-2 (2)`, sinon aucune. */
/** Les dés que les capacités d'une créature ou les pouvoirs d'un démon donnent à toutes ses attaques (04-pnj-creatures-demons.md) :
 * « Attaque féroce » et « Armes améliorées » un dé de bonus, « Attaque timide » un dé de malus. Les autres dés de bonus (prédateur,
 * camouflage) ne jouent pas à l'attaque ; les capacités sont reconnues par leur nom. */
export function attackDiceAbilities(noms: readonly (string | null)[]): {readonly attaqueAvantages: readonly string[]; readonly attaqueDesavantages: readonly string[]} {
  const named = noms.filter((nom): nom is string => !!nom);
  return {
    attaqueAvantages: named.filter((nom) => /attaque f[ée]roce|armes am[ée]lior[ée]es/i.test(nom)),
    attaqueDesavantages: named.filter((nom) => /attaque timide/i.test(nom)),
  };
}

export function demonProtection(pouvoirs: readonly (string | null)[]): string | null {
  if (hasPouvoir(pouvoirs, 'cuirasse')) {
    return 'd6 (4)';
  }
  return hasPouvoir(pouvoirs, 'armure') ? 'd6-2 (2)' : null;
}

/** Les catégories de dégâts, de la plus faible à la plus forte (table des tailles de créatures). */
const DAMAGE_STEPS: readonly string[] = ['1', 'd3', 'd6m', 'd6', 'd6b', 'd6x2', 'd6bx2', 'd6x3', 'd6bx3', 'd6x4', 'd6bx4'];
/** Dégâts de base d'un démon selon sa catégorie : mineur (piétaille) d6M, inférieur (coriace) d6, majeur (rival) d6B. */
const DEMON_BASE_DAMAGE: Readonly<Record<'pietaille' | 'coriace' | 'rival', string>> = {pietaille: 'd6m', coriace: 'd6', rival: 'd6b'};

/** Dégâts d'un démon à la table : le pouvoir « Attaques dévastatrices » les monte d'une catégorie. Seuls des dégâts restés ceux de sa
 * catégorie sont montés — un démon dont les dégâts ont déjà été relevés à la main ne l'est pas deux fois. */
export function demonDegats(degats: string | null, rang: 'pietaille' | 'coriace' | 'rival', pouvoirs: readonly (string | null)[]): string | null {
  const normalized = (degats ?? '').replace(/\s+/g, '').toLowerCase();
  if (!hasPouvoir(pouvoirs, 'attaques dévastatrices') || normalized !== DEMON_BASE_DAMAGE[rang]) {
    return degats;
  }
  const next = DAMAGE_STEPS[DAMAGE_STEPS.indexOf(normalized) + 1];
  return next.replace('m', 'M').replace('b', 'B');
}

interface PlaySource extends InitiativeSource {
  readonly camp: CombatCamp;
  readonly avatar: string;
  readonly vitaliteMax: number | null;
  readonly vitaliteCourante: number | null;
  readonly pivotId: number;
  readonly combat: PlayCombatStats;
}

/** Construit les jetons du plateau (triés par initiative) à partir du snapshot d'une session de combat lancée. */
export function buildPlayBoard(session: BolFightSessionModel): PlayBoard {
  const sources: PlaySource[] = [];

  for (const h of session.heros ?? []) {
    sources.push({
      key: `hero-${h.id}`,
      kind: 'hero',
      nom: h.heros?.origines.nom ?? 'Héros',
      avatar: h.heros?.origines.avatar || EMPTY_AVATAR,
      rang: null,
      resultat: h.initiative_resultat,
      agilite: h.heros?.attributs?.agilite ?? null,
      camp: h.camp,
      vitaliteMax: h.heros?.ressources?.vitalite ?? null,
      vitaliteCourante: h.vitalite_courante ?? h.heros?.ressources?.vitalite ?? null,
      pivotId: h.id,
      combat: {
        sourceId: h.heros_id,
        vigueur: null,
        agilite: null,
        melee: null,
        tir: null,
        attaque: null,
        defense: null,
        degats: null,
        protection: null,
      },
    });
  }

  for (const p of session.pnjs ?? []) {
    sources.push({
      key: `pnj-${p.id}`,
      kind: 'pnj',
      nom: p.surnom ?? p.nom,
      avatar: pnjAvatar(p) ?? EMPTY_AVATAR,
      rang: p.rang,
      resultat: null,
      camp: p.camp,
      vitaliteMax: p.vitalite_max,
      vitaliteCourante: p.vitalite_courante,
      pivotId: p.id,
      combat: {
        sourceId: p.pnj_id,
        vigueur: p.vigueur,
        agilite: p.agilite,
        melee: p.melee,
        tir: p.tir,
        attaque: null,
        defense: p.defense,
        // Une piétaille sans arme frappe pour 1 (04-pnj-creatures-demons.md) ; les autres PNJ ont des armes.
        degats: p.armes?.[0]?.degats ?? (p.rang === 'pietaille' ? '1' : null),
        protection: null,
        vilenie: p.vilenie_courante ?? null,
      },
    });
  }

  for (const c of session.creatures ?? []) {
    sources.push({
      key: `creature-${c.id}`,
      kind: 'creature',
      nom: c.surnom ?? c.nom,
      avatar: c.creature?.avatar || (c.creature_id ? `/assets/bol/bestiary/${c.creature_id}.jpg` : null) || EMPTY_AVATAR,
      rang: c.rang,
      resultat: null,
      camp: c.camp,
      vitaliteMax: c.vitalite_max,
      vitaliteCourante: c.vitalite_courante,
      pivotId: c.id,
      combat: {
        sourceId: c.creature_id,
        vigueur: c.vigueur,
        agilite: c.agilite,
        melee: null,
        tir: null,
        attaque: c.attaque,
        defense: c.defense,
        degats: c.degats,
        protection: c.protection,
        ...attackDiceAbilities((c.capacites ?? []).map((capacite) => capacite.capacite)),
      },
    });
  }

  for (const d of session.demons ?? []) {
    const pouvoirs = (d.pouvoirs ?? []).map((p) => p.pouvoir);
    sources.push({
      key: `demon-${d.id}`,
      kind: 'demon',
      nom: d.surnom ?? d.nom,
      avatar: d.demon?.avatar || (d.demon_id ? `/assets/bol/demon/${d.demon_id}.jpg` : null) || EMPTY_AVATAR,
      rang: d.rang,
      resultat: null,
      camp: d.camp,
      vitaliteMax: d.vitalite_max,
      vitaliteCourante: d.vitalite_courante,
      pivotId: d.id,
      combat: {
        sourceId: d.demon_id,
        vigueur: d.vigueur,
        agilite: d.agilite,
        melee: d.melee,
        tir: d.tir,
        attaque: null,
        defense: d.defense,
        degats: demonDegats(d.degats, d.rang, pouvoirs),
        protection: demonProtection(pouvoirs),
        ...attackDiceAbilities(pouvoirs),
      },
    });
  }

  const order = buildInitiativeOrderFrom(sources);
  const byKey = new Map(sources.map((s) => [s.key, s]));

  const tokens: PlayToken[] = order.entries.map((entry) => {
    const source = byKey.get(entry.key)!;
    return {
      key: entry.key,
      kind: entry.kind,
      nom: entry.nom,
      avatar: source.avatar,
      camp: source.camp,
      vitaliteMax: source.vitaliteMax,
      vitaliteCourante: source.vitaliteCourante,
      tier: entry.tier,
      lockedRound1: entry.lockedRound1,
      pivotId: source.pivotId,
      combat: source.combat,
    };
  });

  return {tokens, legendaryActive: order.legendaryActive};
}

/** Récupération après un court repos d'après combat (02-actions-combat.md, « Récupération », livre p. 65) : à `0` ou plus, la moitié
 * des points de vitalité perdus pendant ce combat (depuis `vitaliteDepart`, la vitalité au début du combat), arrondie au supérieur —
 * mais les dégâts reçus à mains nues (`mainsNues`) reviennent en totalité. Les blessures d'avant le combat ne se récupèrent pas ici.
 * En dessous de 0 (mourant), rien : la stabilisation relève de « Secourir un mourant ». Récupération rapide rend 1 point de plus (sans
 * dépasser ce qui a été perdu) ; un Souffreteux ne récupère rien par le repos. */
export function postCombatRecoveryAmount(vitaliteCourante: number | null, vitaliteDepart: number | null, mainsNues = 0, traits: RecoveryTraits = {}): number {
  if (vitaliteCourante === null || vitaliteDepart === null || vitaliteCourante < 0 || traits.souffreteux) {
    return 0;
  }
  const perdus = Math.max(0, vitaliteDepart - vitaliteCourante);
  const bagarre = Math.min(Math.max(0, mainsNues), perdus);
  const repos = bagarre + Math.ceil((perdus - bagarre) / 2);
  return traits.recuperationRapide && perdus > 0 ? Math.min(perdus, repos + 1) : repos;
}

/** Les traits d'une fiche qui changent sa récupération d'après combat. */
export function traitsDeRecuperation(traits: readonly BolHerosTraitsModel[] | undefined): RecoveryTraits {
  const possede = (type: 'A' | 'D', id: number): boolean => (traits ?? []).some((t) => t.type === type && Number(t.traitable_id) === id);
  return {recuperationRapide: possede('A', AVANTAGE_RECUPERATION_RAPIDE_ID), souffreteux: possede('D', DESAVANTAGE_SOUFFRETEUX_ID)};
}
