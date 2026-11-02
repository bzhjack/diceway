import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BolFightSessionCreatePayload, BolFightSessionModel} from '../models/bol-fight-session.model';
import {BolCreaturesService} from './bol-creatures.service';
import {BolDemonsService} from './bol-demons.service';
import {BolFightSessionService} from './bol-fight-session.service';
import {BolHerosService} from './bol-heros.service';
import {BolPnjService} from './bol-pnj.service';
import {CombatSelectionService} from './combat-selection.service';

/** Le localStorage manque à l'environnement de test (Node récent sans fichier de stockage) : un stockage en mémoire le remplace. */
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  };
}

describe('CombatSelectionService', () => {
  let selection: CombatSelectionService;
  let payloads: BolFightSessionCreatePayload[];

  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    localStorage.clear();
    payloads = [];

    TestBed.configureTestingModule({
      providers: [
        {provide: BolHerosService, useValue: {heroes: () => of([])}},
        {provide: BolPnjService, useValue: {pnjs: () => of([])}},
        {provide: BolCreaturesService, useValue: {creatures: () => of([])}},
        {provide: BolDemonsService, useValue: {demons: () => of([])}},
        {
          provide: BolFightSessionService,
          useValue: {
            create: (payload: BolFightSessionCreatePayload) => {
              payloads.push(payload);
              return of({id: 's1', titre: null, statut: 'libre'} as BolFightSessionModel);
            },
          },
        },
      ],
    });
    selection = TestBed.inject(CombatSelectionService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('preselects the heroes when the selection is empty', () => {
    selection.preselectHeroes(['h1', 'h2']);

    expect(selection.combatants()).toEqual([
      {catalogId: 'hero:h1', qty: 1},
      {catalogId: 'hero:h2', qty: 1},
    ]);
  });

  it('never overwrites a selection already started', () => {
    selection.combatants.set([{catalogId: 'hero:h9', qty: 1}]);

    selection.preselectHeroes(['h1']);

    expect(selection.combatants()).toEqual([{catalogId: 'hero:h9', qty: 1}]);
  });

  it('launches the table with its scenario', () => {
    selection.launch(null, 'sc1').subscribe();
    selection.launch().subscribe();

    expect(payloads[0].scenario_id).toBe('sc1');
    expect(payloads[1].scenario_id).toBeNull();
  });
});
