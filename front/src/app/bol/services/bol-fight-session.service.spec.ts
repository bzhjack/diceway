import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {BolFightSessionModel} from '../models/bol-fight-session.model';
import {BolFightSessionService} from './bol-fight-session.service';

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
