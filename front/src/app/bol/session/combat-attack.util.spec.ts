import {describe, expect, it} from 'vitest';
import {firstValueFrom, of} from 'rxjs';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolHerosService} from '../services/bol-heros.service';
import {armeFavoriteDe, dualStrikeDegats, equippedProtection, estArmeFavorite, isDualWieldEligible, libellePoints, nomDesPoints, resolveAttackStats, sbireBouclier} from './combat-attack.util';
import {TapisCard} from './models/tapis.model';
import {PlayToken} from './models/combat-play.model';

describe('isDualWieldEligible', () => {
  it('accepts light weapons (d6M)', () => {
    expect(isDualWieldEligible('d6M')).toBe(true);
  });

  it('accepts medium weapons (d6)', () => {
    expect(isDualWieldEligible('d6')).toBe(true);
  });

  it('accepts bare hands / improvised (d3)', () => {
    expect(isDualWieldEligible('d3')).toBe(true);
  });

  it('accepts a weapon wielded with one or two hands (d6 ou d6B), as a medium weapon in one hand', () => {
    expect(isDualWieldEligible('d6 ou d6B')).toBe(true);
    expect(dualStrikeDegats('d6 ou d6B', 'd6M')).toBe('d6B');
  });

  it('rejects heavy weapons (d6B) — combat à deux armes uniquement armes légères/moyennes', () => {
    expect(isDualWieldEligible('d6B')).toBe(false);
  });

  it('rejects a missing degats string', () => {
    expect(isDualWieldEligible(null)).toBe(false);
  });
});

describe('dualStrikeDegats', () => {
  it('two light weapons upgrade to medium damage', () => {
    expect(dualStrikeDegats('d6M', 'd6M')).toBe('d6');
  });

  it('one medium + one light weapon upgrade to heavy damage', () => {
    expect(dualStrikeDegats('d6', 'd6M')).toBe('d6B');
    expect(dualStrikeDegats('d6M', 'd6')).toBe('d6B');
  });

  it('two medium weapons upgrade to heavy damage', () => {
    expect(dualStrikeDegats('d6', 'd6')).toBe('d6B');
  });

  it('treats bare hands (d3) as light', () => {
    expect(dualStrikeDegats('d3', 'd3')).toBe('d6');
    expect(dualStrikeDegats('d6', 'd3')).toBe('d6B');
  });
});

describe('equippedProtection', () => {
  const light = {equipee: true, armure: {protection: 'd6-3 (1)', categorie: 'armure'}};
  const heavy = {equipee: true, armure: {protection: 'd6-1 (3)', categorie: 'armure'}};
  const helmet = {equipee: true, armure: {protection: '+1', categorie: 'casque'}};

  it('reads the worn armour, not the first one of the list', () => {
    expect(equippedProtection([{...light, equipee: false}, heavy])).toEqual({text: 'd6-1 (3)', value: 3});
  });

  it('adds +1 for a worn helmet', () => {
    expect(equippedProtection([heavy, helmet])).toEqual({text: 'd6-1 (3) +1', value: 4});
  });

  it('ignores armour that is owned but not worn', () => {
    expect(equippedProtection([{...heavy, equipee: false}])).toEqual({text: null, value: 0});
  });

  it('counts a helmet alone as 1', () => {
    expect(equippedProtection([helmet])).toEqual({text: '1', value: 1});
  });

  it('is nothing when the hero wears nothing, or when the catalogue is not loaded', () => {
    expect(equippedProtection([])).toEqual({text: null, value: 0});
    expect(equippedProtection([3, 4])).toEqual({text: null, value: 0});
    expect(equippedProtection(undefined)).toEqual({text: null, value: 0});
  });
});

describe('resolveAttackStats — un PNJ porte tout ce qu’il possède', () => {
  // Le Champion gladiateur du livre : « Agilité 1 (0*) », armure moyenne d6-2 (2), bouclier. En base, ses armures sont « non équipées ».
  const fiche = {
    attributs: {agilite: 1, agilite_effective: 0},
    combat: {defense: 1, defense_effective: 1},
    armures: [
      {equipee: false, armure: {protection: 'd6-2(2)', categorie: 'armure'}},
      {equipee: false, armure: {protection: 'Impose un malus de -1 à une attaque subie par round', categorie: 'bouclier'}},
    ],
    equipement_effectif: {bouclier_malus_attaque_subie: 1, bouclier_malus_attaque_subie_portee: 'une', bouclier_defense_toutes: 0},
  } as unknown as BolHerosModel;
  const service = {heros: () => of(fiche)} as unknown as BolHerosService;
  const token = {
    kind: 'pnj',
    combat: {sourceId: 'pnj-4', agilite: 1, vigueur: 2, melee: 1, tir: -1, attaque: null, defense: 1, degats: 'd6', protection: null},
  } as unknown as PlayToken;

  it('counts its armour even when it is stored as not worn', async () => {
    const stats = await firstValueFrom(resolveAttackStats(token, service));
    expect(stats.protection).toBe(2);
    expect(stats.protectionText).toBe('d6-2(2)');
  });

  it('porte son bouclier, même rangé comme « non équipé »', async () => {
    expect((await firstValueFrom(resolveAttackStats(token, service))).bouclier).toBe(true);
  });

  it('un héros garde le nom de son arme favorite', async () => {
    const heros = {
      ...fiche,
      attributs: {vigueur: 1, agilite: 1, agilite_effective: 1},
      combat: {melee: 1, tir: 0, defense_effective: 1},
      ressources: {heroisme: 5},
      armes: [],
      traits: [{traitable_id: 6, type: 'A', detail: 'Kriss', region_id: 3, carriere: false}],
    } as unknown as BolHerosModel;
    const hero = {kind: 'hero', combat: {sourceId: 'h1'}} as unknown as PlayToken;
    expect((await firstValueFrom(resolveAttackStats(hero, {heros: () => of(heros)} as unknown as BolHerosService))).armeFavorite).toBe('Kriss');
  });

  it('un héros ne porte que le bouclier équipé', async () => {
    const heros = (equipee: boolean) =>
      ({
        ...fiche,
        attributs: {vigueur: 1, agilite: 1, agilite_effective: 1},
        combat: {melee: 1, tir: 0, defense_effective: 1},
        ressources: {heroisme: 5},
        armes: [],
        armures: [{equipee, armure: {protection: 'Impose un malus de -1 à une attaque subie par round', categorie: 'bouclier'}}],
      }) as unknown as BolHerosModel;
    const hero = {kind: 'hero', combat: {sourceId: 'h1'}} as unknown as PlayToken;
    expect((await firstValueFrom(resolveAttackStats(hero, {heros: () => of(heros(true))} as unknown as BolHerosService))).bouclier).toBe(true);
    expect((await firstValueFrom(resolveAttackStats(hero, {heros: () => of(heros(false))} as unknown as BolHerosService))).bouclier).toBe(false);
  });

  it('se sert de sa vilénie de rival comme de points d’héroïsme', async () => {
    const rival = {...token, combat: {...token.combat, vilenie: 5}} as unknown as PlayToken;
    expect((await firstValueFrom(resolveAttackStats(rival, service))).heroisme).toBe(5);
    expect((await firstValueFrom(resolveAttackStats(token, service))).heroisme).toBeNull();
  });

  it('takes its agility and defence with all its equipment, and its shield', async () => {
    const stats = await firstValueFrom(resolveAttackStats(token, service));
    expect(stats.agilite).toBe(0);
    expect(stats.defense).toBe(1);
    expect(stats.bouclierMalusUneAttaque).toBe(1);
  });
});

describe('nomDesPoints', () => {
  it('dit héroïsme pour un héros, vilénie pour un rival', () => {
    expect(nomDesPoints('hero')).toBe('héroïsme');
    expect(nomDesPoints('pnj')).toBe('vilénie');
  });
});

describe('libellePoints', () => {
  it('accorde le nombre et le nom des points', () => {
    expect(libellePoints('hero', 1)).toBe('1 point d’héroïsme');
    expect(libellePoints('hero', 3)).toBe('3 points d’héroïsme');
    expect(libellePoints('pnj', 1)).toBe('1 point de vilénie');
    expect(libellePoints('pnj', 0)).toBe('0 point de vilénie');
  });
});

describe('sbireBouclier', () => {
  const carte = (key: string, rang: string | null, camp: 'heros' | 'adversaires' = 'adversaires', vitaliteCourante = 1): TapisCard =>
    ({key, kind: key.split('-')[0], camp, rang, nom: key, vitaliteCourante, vitaliteMax: 1}) as unknown as TapisCard;
  const rival = carte('pnj-1', 'Rival');

  it('choisit une piétaille debout du camp du rival', () => {
    const cartes = [rival, carte('pnj-2', 'Coriace'), carte('pnj-3', 'Piétaille', 'adversaires', 0), carte('pnj-4', 'Piétaille', 'heros'), carte('creature-5', 'Piétaille')];
    expect(sbireBouclier(rival, cartes)?.key).toBe('creature-5');
  });

  it('ne trouve personne sans piétaille debout à ses côtés', () => {
    expect(sbireBouclier(rival, [rival, carte('pnj-2', 'Coriace'), carte('pnj-3', 'Piétaille', 'adversaires', 0)])).toBeNull();
  });
});

describe('arme favorite (avantage : dé de bonus avec cette arme)', () => {
  it('se lit dans la précision de l’avantage « Arme favorite » de la fiche', () => {
    expect(armeFavoriteDe([{traitable_id: 6, type: 'A', detail: 'Kriss', region_id: 3, carriere: false}])).toBe('Kriss');
    expect(armeFavoriteDe([{traitable_id: 6, type: 'A', detail: null, region_id: null, carriere: false}])).toBeNull();
    expect(armeFavoriteDe([{traitable_id: 7, type: 'A', detail: 'Kriss', region_id: null, carriere: false}])).toBeNull();
    expect(armeFavoriteDe(undefined)).toBeNull();
  });

  it('reconnaît l’arme en main, sans tenir compte de la casse, des accents ni des apostrophes', () => {
    expect(estArmeFavorite('Kriss', 'Kriss')).toBe(true);
    expect(estArmeFavorite('épée valgardienne', 'Épée valgardienne')).toBe(true);
    expect(estArmeFavorite("Fronde de l'Axos", 'Fronde de l’Axos')).toBe(true);
  });

  it('reconnaît une arme double du catalogue par l’un de ses noms (« Javelot / fléchette »)', () => {
    expect(estArmeFavorite('javelot', 'Javelot / fléchette')).toBe(true);
  });

  it('ne confond pas une arme avec une autre qui commence pareil', () => {
    expect(estArmeFavorite('Épée', 'Épée valgardienne')).toBe(false);
    expect(estArmeFavorite('Kriss', 'Dague')).toBe(false);
    expect(estArmeFavorite(null, 'Kriss')).toBe(false);
    expect(estArmeFavorite('Kriss', null)).toBe(false);
  });
});
