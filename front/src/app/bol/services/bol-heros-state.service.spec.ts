import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {
  AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID,
  AVANTAGE_POUVOIR_DU_NEANT_ID,
  CARRIERE_ALCHIMISTE_ID,
  CARRIERE_PRETRE_ID,
  CARRIERE_SORCIER_ID,
  DESAVANTAGE_NON_COMBATTANT_ID,
} from '../bol-rules.constants';
import {BolAvantageModel} from '../models/bol-avantage.model';
import {BolDesavantageModel} from '../models/bol-desavantage.model';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolHerosTraitsModel} from '../models/bol-trait.model';
import {BolCatalogService} from './bol-catalog.service';
import {BolHerosStateService} from './bol-heros-state.service';

const AVANTAGE_COSTAUD_ID = 1;

const AVANTAGES: BolAvantageModel[] = [
  {
    id: AVANTAGE_COSTAUD_ID,
    avantage: 'Costaud',
    attribut: 'vigueur',
    attribut_bonus: 1,
    de_bonus: null,
    de_bonus_domaine: null,
    description: null,
    pivot: {detail: '', avantage_id: AVANTAGE_COSTAUD_ID, region_id: 0},
  },
  {
    id: AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID,
    avantage: 'Magie des Rois-Sorciers',
    attribut: null,
    attribut_bonus: null,
    de_bonus: null,
    de_bonus_domaine: null,
    description: null,
    pivot: {detail: '', avantage_id: AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, region_id: 0},
  },
  {
    id: AVANTAGE_POUVOIR_DU_NEANT_ID,
    avantage: 'Pouvoir du Néant',
    attribut: null,
    attribut_bonus: null,
    de_bonus: null,
    de_bonus_domaine: null,
    description: null,
    pivot: {detail: '', avantage_id: AVANTAGE_POUVOIR_DU_NEANT_ID, region_id: 0},
  },
];

const DESAVANTAGE_CHETIF_ID = 7;

const DESAVANTAGES: BolDesavantageModel[] = [
  {
    id: DESAVANTAGE_CHETIF_ID,
    desavantage: 'Chétif',
    attribut: 'vitalite',
    attribut_malus: -2,
    de_malus: null,
    de_malus_domaine: null,
    description: null,
    pivot: {detail: '', desavantage_id: DESAVANTAGE_CHETIF_ID, region_id: 0},
  },
  {
    id: DESAVANTAGE_NON_COMBATTANT_ID,
    desavantage: 'Non-combattant',
    attribut: null,
    attribut_malus: null,
    de_malus: null,
    de_malus_domaine: null,
    description: null,
    pivot: {detail: '', desavantage_id: DESAVANTAGE_NON_COMBATTANT_ID, region_id: 0},
  },
];

function trait(
  traitable_id: number,
  type: 'A' | 'D',
  overrides: Partial<BolHerosTraitsModel> = {},
): BolHerosTraitsModel {
  return {traitable_id, type, detail: null, region_id: null, carriere: false, ...overrides};
}

function hero(overrides: {
  traits?: BolHerosTraitsModel[];
  carrieres?: {carriere_id: number; value: number}[];
  vigueur?: number;
} = {}): BolHerosModel {
  return {
    id: 'hero-test',
    user_id: null,
    active: false,
    type: 'H',
    combat: {initiative: 0, melee: 0, tir: 0, defense: 0},
    attributs: {vigueur: overrides.vigueur ?? 0, agilite: 0, esprit: 0, aura: 0},
    origines: {nom: 'Testa', joueur: 'lionel', region_id: null, avatar: null, langues: []},
    ressources: {vitalite: 10, heroisme: 5, foi: 0, pouvoir: 0, vilenie: 0, creation: 0, experience: 0},
    traits: overrides.traits ?? [],
    carrieres: overrides.carrieres ?? [],
    armures: [],
    armes: [],
  };
}

describe('BolHerosStateService', () => {
  let service: BolHerosStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BolCatalogService,
          useValue: {
            langues: () => of([]),
            armures: () => of([]),
            armes: () => of([]),
            regions: () => of([]),
            carrieres: () => of([]),
            avantages: () => of(AVANTAGES),
            desavantages: () => of(DESAVANTAGES),
          },
        },
      ],
    });
    service = TestBed.inject(BolHerosStateService);
  });

  describe('E11 — Non-combattant (budgets)', () => {
    it('donne les budgets par défaut sans le désavantage', () => {
      service.currentHeros.set(hero());
      expect(service.isNonCombattant()).toBe(false);
      expect(service.combatBudget()).toBe(4);
      expect(service.carriereBudget()).toBe(4);
    });

    it('passe le combat à 2 et les carrières à 6 avec Non-combattant', () => {
      service.currentHeros.set(hero({traits: [trait(DESAVANTAGE_NON_COMBATTANT_ID, 'D')]}));
      expect(service.isNonCombattant()).toBe(true);
      expect(service.combatBudget()).toBe(2);
      expect(service.carriereBudget()).toBe(6);
    });

    it("ignore le désavantage s'il vient d'une carrière dangereuse", () => {
      service.currentHeros.set(
        hero({traits: [trait(DESAVANTAGE_NON_COMBATTANT_ID, 'D', {carriere: true})]}),
      );
      expect(service.isNonCombattant()).toBe(false);
    });
  });

  describe('E12 — avantages spéciaux', () => {
    it('demande un désavantage supplémentaire par avantage spécial pris', () => {
      service.currentHeros.set(hero());
      expect(service.specialAvantageDesavantageRequired()).toBe(0);

      service.currentHeros.set(hero({traits: [trait(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, 'A')]}));
      expect(service.specialAvantageDesavantageRequired()).toBe(1);

      service.currentHeros.set(
        hero({
          traits: [
            trait(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, 'A'),
            trait(AVANTAGE_POUVOIR_DU_NEANT_ID, 'A'),
          ],
        }),
      );
      expect(service.specialAvantageDesavantageRequired()).toBe(2);
    });
  });

  describe('carriereDesavantageCount — carrières dangereuses', () => {
    it('exige un désavantage par rang d’alchimiste au-dessus de 2', () => {
      service.currentHeros.set(hero({carrieres: [{carriere_id: CARRIERE_ALCHIMISTE_ID, value: 4}]}));
      expect(service.carriereDesavantageCount()).toBe(2);
    });

    it('exige un désavantage par rang de sorcier au-dessus de 1', () => {
      service.currentHeros.set(hero({carrieres: [{carriere_id: CARRIERE_SORCIER_ID, value: 3}]}));
      expect(service.carriereDesavantageCount()).toBe(2);
    });

    it('déduit les désavantages de carrière déjà pris, sans passer sous zéro', () => {
      service.currentHeros.set(
        hero({
          carrieres: [{carriere_id: CARRIERE_SORCIER_ID, value: 2}],
          traits: [
            trait(DESAVANTAGE_CHETIF_ID, 'D', {carriere: true}),
            trait(DESAVANTAGE_NON_COMBATTANT_ID, 'D', {carriere: true}),
          ],
        }),
      );
      expect(service.carriereDesavantageCount()).toBe(0);
    });
  });

  describe('heroismCost — avantages au-delà du premier', () => {
    it('ne coûte rien pour un seul avantage', () => {
      service.currentHeros.set(hero({traits: [trait(AVANTAGE_COSTAUD_ID, 'A')]}));
      expect(service.heroismCost()).toBe(0);
    });

    it('coûte 1 pour un 2e avantage sans désavantage régional', () => {
      service.currentHeros.set(
        hero({
          traits: [trait(AVANTAGE_COSTAUD_ID, 'A'), trait(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, 'A')],
        }),
      );
      expect(service.heroismCost()).toBe(1);
    });

    it('est absorbé par un désavantage régional', () => {
      service.currentHeros.set(
        hero({
          traits: [
            trait(AVANTAGE_COSTAUD_ID, 'A'),
            trait(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, 'A'),
            trait(DESAVANTAGE_CHETIF_ID, 'D', {region_id: 5}),
          ],
        }),
      );
      expect(service.heroismCost()).toBe(0);
    });

    it('coûte 2 pour un 3e avantage sans aucun désavantage', () => {
      service.currentHeros.set(
        hero({
          traits: [
            trait(AVANTAGE_COSTAUD_ID, 'A'),
            trait(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, 'A'),
            trait(AVANTAGE_POUVOIR_DU_NEANT_ID, 'A'),
          ],
        }),
      );
      expect(service.heroismCost()).toBe(2);
    });

    it('est entièrement couvert par un désavantage régional et un général', () => {
      service.currentHeros.set(
        hero({
          traits: [
            trait(AVANTAGE_COSTAUD_ID, 'A'),
            trait(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, 'A'),
            trait(AVANTAGE_POUVOIR_DU_NEANT_ID, 'A'),
            trait(DESAVANTAGE_CHETIF_ID, 'D', {region_id: 5}),
            trait(DESAVANTAGE_NON_COMBATTANT_ID, 'D'),
          ],
        }),
      );
      expect(service.heroismCost()).toBe(0);
    });
  });

  describe('traitsModifiers — modificateurs dérivés', () => {
    it('applique le bonus d’attribut d’un avantage', () => {
      service.currentHeros.set(hero({traits: [trait(AVANTAGE_COSTAUD_ID, 'A')]}));
      expect(service.traitsModifiers()).toContainEqual({attr: 'vigueur', value: 1});
    });

    it('applique le malus d’attribut d’un désavantage', () => {
      service.currentHeros.set(hero({traits: [trait(DESAVANTAGE_CHETIF_ID, 'D')]}));
      expect(service.traitsModifiers()).toContainEqual({attr: 'vitalite', value: -2});
    });

    it('reporte le coût en héroïsme en modificateur négatif', () => {
      service.currentHeros.set(
        hero({
          traits: [trait(AVANTAGE_COSTAUD_ID, 'A'), trait(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, 'A')],
        }),
      );
      expect(service.traitsModifiers()).toContainEqual({attr: 'heroisme', value: -1});
    });

    it('reporte la vigueur sur la vitalité', () => {
      service.currentHeros.set(hero({vigueur: 2}));
      expect(service.traitsModifiers()).toContainEqual({attr: 'vitalite', value: 2});
    });

    it('calcule pouvoir, création et foi depuis les rangs de carrière', () => {
      service.currentHeros.set(
        hero({
          carrieres: [
            {carriere_id: CARRIERE_SORCIER_ID, value: 2},
            {carriere_id: CARRIERE_ALCHIMISTE_ID, value: 1},
            {carriere_id: CARRIERE_PRETRE_ID, value: 3},
          ],
        }),
      );

      const modifiers = service.traitsModifiers();
      expect(modifiers).toContainEqual({attr: 'pouvoir', value: 12});
      expect(modifiers).toContainEqual({attr: 'creation', value: 1});
      expect(modifiers).toContainEqual({attr: 'foi', value: 3});
    });

    it('le sorcier donne ses points de pouvoir même au rang 0, pas l’alchimiste ni le prêtre', () => {
      service.currentHeros.set(
        hero({
          carrieres: [
            {carriere_id: CARRIERE_SORCIER_ID, value: 0},
            {carriere_id: CARRIERE_ALCHIMISTE_ID, value: 0},
            {carriere_id: CARRIERE_PRETRE_ID, value: 0},
          ],
        }),
      );

      const modifiers = service.traitsModifiers();
      expect(modifiers).toContainEqual({attr: 'pouvoir', value: 10});
      expect(modifiers.some((modifier) => modifier.attr === 'creation')).toBe(false);
      expect(modifiers.some((modifier) => modifier.attr === 'foi')).toBe(false);
    });
  });

  describe('warnings', () => {
    it('agrège warnCount et se vide avec clearWarnings', () => {
      service.setWarnTraits([{step: 'Traits', warn: 'a'}]);
      service.setWarnCarrieres([{step: 'Carrières', warn: 'b'}, {step: 'Carrières', warn: 'c'}]);
      expect(service.warnCount()).toBe(3);

      service.clearWarnings();
      expect(service.warnCount()).toBe(0);
    });
  });
});
