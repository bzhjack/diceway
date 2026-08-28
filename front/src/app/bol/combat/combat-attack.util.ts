import {map, Observable, of} from 'rxjs';
import {BolHerosService} from '../services/bol-heros.service';
import {PlayToken} from './combat-play.util';

/** Stats de combat entièrement résolues (héros récupéré en direct si besoin), prêtes à préremplir le dialog d'attaque. */
export interface ResolvedCombatStats {
  readonly agilite: number;
  readonly vigueur: number;
  readonly melee: number;
  readonly tir: number;
  /** Bonus d'attaque combiné des créatures (remplace agilité+mêlée). */
  readonly attaque: number | null;
  readonly defense: number;
  readonly degats: string;
  readonly protection: number;
}

/** Extrait le type de dé de dégâts d'une chaîne d'arme/créature BoL ("d6M", "d6B", "d3", "d6"). */
export function parseDegatsDice(degats: string | null | undefined): 'd3' | 'd6' | 'd6m' | 'd6b' {
  const s = (degats ?? '').toLowerCase();
  if (s.includes('d3')) {
    return 'd3';
  }
  if (s.includes('m')) {
    return 'd6m';
  }
  if (s.includes('b')) {
    return 'd6b';
  }
  return 'd6';
}

/** Extrait la valeur fixe entre parenthèses d'une chaîne de protection BoL ("d6-3 (1)" -> 1). */
export function parseProtectionValue(protection: string | null | undefined): number {
  const match = (protection ?? '').match(/\((-?\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
}

function firstWeaponDegats(armes: BolHerosArmeLike[] | number[] | undefined): string | null {
  if (!armes || armes.length === 0 || typeof armes[0] === 'number') {
    return null;
  }
  return (armes as BolHerosArmeLike[])[0]?.arme?.degats ?? null;
}

function firstArmureProtection(armures: BolHerosArmureLike[] | number[] | undefined): string | null {
  if (!armures || armures.length === 0 || typeof armures[0] === 'number') {
    return null;
  }
  return (armures as BolHerosArmureLike[])[0]?.armure?.protection ?? null;
}

interface BolHerosArmeLike {
  arme?: {degats: string | null};
}

interface BolHerosArmureLike {
  armure?: {protection: string | null};
}

/**
 * Résout les stats de combat d'un jeton. Un héros n'a rien de snapshoté dans la session : ses
 * stats sont récupérées en direct via `BolHerosService`. Les autres types (pnj/créature/démon)
 * utilisent le snapshot déjà présent sur le jeton.
 */
export function resolveAttackStats(token: PlayToken, herosService: BolHerosService): Observable<ResolvedCombatStats> {
  const c = token.combat;

  if (token.kind === 'hero') {
    const herosId = c.sourceId;
    if (!herosId) {
      return of({agilite: 0, vigueur: 0, melee: 0, tir: 0, attaque: null, defense: 0, degats: 'd3', protection: 0});
    }

    return herosService.heros(herosId).pipe(
      map((hero) => ({
        agilite: hero.attributs.agilite,
        vigueur: hero.attributs.vigueur,
        melee: hero.combat.melee,
        tir: hero.combat.tir,
        attaque: null,
        defense: hero.combat.defense,
        degats: firstWeaponDegats(hero.armes) ?? 'd3',
        protection: parseProtectionValue(firstArmureProtection(hero.armures)),
      })),
    );
  }

  return of({
    agilite: c.agilite ?? 0,
    vigueur: c.vigueur ?? 0,
    melee: c.melee ?? 0,
    tir: c.tir ?? 0,
    attaque: c.attaque,
    defense: c.defense ?? 0,
    degats: c.degats ?? 'd3',
    protection: parseProtectionValue(c.protection),
  });
}
