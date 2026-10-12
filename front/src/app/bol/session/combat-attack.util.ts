import {map, Observable, of} from 'rxjs';
import {BolHerosService} from '../services/bol-heros.service';
import {firstEquippedDegats} from '../shared/arme/arme-equipee';
import {PlayToken} from './models/combat-play.model';
import {ResolvedCombatStats} from './models/combat-attack.model';

/** Extrait le type de dé de dégâts d'une chaîne d'arme/créature BoL ("d6M", "d6B", "d3", "d6"). */
function parseDegatsDice(degats: string | null | undefined): 'd3' | 'd6' | 'd6m' | 'd6b' {
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

/** Combat à deux armes (02-actions-combat.md) : uniquement avec des armes légères ou moyennes ; une arme lourde (d6B) n'est jamais
 * éligible. Les mains nues et l'arme improvisée sont écartées plus haut (`isDualWieldWeapon`), ce ne sont pas des armes du héros. */
export function isDualWieldEligible(degats: string | null | undefined): boolean {
  return !!degats && parseDegatsDice(degats) !== 'd6b';
}

/** Poids d'une arme pour la table de montée en catégorie du mode "double frappe" — mains nues /
 * arme improvisée (d3) comptent comme légères (poids 1), moyenne (d6) pèse 2. */
function dualWieldWeight(degats: string | null | undefined): number {
  return parseDegatsDice(degats) === 'd6' ? 2 : 1;
}

/** Dégâts résultants du mode "double frappe" (02-actions-combat.md) : 2 armes légères → dégâts
 * d'arme moyenne ; 1 moyenne + 1 légère, ou 2 moyennes → dégâts d'arme lourde. */
export function dualStrikeDegats(mainDegats: string | null | undefined, offDegats: string | null | undefined): string {
  return dualWieldWeight(mainDegats) + dualWieldWeight(offDegats) >= 3 ? 'd6B' : 'd6';
}

/** Extrait la valeur fixe entre parenthèses d'une chaîne de protection BoL ("d6-3 (1)" -> 1). */
function parseProtectionValue(protection: string | null | undefined): number {
  const match = (protection ?? '').match(/\((-?\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
}

interface BolHerosArmureLike {
  readonly equipee?: boolean;
  readonly armure?: {readonly protection: string | null; readonly categorie?: string | null};
}

/** Protection du héros d'après ce qu'il porte : l'armure équipée (légère, moyenne, lourde) et, s'il y en a un d'équipé, le casque qui
 * ajoute +1. `text` est la forme écrite du livre (« d6-1 (3) +1 »), `value` la valeur fixe retenue pour les dégâts. */
export function equippedProtection(armures: readonly (BolHerosArmureLike | number)[] | undefined): {text: string | null; value: number} {
  const worn = (armures ?? []).filter((a): a is BolHerosArmureLike => typeof a === 'object' && a.equipee !== false);
  const body = worn.find((a) => a.armure?.categorie === 'armure')?.armure?.protection ?? null;
  const helmet = worn.some((a) => a.armure?.categorie === 'casque');
  const bonus = helmet ? 1 : 0;
  const value = parseProtectionValue(body) + bonus;
  if (body === null && !helmet) {
    return {text: null, value: 0};
  }
  return {text: body === null ? String(bonus) : `${body}${helmet ? ' +1' : ''}`, value};
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
      return of({
        agilite: 0,
        vigueur: 0,
        melee: 0,
        tir: 0,
        attaque: null,
        defense: 0,
        degats: 'd3',
        protection: 0,
        protectionText: null,
        bouclierMalusUneAttaque: 0,
        herosId: null,
        heroisme: null,
      });
    }

    return herosService.heros(herosId).pipe(
      map((hero) => {
        const protection = equippedProtection(hero.armures);
        return {
        agilite: hero.attributs.agilite_effective,
        vigueur: hero.attributs.vigueur,
        melee: hero.combat.melee,
        tir: hero.combat.tir,
        attaque: null,
        defense: hero.combat.defense_effective,
        degats: firstEquippedDegats(hero.armes) ?? 'd3',
        protection: protection.value,
        protectionText: protection.text,
        bouclierMalusUneAttaque:
          hero.equipement_effectif.bouclier_malus_attaque_subie_portee === 'une'
            ? hero.equipement_effectif.bouclier_malus_attaque_subie
            : 0,
        herosId,
        heroisme: hero.ressources.heroisme,
        };
      }),
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
    protectionText: c.protection || null,
    bouclierMalusUneAttaque: 0,
    herosId: null,
    heroisme: null,
  });
}
