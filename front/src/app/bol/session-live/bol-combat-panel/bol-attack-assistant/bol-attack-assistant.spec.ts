import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {BolAttackAssistantComponent} from './bol-attack-assistant';
import {BolCombatReferenceService} from '../../../services/bol-combat-reference.service';
import {ArmeSlot, InitiativeSlot, PouvoirSlot} from '../bol-combat-panel';

// ───────── helpers ─────────

function makeSlot(overrides: Partial<InitiativeSlot> = {}): InitiativeSlot {
  return {
    id: 'slot-1',
    nom: 'Héros',
    avatar: null,
    type: 'hero',
    vitaliteMax: 10,
    vitaliteCourante: 10,
    heroismMax: 3,
    heroismCourant: 1,
    vigueur: 0,
    agilite: 0,
    esprit: 0,
    initiative: 0,
    melee: 0,
    tir: 0,
    defense: 0,
    degats: null,
    tags: [],
    pouvoirs: [],
    armesList: [],
    armures: [],
    category: null,
    ...overrides,
  };
}

function makeArme(overrides: Partial<ArmeSlot> = {}): ArmeSlot {
  return {
    nom: 'Épée',
    degats: 'd6',
    type: 'M',
    portee: null,
    notes: null,
    categorie: 'moyenne',
    ...overrides,
  };
}

function makePouvoir(overrides: Partial<PouvoirSlot> = {}): PouvoirSlot {
  return {
    nom: 'Pouvoir',
    description: null,
    avantage_attaque: false,
    degats_superieurs: false,
    regeneration: false,
    intangible: false,
    avertissement_combat: false,
    ...overrides,
  };
}

const MOCK_REF_SERVICE: Partial<BolCombatReferenceService> = {
  getDifficultes: () => of([]),
  getCombatOptions: () => of([]),
  getHeroicOptions: () => of([]),
};

// ───────── setup helper ─────────

function setup(attackerOverrides: Partial<InitiativeSlot> = {}, extraSlots: InitiativeSlot[] = []) {
  TestBed.configureTestingModule({
    imports: [BolAttackAssistantComponent],
    providers: [{provide: BolCombatReferenceService, useValue: MOCK_REF_SERVICE}],
  });

  const fixture = TestBed.createComponent(BolAttackAssistantComponent);
  const comp = fixture.componentInstance;
  const attacker = makeSlot({id: 'attacker', ...attackerOverrides});
  const allSlots = [attacker, ...extraSlots];

  fixture.componentRef.setInput('attacker', attacker);
  fixture.componentRef.setInput('allSlots', allSlots);
  fixture.componentRef.setInput('visible', false);
  fixture.detectChanges();

  // Cast pour accéder aux signaux protégés dans les tests
  const c = comp as any;
  return {fixture, comp, c, attacker, allSlots};
}

// ═══════════════════════════════════════════════════════
// JETS DE DÉS — rollDice()
// ═══════════════════════════════════════════════════════

describe('rollDice()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('mode normal : lance 2d6 et somme les 2 dés', () => {
    const {c} = setup();
    vi.spyOn(Math, 'random').mockReturnValueOnce(4 / 6).mockReturnValueOnce(2 / 6); // → 5, 3
    c.rollDice();
    expect(c.dice()).toBe(8);
    expect(c.diceDetail()).toEqual([5, 3]);
  });

  it('avantage : lance 3d6, garde les 2 meilleurs', () => {
    const {c} = setup();
    c.advantage.set('avantage');
    // Résultats : 2, 5, 4 → triés [5,4,2] → garde [5,4] → 9
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(1 / 6)  // → 2
      .mockReturnValueOnce(4 / 6)  // → 5
      .mockReturnValueOnce(3 / 6); // → 4
    c.rollDice();
    expect(c.dice()).toBe(9);
  });

  it('désavantage : lance 3d6, garde les 2 moins bons', () => {
    const {c} = setup();
    c.advantage.set('desavantage');
    // Résultats : 2, 5, 4 → triés [5,4,2] → garde [4,2] → 6
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(1 / 6)  // → 2
      .mockReturnValueOnce(4 / 6)  // → 5
      .mockReturnValueOnce(3 / 6); // → 4
    c.rollDice();
    expect(c.dice()).toBe(6);
  });

  it('réinitialise le détail entre deux jets', () => {
    const {c} = setup();
    vi.spyOn(Math, 'random').mockReturnValue(3 / 6); // toujours 4
    c.rollDice();
    c.rollDice();
    expect(c.diceDetail()).toHaveLength(2);
    expect(c.dice()).toBe(8);
  });
});

// ═══════════════════════════════════════════════════════
// DÉTECTION DU TOUCHÉ — isHit
// Règles BoL : 2d6 + Agilité + Aptitude - Défense >= 9
// Échec critique si somme <= 2, Succès héroïque si somme >= 12
// ═══════════════════════════════════════════════════════

describe('isHit', () => {
  it('retourne null avant tout jet', () => {
    const {c} = setup();
    expect(c.isHit()).toBeNull();
  });

  it('échec critique (dés ≤ 2) : toujours raté même si total >= 9', () => {
    const {c} = setup({agilite: 5, melee: 5}); // totalBonus = +10
    c.dice.set(2);
    expect(c.isHit()).toBe(false);
  });

  it('succès héroïque (dés ≥ 12) : toujours touché même si total < 9', () => {
    const {c} = setup({agilite: -5, melee: -5}); // totalBonus = -10
    c.dice.set(12);
    expect(c.isHit()).toBe(true);
  });

  it('touché : total >= 9 avec dés normaux', () => {
    // agilite=1, melee=2, defense=0 → bonus=3 ; dice=6 → total=9
    const target = makeSlot({id: 'target', defense: 0});
    const {c} = setup({agilite: 1, melee: 2}, [target]);
    c.targetId.set('target');
    c.dice.set(6);
    expect(c.isHit()).toBe(true);
  });

  it('raté : total < 9 avec dés normaux', () => {
    // agilite=0, melee=0, defense=3 → bonus=-3 ; dice=6 → total=3
    const target = makeSlot({id: 'target', defense: 3});
    const {c} = setup({agilite: 0, melee: 0}, [target]);
    c.targetId.set('target');
    c.dice.set(6);
    expect(c.isHit()).toBe(false);
  });

  it('seuil exact 9 : touché', () => {
    // agilite=2, melee=2, defense=0 → bonus=4 ; dice=5 → total=9
    const {c} = setup({agilite: 2, melee: 2});
    c.dice.set(5);
    expect(c.isHit()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// STATUT DU JET — rollStatus
// ═══════════════════════════════════════════════════════

describe('rollStatus', () => {
  it('pending quand aucun dé', () => {
    const {c} = setup();
    expect(c.rollStatus()).toBe('pending');
  });

  it('heroic quand dés >= 12', () => {
    const {c} = setup();
    c.dice.set(12);
    expect(c.rollStatus()).toBe('heroic');
  });

  it('critical quand dés <= 2', () => {
    const {c} = setup();
    c.dice.set(2);
    expect(c.rollStatus()).toBe('critical');
  });

  it('hit quand touché', () => {
    const {c} = setup({agilite: 5, melee: 5});
    c.dice.set(6); // total=16 >= 9
    expect(c.rollStatus()).toBe('hit');
  });

  it('miss quand raté', () => {
    const {c} = setup({agilite: 0, melee: 0});
    c.dice.set(3); // total=3 < 9
    expect(c.rollStatus()).toBe('miss');
  });
});

// ═══════════════════════════════════════════════════════
// BONUS TOTAL — totalBonus
// Formule : Agilité + Aptitude (mêlée|tir) - Défense cible + mods
// ═══════════════════════════════════════════════════════

describe('totalBonus', () => {
  it('sans cible : défense = 0', () => {
    const {c} = setup({agilite: 2, melee: 3});
    expect(c.totalBonus()).toBe(5);
  });

  it('soustrait la défense de la cible', () => {
    const target = makeSlot({id: 'target', defense: 4});
    const {c} = setup({agilite: 2, melee: 3}, [target]);
    c.targetId.set('target');
    expect(c.totalBonus()).toBe(1); // 2+3-4
  });

  it('utilise l\'aptitude de tir quand attackType=tir', () => {
    const {c} = setup({agilite: 1, melee: 3, tir: 5});
    c.attackType.set('tir');
    expect(c.totalBonus()).toBe(6); // 1+5-0
  });

  it('applique le modificateur de difficulté', () => {
    const {c} = setup({agilite: 2, melee: 2});
    c.difficultyMod.set(-2);
    expect(c.totalBonus()).toBe(2); // 2+2-0-2
  });
});

// ═══════════════════════════════════════════════════════
// BONUS DE VIGUEUR — vigBonus
// Règles BoL :
//   - Arme nue ou tir : VIG / 2 (arrondi bas)
//   - Arme de mêlée   : VIG complet
// ═══════════════════════════════════════════════════════

describe('vigBonus', () => {
  it('sans arme (mains nues) : VIG / 2 arrondi bas', () => {
    const {c} = setup({vigueur: 3});
    // selectedArme = null → nue
    expect(c.vigBonus()).toBe(1);
  });

  it('arme de mêlée : VIG complet', () => {
    const {c} = setup({vigueur: 3});
    c.selectedArme.set(makeArme({categorie: 'moyenne', type: 'M'}));
    c.attackType.set('melee');
    expect(c.vigBonus()).toBe(3);
  });

  it('arme de tir : VIG / 2 arrondi bas', () => {
    const {c} = setup({vigueur: 3});
    c.selectedArme.set(makeArme({categorie: 'moyenne', type: 'T'}));
    c.attackType.set('tir');
    expect(c.vigBonus()).toBe(1);
  });

  it('vigueur paire : arrondi sans perte', () => {
    const {c} = setup({vigueur: 4});
    expect(c.vigBonus()).toBe(2); // mains nues 4/2=2
  });
});

// ═══════════════════════════════════════════════════════
// CATÉGORIE DE DÉGÂTS — effectiveDamageCategorie
// Règles BoL : nue < légère < moyenne < lourde
//   - Option dual-strike : +1 niveau
//   - Pouvoir dégâts supérieurs : +1 niveau
//   - Cumulables, plafonné à 'lourde'
// ═══════════════════════════════════════════════════════

describe('effectiveDamageCategorie', () => {
  it('arme moyenne sans option → moyenne', () => {
    const {c} = setup();
    c.selectedArme.set(makeArme({categorie: 'moyenne'}));
    expect(c.effectiveDamageCategorie()).toBe('moyenne');
  });

  it('dual-strike upgrade une catégorie : légère → moyenne', () => {
    const {c} = setup();
    c.selectedArme.set(makeArme({categorie: 'legere'}));
    c.combatOptionSlug.set('dual-strike');
    expect(c.effectiveDamageCategorie()).toBe('moyenne');
  });

  it('dégâts supérieurs upgrade une catégorie : légère → moyenne', () => {
    const {c} = setup({
      pouvoirs: [makePouvoir({degats_superieurs: true})],
    });
    c.selectedArme.set(makeArme({categorie: 'legere'}));
    expect(c.effectiveDamageCategorie()).toBe('moyenne');
  });

  it('dual-strike + dégâts supérieurs : légère → lourde (+2)', () => {
    const {c} = setup({
      pouvoirs: [makePouvoir({degats_superieurs: true})],
    });
    c.selectedArme.set(makeArme({categorie: 'legere'}));
    c.combatOptionSlug.set('dual-strike');
    expect(c.effectiveDamageCategorie()).toBe('lourde');
  });

  it('plafonné à lourde même avec double bonus depuis lourde', () => {
    const {c} = setup({
      pouvoirs: [makePouvoir({degats_superieurs: true})],
    });
    c.selectedArme.set(makeArme({categorie: 'lourde'}));
    c.combatOptionSlug.set('dual-strike');
    expect(c.effectiveDamageCategorie()).toBe('lourde');
  });
});

// ═══════════════════════════════════════════════════════
// DÉGÂTS TOTAUX — totalDamage
// Formule : roll + vigBonus - armure (min 0)
// Option 'devastateur' : +6 aux dégâts
// ═══════════════════════════════════════════════════════

describe('totalDamage', () => {
  it('retourne null sans jet de dégâts', () => {
    const {c} = setup({vigueur: 2});
    expect(c.totalDamage()).toBeNull();
  });

  it('calcul de base : roll + vigBonus - armure', () => {
    const target = makeSlot({id: 'target', armures: [{nom: 'Cuir', protection: '2', malus: null}]});
    const {fixture, c} = setup({vigueur: 3}, [target]);
    c.targetId.set('target');
    fixture.detectChanges(); // flush l'effet de pré-remplissage de l'armure
    c.selectedArme.set(makeArme({categorie: 'moyenne', type: 'M'}));
    c.attackType.set('melee');
    c.damageRoll.set(5);
    // 5 (roll) + 3 (VIG) - 2 (armure) = 6
    expect(c.totalDamage()).toBe(6);
  });

  it('dégâts négatifs clampés à 0', () => {
    const target = makeSlot({id: 'target', armures: [{nom: 'Plaque', protection: '10', malus: null}]});
    const {fixture, c} = setup({vigueur: 0}, [target]);
    c.targetId.set('target');
    fixture.detectChanges(); // flush l'effet de pré-remplissage de l'armure
    c.damageRoll.set(3);
    expect(c.totalDamage()).toBe(0);
  });

  it('option "dévastateur" ajoute 6 dégâts', () => {
    const {c} = setup({vigueur: 0});
    c.damageRoll.set(4);
    c.heroicOptionSlug1.set('devastateur');
    expect(c.totalDamage()).toBe(10); // 4+0+6
  });

  it('armor-chink ignore l\'armure de la cible', () => {
    const target = makeSlot({id: 'target', armures: [{nom: 'Plaque', protection: '5', malus: null}]});
    const {c} = setup({vigueur: 0}, [target]);
    c.targetId.set('target');
    c.combatOptionSlug.set('armor-chink');
    c.damageRoll.set(4);
    // armure ignorée (defautArmure = true quand armor-chink)
    expect(c.totalDamage()).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════
// ARMES DISPONIBLES — availableArmes
// ═══════════════════════════════════════════════════════

describe('availableArmes', () => {
  it('retourne la liste d\'armes de l\'attaquant', () => {
    const arme = makeArme({nom: 'Hache'});
    const {c} = setup({armesList: [arme]});
    expect(c.availableArmes()).toEqual([arme]);
  });

  it('construit une arme virtuelle à partir du champ degats si pas d\'armement', () => {
    const {c} = setup({degats: 'd6', armesList: []});
    const armes = c.availableArmes();
    expect(armes).toHaveLength(1);
    expect(armes[0].nom).toBe('Attaque');
    expect(armes[0].categorie).toBe('moyenne'); // d6 → moyenne
  });

  it('retourne [] si pas d\'armes ni de degats', () => {
    const {c} = setup({degats: null, armesList: []});
    expect(c.availableArmes()).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════
// CATÉGORIE DEPUIS DÉGÂTS — categorieFromDegats (indirecte)
// Testée via availableArmes avec degats
// ═══════════════════════════════════════════════════════

describe('categorieFromDegats (via availableArmes)', () => {
  const cases: [string, string][] = [
    ['d3', 'nue'],
    ['d6M', 'legere'],
    ['d6B', 'lourde'],
    ['d6', 'moyenne'],
  ];

  cases.forEach(([degats, expectedCategorie]) => {
    it(`"${degats}" → catégorie "${expectedCategorie}"`, () => {
      const {c} = setup({degats, armesList: []});
      expect(c.availableArmes()[0].categorie).toBe(expectedCategorie);
    });
  });
});

// ═══════════════════════════════════════════════════════
// PROTECTION FIXE — protectionFixed (indirecte)
// Testée via targetArmorFixed
// ═══════════════════════════════════════════════════════

describe('protectionFixed (via targetArmorFixed)', () => {
  function setupWithTargetArmor(protection: string | null) {
    const target = makeSlot({id: 'target', armures: [{nom: 'Armure', protection, malus: null}]});
    const {c} = setup({}, [target]);
    c.targetId.set('target');
    return c;
  }

  it('protection numérique simple : "3" → 3', () => {
    const c = setupWithTargetArmor('3');
    expect(c.targetArmorFixed()).toBe(3);
  });

  it('protection avec parenthèses : "(2)" → 2', () => {
    const c = setupWithTargetArmor('(2)');
    expect(c.targetArmorFixed()).toBe(2);
  });

  it('protection avec plus : "+1" → 1', () => {
    const c = setupWithTargetArmor('+1');
    expect(c.targetArmorFixed()).toBe(1);
  });

  it('protection null : → 0', () => {
    const c = setupWithTargetArmor(null);
    expect(c.targetArmorFixed()).toBe(0);
  });

  it('protection textuelle non parseable : → 0', () => {
    const c = setupWithTargetArmor('d6-3');
    expect(c.targetArmorFixed()).toBe(0);
  });
});
