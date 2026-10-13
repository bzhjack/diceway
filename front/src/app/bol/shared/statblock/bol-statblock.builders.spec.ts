import {describe, expect, it} from 'vitest';
import {BolHerosModel} from '../../models/bol-heros.model';
import {heroStatblockData, pnjStatblockData} from './bol-statblock.builders';

const arme = (nom: string, degats: string, equipee: boolean, portee: string | null = '-', type: 'M' | 'T' = 'M') => ({arme_id: 1, equipee, arme: {id: 1, arme: nom, type, degats, portee, notes: null}});
const armure = (nom: string, categorie: string, protection: string, malus: string | null, equipee: boolean) => ({armure_id: 1, equipee, armure: {id: 1, armure: nom, categorie, protection, malus}});

/** Un héros réduit à ce que le statbloc lit. */
function hero(over: Record<string, unknown> = {}): BolHerosModel {
  return {
    id: 'h1',
    active: true,
    origines: {nom: 'Dogon', joueur: 'Lionel', region: {region: 'Marais de Kasht'}, commentaire: null, avatar: null},
    attributs: {vigueur: 1, agilite: 1, agilite_effective: 1, esprit: 1, aura: 1},
    combat: {initiative_effective: 2, melee: 1, tir: 0, defense_effective: 1},
    ressources: {vitalite: 10, heroisme: 1},
    carrieres: [],
    traits: [
      {traitable: {avantage: 'Artiste'}, detail: null},
      {traitable: {desavantage: 'Arrogant'}, detail: null},
    ],
    armes: [arme('Bâton', 'd6', true), arme('Dague', 'd6M', true, '3 m')],
    armures: [
      armure('Grand bouclier', 'bouclier', 'Impose un malus de -1 à toutes les attaques subies par round', 'Agilité -1', false),
      armure('Petit bouclier', 'bouclier', 'Impose un malus de -1 à une attaque subie par round', null, true),
      armure('Casque', 'casque', "+1 à l'armure", 'Social / Initiative -1', false),
    ],
    ...over,
  } as unknown as BolHerosModel;
}

const section = (data: ReturnType<typeof heroStatblockData>, title: string) => data.sections.find((s) => s.title === title)?.entries ?? [];
const vital = (data: ReturnType<typeof heroStatblockData>, start: string) => data.vitals.find((tile) => tile.label.startsWith(start));

describe('heroStatblockData', () => {
  it('shows the damage of the first equipped weapon, with its name', () => {
    expect(vital(heroStatblockData(hero()), 'Dégâts')).toMatchObject({label: 'Dégâts · Bâton', value: 'd6', tone: 'damage'});
    const sacPuisMain = hero({armes: [arme('Lance', 'd6', false, '6 m'), arme('Dague', 'd6M', true, '3 m')]});
    expect(vital(heroStatblockData(sacPuisMain), 'Dégâts')).toMatchObject({label: 'Dégâts · Dague', value: 'd6M'});
  });

  it('shows no protection for a hero who only carries shields: a shield does not absorb damage', () => {
    expect(vital(heroStatblockData(hero()), 'Protection')?.value).toBe('—');
  });

  it('shows the protection of the worn armour, with the +1 of a worn helmet', () => {
    const enArmure = hero({
      armures: [armure('Armure moyenne', 'armure', 'd6-2(2)', 'Social / Agilité -1', true), armure('Casque', 'casque', "+1 à l'armure", 'Social / Initiative -1', true)],
    });
    expect(vital(heroStatblockData(enArmure), 'Protection')?.value).toBe('d6-2(2) +1');
  });

  it('writes an armour by its die, and a shield or helmet by a short sentence', () => {
    const enArmure = hero({armures: [armure('Armure moyenne', 'armure', 'd6-2(2)', 'Social / Agilité -1', true), ...((hero().armures as unknown[]) ?? [])]});
    const [armor, grand, petit] = section(heroStatblockData(enArmure), 'Armures et boucliers');
    expect(armor).toEqual({label: 'Armure moyenne', value: 'd6-2(2)', detail: 'Social / Agilité -1', equipped: true});
    expect(grand).toEqual({label: 'Grand bouclier', value: undefined, detail: '-1 à toutes les attaques subies par round · Agilité -1', equipped: false});
    expect(petit).toEqual({label: 'Petit bouclier', value: undefined, detail: '-1 à une attaque subie par round', equipped: true});
  });

  it('gives each weapon its die, and its range in plain words', () => {
    const arsenal = hero({armes: [arme('Bâton', 'd6', true), arme('Dague', 'd6M', true, '3 m'), arme('Arc', 'd6', false, '22 m', 'T')]});
    expect(section(heroStatblockData(arsenal), 'Armes')).toEqual([
      {label: 'Bâton', value: 'd6', detail: undefined, equipped: true},
      {label: 'Dague', value: 'd6M', detail: 'Se lance à 3 m', equipped: true},
      {label: 'Arc', value: 'd6', detail: 'Portée 22 m', equipped: false},
    ]);
  });

  it('marks an avantage with a plus and a désavantage with a minus', () => {
    expect(section(heroStatblockData(hero()), 'Traits')).toEqual([
      {label: 'Artiste', detail: undefined, sign: 'plus'},
      {label: 'Arrogant', detail: undefined, sign: 'minus'},
    ]);
  });

  it('keeps vitality and heroism for the identity band', () => {
    const data = heroStatblockData(hero());
    expect(vital(data, 'Vitalité')).toMatchObject({value: 10, tone: 'health'});
    expect(vital(data, 'Héroïsme')).toMatchObject({value: 1, tone: 'heroism'});
    expect(data.chips.map((chip) => chip.label)).toEqual(['Lionel', 'Marais de Kasht']);
  });
});

describe('pnjStatblockData — un PNJ porte tout ce qu’il possède', () => {
  // En base, les armures d'un PNJ du catalogue sont « non équipées » : elles comptent quand même.
  const pnj = hero({
    type: 'C',
    user_id: null,
    armes: [arme('Épée', 'd6', false)],
    armures: [armure('Armure moyenne', 'armure', 'd6-2(2)', 'Social / Agilité -1', false), armure('Petit bouclier', 'bouclier', 'Impose un malus de -1 à une attaque subie par round', null, false)],
  });

  it('shows the protection of its armour and the damage of its weapon', () => {
    const data = pnjStatblockData(pnj);
    expect(vital(data, 'Protection')?.value).toBe('d6-2(2)');
    expect(vital(data, 'Dégâts')).toMatchObject({label: 'Dégâts · Épée', value: 'd6'});
  });

  it('marks nothing as « dans le sac »: its lists carry no equipment state', () => {
    const data = pnjStatblockData(pnj);
    expect(section(data, 'Armes')).toEqual([{label: 'Épée', value: 'd6', detail: undefined}]);
    expect(section(data, 'Armures et boucliers').every((entry) => !('equipped' in entry))).toBe(true);
  });
});
