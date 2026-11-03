import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of, throwError} from 'rxjs';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {EtatCombat} from '../../models/combat-turn.model';
import {MeleeCamps} from '../../models/melee-pietaille.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {CombatStatsStore} from './combat-stats.store';
import {CombatTurnStore} from './combat-turn.store';
import {CombatWoundsService} from './combat-wounds.service';
import {TableStore} from './table.store';

function card(kind: TapisKind, pivotId: number, extra: Partial<TapisCard> = {}): TapisCard {
  return {
    key: `${kind}-${pivotId}`,
    kind,
    camp: kind === 'hero' ? 'heros' : 'adversaires',
    pivotId,
    sourceId: `src-${kind}-${pivotId}`,
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
    ...extra,
  };
}

function etat(over: Partial<EtatCombat> = {}): EtatCombat {
  return {round: 2, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null, ...over};
}

const SESSION = {id: 's1', statut: 'combat'} as unknown as BolFightSessionModel;

describe('CombatWoundsService', () => {
  const applyDamage = vi.fn();
  const open = vi.fn();
  const recordMelee = vi.fn();
  const notifyError = vi.fn();
  let etatCombat: ReturnType<typeof signal<EtatCombat>>;
  let roundCommenceIci: ReturnType<typeof signal<{readonly round: number} | null>>;

  function setup(cards: readonly TapisCard[], camps: MeleeCamps = {heros: [], adversaires: []}): CombatWoundsService {
    TestBed.resetTestingModule();
    for (const fn of [applyDamage, open, recordMelee, notifyError]) {
      fn.mockReset();
    }
    etatCombat = signal(etat());
    roundCommenceIci = signal(null);
    TestBed.configureTestingModule({
      providers: [
        CombatWoundsService,
        {
          provide: TableStore,
          useValue: {session: signal(SESSION), cards: signal(cards), mode: signal('combat'), sessionId: signal('s1'), notifyError, loadSession: vi.fn()},
        },
        {
          provide: CombatTurnStore,
          useValue: {
            etat: etatCombat,
            roundCommenceIci,
            meleeCamps: signal(camps),
            meleeDisponibilite: signal('disponible'),
            recordMelee,
            saveEtat: vi.fn(),
          },
        },
        {provide: CombatStatsStore, useValue: {}},
        {provide: BolFightSessionService, useValue: {applyDamage}},
        {provide: BolHerosService, useValue: {heros: vi.fn(() => of({ressources: {heroisme: 0, vitalite: 10}}))}},
        {provide: MatDialog, useValue: {open}},
        {provide: MatSnackBar, useValue: {open: vi.fn(() => ({afterDismissed: () => of({dismissedByAction: false})}))}},
      ],
    });
    const service = TestBed.inject(CombatWoundsService);
    TestBed.tick();
    return service;
  }

  describe('début de round', () => {
    const MOURANT = card('hero', 1, {vitaliteCourante: -2});

    it('un round arrivé dans une session reçue (second écran sur la même table) ne fait pas saigner les mourants une seconde fois', () => {
      setup([MOURANT]);
      applyDamage.mockReturnValue(of(SESSION));

      etatCombat.set(etat({round: 3}));
      TestBed.tick();

      expect(applyDamage).not.toHaveBeenCalled();
    });

    it('le round que cet écran a commencé fait saigner les mourants, une fois', () => {
      setup([MOURANT]);
      applyDamage.mockReturnValue(of(SESSION));

      etatCombat.set(etat({round: 3}));
      roundCommenceIci.set({round: 3});
      TestBed.tick();
      TestBed.tick();

      expect(applyDamage).toHaveBeenCalledExactlyOnceWith('s1', 'hero', 1, -1);
    });
  });

  describe('mêlée de piétaille', () => {
    const SUIVANT = card('pnj', 1, {camp: 'heros', rang: 'Piétaille'});
    const B1 = card('pnj', 2, {rang: 'Piétaille'});
    const B2 = card('pnj', 3, {rang: 'Piétaille'});

    it('interrompue après ses premières pertes enregistrées, elle est faite pour ce round : elle ne se rejoue pas', () => {
      const service = setup([SUIVANT, B1, B2], {heros: [SUIVANT], adversaires: [B1, B2]});
      open.mockReturnValue({afterClosed: () => of({tombes: ['pnj-2', 'pnj-3']})});
      applyDamage.mockReturnValueOnce(of(SESSION)).mockReturnValueOnce(throwError(() => new Error('réseau')));

      service.onPietailleMelee();

      expect(applyDamage).toHaveBeenCalledTimes(2);
      expect(recordMelee).toHaveBeenCalled();
      expect(notifyError).toHaveBeenCalledOnce();
    });

    it('sans aucune perte enregistrée, elle reste à jouer', () => {
      const service = setup([SUIVANT, B1, B2], {heros: [SUIVANT], adversaires: [B1, B2]});
      open.mockReturnValue({afterClosed: () => of({tombes: ['pnj-2']})});
      applyDamage.mockReturnValueOnce(throwError(() => new Error('réseau')));

      service.onPietailleMelee();

      expect(recordMelee).not.toHaveBeenCalled();
      expect(notifyError).toHaveBeenCalledOnce();
    });
  });
});
