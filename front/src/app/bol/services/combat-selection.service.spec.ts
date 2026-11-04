import {TestBed} from '@angular/core/testing';
import {Observable, of, throwError} from 'rxjs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BolFightSessionCreatePayload, BolFightSessionModel} from '../models/bol-fight-session.model';
import {BolHerosModel} from '../models/bol-heros.model';
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
  let heroes: () => Observable<BolHerosModel[]>;

  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    localStorage.clear();
    payloads = [];
    heroes = () => of([]);

    TestBed.configureTestingModule({
      providers: [
        {provide: BolHerosService, useValue: {heroes: () => heroes()}},
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

  it('launches the table with its scenario', () => {
    selection.launch(null, 'sc1').subscribe();
    selection.launch().subscribe();

    expect(payloads[0].scenario_id).toBe('sc1');
    expect(payloads[1].scenario_id).toBeNull();
  });

  describe('loadCatalog', () => {
    it('lowers loading and flags the failure when a library call fails, instead of staying blocked', () => {
      heroes = () => throwError(() => new Error('hors ligne'));

      selection.loadCatalog();

      expect(selection.loading()).toBe(false);
      expect(selection.loadFailed()).toBe(true);
    });

    it('can be retried after a failure, and clears the failure flag once the catalogue is loaded', () => {
      heroes = () => throwError(() => new Error('hors ligne'));
      selection.loadCatalog();
      heroes = () => of([{id: 'h1', origines: {nom: 'Axel'}, ressources: {vitalite: 8}} as unknown as BolHerosModel]);

      selection.loadCatalog();

      expect(selection.loadFailed()).toBe(false);
      expect(selection.loading()).toBe(false);
      expect(selection.entryFor('hero:h1')?.nom).toBe('Axel');
    });
  });
});
