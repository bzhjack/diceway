import {BolFightSessionModel, CombatCamp} from '../models/bol-fight-session.model';
import {buildInitiativeOrderFrom} from './initiative.util';
import {InitiativeSource} from './models/initiative.model';
import {PlayCombatStats, PlayToken, PlayBoard} from './models/combat-play.model';

export const EMPTY_AVATAR = '/assets/bol/empty-avatar.jpg';

interface PlaySource extends InitiativeSource {
  readonly camp: CombatCamp;
  readonly avatar: string;
  readonly vitaliteMax: number | null;
  readonly vitaliteCourante: number | null;
  readonly pivotId: number;
  readonly instanceIndex: number | null;
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
      camp: h.camp,
      vitaliteMax: h.heros?.ressources?.vitalite ?? null,
      vitaliteCourante: h.vitalite_courante ?? h.heros?.ressources?.vitalite ?? null,
      pivotId: h.id,
      instanceIndex: null,
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
      avatar: p.pnj?.origines.avatar || (p.pnj_id ? `/assets/bol/pnj/${p.pnj_id}.jpg` : null) || EMPTY_AVATAR,
      rang: p.rang,
      resultat: null,
      camp: p.camp,
      vitaliteMax: p.vitalite_max,
      vitaliteCourante: p.vitalite_courante,
      pivotId: p.id,
      instanceIndex: null,
      combat: {
        sourceId: p.pnj_id,
        vigueur: p.vigueur,
        agilite: p.agilite,
        melee: p.melee,
        tir: p.tir,
        attaque: null,
        defense: p.defense,
        degats: p.armes?.[0]?.degats ?? null,
        protection: null,
      },
    });
  }

  for (const c of session.creatures ?? []) {
    const qty = Math.max(1, c.qty);
    const nom = c.surnom ?? c.nom;
    const avatar = c.creature?.avatar || (c.creature_id ? `/assets/bol/bestiary/${c.creature_id}.jpg` : null) || EMPTY_AVATAR;
    for (let i = 0; i < qty; i++) {
      sources.push({
        key: `creature-${c.id}-${i}`,
        kind: 'creature',
        nom: qty > 1 ? `${nom} #${i + 1}` : nom,
        avatar,
        rang: c.rang,
        resultat: null,
        camp: c.camp,
        vitaliteMax: c.vitalite_max,
        vitaliteCourante: c.vitalite_instances?.[i] ?? c.vitalite_courante,
        pivotId: c.id,
        instanceIndex: i,
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
        },
      });
    }
  }

  for (const d of session.demons ?? []) {
    const qty = Math.max(1, d.qty);
    const nom = d.surnom ?? d.nom;
    const avatar = d.demon?.avatar || (d.demon_id ? `/assets/bol/demon/${d.demon_id}.jpg` : null) || EMPTY_AVATAR;
    for (let i = 0; i < qty; i++) {
      sources.push({
        key: `demon-${d.id}-${i}`,
        kind: 'demon',
        nom: qty > 1 ? `${nom} #${i + 1}` : nom,
        avatar,
        rang: d.rang,
        resultat: null,
        camp: d.camp,
        vitaliteMax: d.vitalite_max,
        vitaliteCourante: d.vitalite_instances?.[i] ?? d.vitalite_courante,
        pivotId: d.id,
        instanceIndex: i,
        combat: {
          sourceId: d.demon_id,
          vigueur: d.vigueur,
          agilite: d.agilite,
          melee: d.melee,
          tir: d.tir,
          attaque: null,
          defense: d.defense,
          degats: d.degats,
          protection: null,
        },
      });
    }
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
      instanceIndex: source.instanceIndex,
      combat: source.combat,
    };
  });

  return {tokens, legendaryActive: order.legendaryActive};
}

/** Récupération post-combat (02-actions-combat.md, "Récupération") : à `> 0` ou exactement `0` (on
 * suppose un repos de 10-15 min possible juste après le combat), la moitié des points de vitalité
 * perdus est récupérée, arrondie au supérieur. En dessous de 0 (mourant), aucune récupération
 * automatique — la stabilisation relève de "Secourir un mourant", pas de cette fonction. */
export function postCombatRecoveryAmount(vitaliteCourante: number | null, vitaliteMax: number | null): number {
  if (vitaliteCourante === null || vitaliteMax === null || vitaliteCourante < 0) {
    return 0;
  }

  return Math.ceil((vitaliteMax - vitaliteCourante) / 2);
}
