import {BolFightSessionModel, CombatCamp} from '../models/bol-fight-session.model';
import {buildInitiativeOrderFrom, InitiativeKind, InitiativeSource, InitiativeTierKey} from './initiative.util';

const EMPTY_AVATAR = '/assets/bol/empty-avatar.jpg';

export interface PlayToken {
  readonly key: string;
  readonly kind: InitiativeKind;
  readonly nom: string;
  readonly avatar: string;
  readonly camp: CombatCamp;
  readonly vitaliteMax: number | null;
  readonly vitaliteCourante: number | null;
  readonly tier: InitiativeTierKey | null;
  readonly lockedRound1: boolean;
  /** Id de la ligne fight-session (heros/pnj/creature/demon) — plusieurs jetons d'un même lot de créatures/démons partagent le même id. */
  readonly pivotId: number;
}

export interface PlayBoard {
  readonly tokens: readonly PlayToken[];
  readonly legendaryActive: boolean;
}

interface PlaySource extends InitiativeSource {
  readonly camp: CombatCamp;
  readonly avatar: string;
  readonly vitaliteMax: number | null;
  readonly vitaliteCourante: number | null;
  readonly pivotId: number;
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
      // Un héros n'a pas de PV "courant" distinct dans le snapshot : sa vitalité de référence sert des deux côtés.
      vitaliteMax: h.heros?.ressources?.vitalite ?? null,
      vitaliteCourante: h.heros?.ressources?.vitalite ?? null,
      pivotId: h.id,
    });
  }

  for (const p of session.pnjs ?? []) {
    sources.push({
      key: `pnj-${p.id}`,
      kind: 'pnj',
      nom: p.surnom ?? p.nom,
      avatar: p.pnj_id ? `/assets/bol/pnj/${p.pnj_id}.jpg` : EMPTY_AVATAR,
      rang: p.rang,
      resultat: null,
      camp: p.camp,
      vitaliteMax: p.vitalite_max,
      vitaliteCourante: p.vitalite_courante,
      pivotId: p.id,
    });
  }

  for (const c of session.creatures ?? []) {
    const qty = Math.max(1, c.qty);
    const nom = c.surnom ?? c.nom;
    const avatar = c.creature_id ? `/assets/bol/bestiary/${c.creature_id}.jpg` : EMPTY_AVATAR;
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
        vitaliteCourante: c.vitalite_courante,
        pivotId: c.id,
      });
    }
  }

  for (const d of session.demons ?? []) {
    const qty = Math.max(1, d.qty);
    const nom = d.surnom ?? d.nom;
    const avatar = d.demon_id ? `/assets/bol/demon/${d.demon_id}.jpg` : EMPTY_AVATAR;
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
        vitaliteCourante: d.vitalite_courante,
        pivotId: d.id,
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
    };
  });

  return {tokens, legendaryActive: order.legendaryActive};
}
