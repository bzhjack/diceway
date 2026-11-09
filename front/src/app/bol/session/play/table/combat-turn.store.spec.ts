import {LiveAnnouncer} from '@angular/cdk/a11y';
import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of, throwError} from 'rxjs';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {EtatCombat} from '../../models/combat-turn.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {effetActionPerdue, effetLibre, perdSonAction} from '../tapis/combat-effects.util';
import {CombatTurnStore} from './combat-turn.store';
import {TableStore} from './table.store';

function card(kind: TapisKind, pivotId: number): TapisCard {
  return {
    key: `${kind}-${pivotId}`,
    kind,
    camp: kind === 'hero' ? 'heros' : 'adversaires',
    pivotId,
    sourceId: 'src',
    nom: `${kind} ${pivotId}`,
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '0',
    vitaliteCourante: 10,
    vitaliteMax: 10,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
  };
}

describe('CombatTurnStore : le début de tour ne passe que quand la main change', () => {
  let store: CombatTurnStore;
  let session: ReturnType<typeof signal<BolFightSessionModel | null>>;
  const updateCombatState = vi.fn();

  /** Monte le store sur une session dont l'état du combat est `etatCombat` : rappelé avec l'état enregistré, c'est la page rechargée. */
  function monter(etatCombat: Partial<EtatCombat>): void {
    TestBed.resetTestingModule();
    session = signal<BolFightSessionModel | null>({id: 's1', statut: 'combat', etat_combat: etatCombat} as unknown as BolFightSessionModel);
    updateCombatState.mockReset();
    // Le serveur renvoie la session avec l'état reçu, comme `BolCombatState::merge`.
    updateCombatState.mockImplementation((_id: string, etat: Partial<EtatCombat>) => of({...session(), etat_combat: {depart: {}, ...etat}}));
    TestBed.configureTestingModule({
      providers: [
        CombatTurnStore,
        {
          provide: TableStore,
          useValue: {session, cards: signal([card('hero', 1), card('pnj', 7)]), board: signal({tokens: []}), mode: signal('combat'), sessionId: signal('s1'), notifyError: vi.fn()},
        },
        {provide: BolFightSessionService, useValue: {updateCombatState}},
        {provide: BolHerosService, useValue: {}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    store = TestBed.inject(CombatTurnStore);
    TestBed.tick();
  }

  beforeEach(() => monter({round: 2, joues: [], effets: [], exclus: [], fuis: [], melee: null}));

  it('« Perd sa prochaine action » posé sur la carte qui joue ne saute pas son tour en cours', () => {
    expect(store.activeKey()).toBe('hero-1');

    store.onEffectAdded(effetActionPerdue('hero-1'));
    TestBed.tick();

    expect(store.activeKey()).toBe('hero-1');
    expect(store.etat().joues).toEqual([]);
    // Elle vise sa prochaine action : celle-ci reste jouable.
    expect(perdSonAction(store.etat().effets, 'hero-1')).toBe(false);
  });

  it('« Perd sa prochaine action » posé sur la carte qui joue ne saute pas son tour en cours au rechargement de la page', () => {
    store.onEffectAdded(effetActionPerdue('hero-1'));
    TestBed.tick();

    monter(session()!.etat_combat as Partial<EtatCombat>);

    expect(store.activeKey()).toBe('hero-1');
    expect(store.etat().joues).toEqual([]);
    expect(store.etat().effets.map((effet) => effet.libelle)).toEqual(['perd sa prochaine action']);
  });

  it('« Perd sa prochaine action » posé sur la carte qui joue lui fait sauter son prochain tour', () => {
    store.onEffectAdded(effetActionPerdue('hero-1'));
    TestBed.tick();
    store.onEndTurn();
    TestBed.tick();
    expect(store.activeKey()).toBe('pnj-7');

    store.onEndTurn();
    TestBed.tick();

    // Round 3 : son tour est sauté, la main passe au PNJ.
    expect(store.etat().round).toBe(3);
    expect(store.etat().joues).toEqual(['hero-1']);
    expect(store.activeKey()).toBe('pnj-7');
  });

  it('« Perd sa prochaine action » posé sur une autre carte que celle qui joue lui fait sauter son prochain tour', () => {
    store.onEffectAdded(effetActionPerdue('pnj-7'));
    TestBed.tick();
    store.onEndTurn();
    TestBed.tick();

    // Le tour du PNJ est sauté : le round suivant commence, le héros rejoue.
    expect(store.etat().round).toBe(3);
    expect(store.activeKey()).toBe('hero-1');
  });

  it('un effet « jusqu’à son prochain tour » posé sur la carte qui joue n’est pas effacé aussitôt', () => {
    store.onEffectAdded(effetLibre({porteur: 'hero-1', stat: 'defense', valeur: 2, libelle: 'à couvert', duree: {type: 'debut-tour-porteur'}}));
    TestBed.tick();

    expect(store.etat().effets.map((effet) => effet.libelle)).toEqual(['à couvert']);
  });
});

describe('CombatTurnStore : le début de round n’est joué que par l’écran qui l’a commencé', () => {
  let store: CombatTurnStore;
  let session: ReturnType<typeof signal<BolFightSessionModel | null>>;
  const updateCombatState = vi.fn();
  const fightSession = vi.fn();
  const notifyError = vi.fn();

  beforeEach(() => {
    TestBed.resetTestingModule();
    fightSession.mockReset();
    notifyError.mockReset();
    session = signal<BolFightSessionModel | null>({id: 's1', statut: 'combat', etat_combat: {round: 2, joues: [], effets: [], exclus: [], fuis: [], melee: null}} as unknown as BolFightSessionModel);
    updateCombatState.mockReset();
    updateCombatState.mockImplementation((_id: string, etat: Partial<EtatCombat>) => of({...session(), etat_combat: {depart: {}, ...etat}}));
    TestBed.configureTestingModule({
      providers: [
        CombatTurnStore,
        {
          provide: TableStore,
          useValue: {session, cards: signal([card('hero', 1), card('pnj', 7)]), board: signal({tokens: []}), mode: signal('combat'), sessionId: signal('s1'), notifyError},
        },
        {provide: BolFightSessionService, useValue: {updateCombatState, fightSession}},
        {provide: BolHerosService, useValue: {}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    store = TestBed.inject(CombatTurnStore);
    TestBed.tick();
  });

  it('la réponse qui commence le round se perd, mais le serveur l’a enregistré : cet écran en joue quand même le début', () => {
    store.onEndTurn();
    TestBed.tick();
    // Le serveur enregistre la fin du dernier tour du round… et la réponse se perd.
    updateCombatState.mockImplementation((_id: string, etat: Partial<EtatCombat>) => {
      fightSession.mockReturnValue(of({...session(), etat_combat: {depart: {}, ...etat}}));
      return throwError(() => new Error('réseau'));
    });

    store.onEndTurn();
    TestBed.tick();

    expect(store.etat().round).toBe(3);
    expect(store.roundCommenceIci()).toEqual({round: 3});
    expect(notifyError).not.toHaveBeenCalled();
    expect(updateCombatState).toHaveBeenCalledTimes(2);
  });

  it('annonce le round que son propre enregistrement fait commencer, une fois la session à jour', () => {
    expect(store.roundCommenceIci()).toBeNull();
    store.onEndTurn();
    TestBed.tick();
    expect(store.roundCommenceIci()).toBeNull();

    store.onEndTurn();
    TestBed.tick();

    expect(store.etat().round).toBe(3);
    expect(store.roundCommenceIci()).toEqual({round: 3});
  });

  it('n’annonce rien quand le nouveau round arrive dans une session reçue (un second écran sur la même table)', () => {
    session.set({...session(), etat_combat: {round: 3, joues: [], effets: [], exclus: [], fuis: [], melee: null}} as unknown as BolFightSessionModel);
    TestBed.tick();

    expect(store.etat().round).toBe(3);
    expect(store.roundCommenceIci()).toBeNull();
  });
});

describe('CombatTurnStore : « Fuite opportune »', () => {
  let store: CombatTurnStore;
  let session: ReturnType<typeof signal<BolFightSessionModel | null>>;
  const fuiteOpportune = vi.fn();
  const adjustVilenie = vi.fn();
  const updateCombatState = vi.fn();
  const notifyError = vi.fn();
  const rival: TapisCard = {...card('pnj', 7), rang: 'Rival', badge: 'Rival', vilenie: 2};
  const rivalAllie: TapisCard = {...card('pnj', 8), camp: 'heros', rang: 'Rival', badge: 'Allié', vilenie: 2};

  beforeEach(() => {
    TestBed.resetTestingModule();
    session = signal<BolFightSessionModel | null>({id: 's1', statut: 'combat', etat_combat: {round: 2, joues: [], effets: [], exclus: [], fuis: [], melee: null}} as unknown as BolFightSessionModel);
    for (const fn of [fuiteOpportune, adjustVilenie, updateCombatState, notifyError]) {
      fn.mockReset();
    }
    updateCombatState.mockImplementation((_id: string, etat: Partial<EtatCombat>) => of({...session(), etat_combat: {depart: {}, ...etat}}));
    TestBed.configureTestingModule({
      providers: [
        CombatTurnStore,
        {
          provide: TableStore,
          useValue: {session, cards: signal([card('hero', 1), rival, rivalAllie]), board: signal({tokens: []}), mode: signal('combat'), sessionId: signal('s1'), notifyError},
        },
        {provide: BolFightSessionService, useValue: {fuiteOpportune, adjustVilenie, updateCombatState}},
        {provide: BolHerosService, useValue: {}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    store = TestBed.inject(CombatTurnStore);
    TestBed.tick();
    updateCombatState.mockClear();
  });

  it("n'est pas proposée à un rival allié des héros", () => {
    expect(store.canFlee(rival)).toBe(true);
    expect(store.canFlee(rivalAllie)).toBe(false);

    store.flee(rivalAllie);

    expect(fuiteOpportune).not.toHaveBeenCalled();
  });

  it('dépense la vilénie et fait partir le rival en un seul appel, dont la réponse fait foi', () => {
    const apres = {...session(), etat_combat: {round: 2, joues: [], effets: [], exclus: ['pnj-7'], fuis: ['pnj-7'], melee: null}} as unknown as BolFightSessionModel;
    fuiteOpportune.mockReturnValue(of(apres));

    store.flee(rival);
    TestBed.tick();

    expect(fuiteOpportune).toHaveBeenCalledExactlyOnceWith('s1', 7);
    expect(adjustVilenie).not.toHaveBeenCalled();
    expect(updateCombatState).not.toHaveBeenCalled();
    expect(store.etat().fuis).toEqual(['pnj-7']);
  });

  it("en cas d'échec, prévient le MJ et laisse le rival au combat", () => {
    fuiteOpportune.mockReturnValue(throwError(() => new Error('réseau')));

    store.flee(rival);
    TestBed.tick();

    expect(notifyError).toHaveBeenCalledOnce();
    expect(adjustVilenie).not.toHaveBeenCalled();
    expect(store.etat().fuis).toEqual([]);
    expect(store.etat().exclus).toEqual([]);
  });
});

describe('CombatTurnStore : un effet qui expire est annoncé aux lecteurs d’écran', () => {
  let store: CombatTurnStore;
  let session: ReturnType<typeof signal<BolFightSessionModel | null>>;
  const announce = vi.fn();

  function monter(etatCombat: Partial<EtatCombat>): void {
    TestBed.resetTestingModule();
    announce.mockReset();
    session = signal<BolFightSessionModel | null>({id: 's1', statut: 'combat', etat_combat: etatCombat} as unknown as BolFightSessionModel);
    const updateCombatState = vi.fn((_id: string, etat: Partial<EtatCombat>) => of({...session(), etat_combat: {depart: {}, ...etat}}));
    TestBed.configureTestingModule({
      providers: [
        CombatTurnStore,
        {
          provide: TableStore,
          useValue: {session, cards: signal([card('hero', 1), card('pnj', 7)]), board: signal({tokens: []}), mode: signal('combat'), sessionId: signal('s1'), notifyError: vi.fn()},
        },
        {provide: BolFightSessionService, useValue: {updateCombatState}},
        {provide: BolHerosService, useValue: {}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: LiveAnnouncer, useValue: {announce}},
      ],
    });
    store = TestBed.inject(CombatTurnStore);
    TestBed.tick();
  }

  const posture = {
    id: 'e-1',
    origine: 'posture-defensive',
    porteur: 'pnj-7',
    stat: 'defense',
    valeur: 1,
    quand: 'subie',
    duree: {type: 'debut-tour-porteur'},
    manuel: false,
  } as const;

  it('l’effet « jusqu’à son prochain tour » tombe quand son porteur prend la main : annoncé', () => {
    monter({round: 2, joues: [], effets: [posture], exclus: [], fuis: [], melee: null});
    expect(announce).not.toHaveBeenCalled();

    store.onEndTurn();
    TestBed.tick();

    expect(store.activeKey()).toBe('pnj-7');
    expect(announce).toHaveBeenCalledWith("Fin de l'effet posture défensive sur pnj 7.", 'polite');
  });

  it('un effet retiré à la main par le MJ n’est pas annoncé', () => {
    monter({round: 2, joues: [], effets: [posture], exclus: [], fuis: [], melee: null});

    store.onEffectRemoved('e-1');
    TestBed.tick();

    expect(store.etat().effets).toEqual([]);
    expect(announce).not.toHaveBeenCalled();
  });
});
