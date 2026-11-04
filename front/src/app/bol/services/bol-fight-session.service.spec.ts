import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {extractApiErrorMessage} from '../../core/api-error.utils';
import {BolFightSessionModel} from '../models/bol-fight-session.model';
import {BolFightSessionService, DELAI_APPEL_TABLE_MS} from './bol-fight-session.service';

const session: BolFightSessionModel = {id: 's', titre: null, statut: 'combat'};

describe('BolFightSessionService', () => {
  let service: BolFightSessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(BolFightSessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('oublie, en supprimant une partie, l’issue de combat retenue pour elle dans ce navigateur', () => {
    const memoire = new Map([['dw-issue-annoncee:s', 'victoire'], ['dw-issue-annoncee:autre', 'victoire']]);
    vi.stubGlobal('localStorage', {removeItem: (cle: string) => memoire.delete(cle)});

    service.delete('s').subscribe();
    http.expectOne((request) => request.url.endsWith('/delete/s')).flush(true);
    vi.unstubAllGlobals();

    expect([...memoire.keys()]).toEqual(['dw-issue-annoncee:autre']);
  });

  it('sends a table call only once the previous one has returned', () => {
    const received: string[] = [];
    service.applyDamage('s', 'hero', 1, -2).subscribe(() => received.push('damage'));
    service.updateCombatState('s', {round: 1, joues: []}).subscribe(() => received.push('etat'));
    service.fightSession('s').subscribe(() => received.push('get'));

    const damage = http.expectOne((request) => request.url.endsWith('/combatant/hero/1/damage'));
    http.expectNone((request) => request.url.endsWith('/etat-combat'));
    damage.flush(session);

    const etat = http.expectOne((request) => request.url.endsWith('/etat-combat'));
    http.expectNone((request) => request.method === 'GET');
    etat.flush(session);

    http.expectOne((request) => request.method === 'GET').flush(session);

    expect(received).toEqual(['damage', 'etat', 'get']);
  });

  it('gives a failure to its caller only: the next call still leaves', () => {
    const errors: number[] = [];
    let next: BolFightSessionModel | null = null;
    service.applyDamage('s', 'hero', 1, -2).subscribe({error: (error: {status: number}) => errors.push(error.status)});
    service.setCamp('s', 'pnj', 2, 'heros').subscribe((value) => (next = value));

    http.expectOne((request) => request.url.endsWith('/damage')).flush('non', {status: 500, statusText: 'Erreur'});
    http.expectOne((request) => request.url.endsWith('/camp')).flush(session);

    expect(errors).toEqual([500]);
    expect(next).toEqual(session);
  });

  it('fait échouer un appel resté sans réponse au bout du délai, avec le message habituel, et laisse partir le suivant', () => {
    vi.useFakeTimers();
    try {
      const errors: string[] = [];
      let next: BolFightSessionModel | null = null;
      service.applyDamage('s', 'hero', 1, -2).subscribe({error: (error: unknown) => errors.push(extractApiErrorMessage(error, 'Impossible d’appliquer les dégâts.'))});
      service.setCamp('s', 'pnj', 2, 'heros').subscribe((value) => (next = value));

      const damage = http.expectOne((request) => request.url.endsWith('/damage'));
      vi.advanceTimersByTime(DELAI_APPEL_TABLE_MS - 1);
      expect(errors).toEqual([]);
      http.expectNone((request) => request.url.endsWith('/camp'));

      vi.advanceTimersByTime(1);
      expect(errors).toEqual(['Impossible d’appliquer les dégâts.']);
      expect(damage.cancelled).toBe(true);
      http.expectOne((request) => request.url.endsWith('/camp')).flush(session);
      expect(next).toEqual(session);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends nothing before the subscription, and each subscription once', () => {
    const call = service.fightSession('s');
    http.expectNone((request) => request.method === 'GET');

    call.subscribe();
    http.expectOne((request) => request.method === 'GET').flush(session);
  });

  it('lists the sessions without waiting for the table', () => {
    service.applyDamage('s', 'hero', 1, -2).subscribe();
    service.fightSessions().subscribe();

    http.expectOne((request) => request.method === 'GET').flush([]);
    http.expectOne((request) => request.url.endsWith('/damage')).flush(session);
  });
});
