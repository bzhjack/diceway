import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of} from 'rxjs';
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

  beforeEach(() => {
    session = signal<BolFightSessionModel | null>({id: 's1', statut: 'combat', etat_combat: {round: 2, joues: [], effets: [], exclus: [], fuis: [], melee: null}} as unknown as BolFightSessionModel);
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
  });

  it('« Perd sa prochaine action » posé sur la carte qui joue ne saute pas son tour en cours', () => {
    expect(store.activeKey()).toBe('hero-1');

    store.onEffectAdded(effetActionPerdue('hero-1'));
    TestBed.tick();

    expect(store.activeKey()).toBe('hero-1');
    expect(store.etat().joues).toEqual([]);
    expect(perdSonAction(store.etat().effets, 'hero-1')).toBe(true);
  });

  it('un effet « jusqu’à son prochain tour » posé sur la carte qui joue n’est pas effacé aussitôt', () => {
    store.onEffectAdded(effetLibre({porteur: 'hero-1', stat: 'defense', valeur: 2, libelle: 'à couvert', duree: {type: 'debut-tour-porteur'}}));
    TestBed.tick();

    expect(store.etat().effets.map((effet) => effet.libelle)).toEqual(['à couvert']);
  });
});
