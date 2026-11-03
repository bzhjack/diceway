import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EMPTY, of} from 'rxjs';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {CARRIERE_MEDECIN_ID} from '../../../bol-rules.constants';
import {EtatCombat} from '../../models/combat-turn.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {AfterCombatDialogData} from '../../models/after-combat-dialog.model';
import {CombatOutcomeDialogData} from '../../models/combat-outcome-dialog.model';
import {effetParalyse} from '../tapis/combat-effects.util';
import {CombatEndService} from './combat-end.service';
import {CombatTurnStore} from './combat-turn.store';
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

/** Une fiche de médecin : chaque héros et PNJ allié de la table en a la carrière. */
const MEDECIN = {
  id: 'h',
  active: true,
  origines: {nom: 'Médecin', joueur: null},
  carrieres: [{carriere_id: CARRIERE_MEDECIN_ID, carriere: {carriere: 'Médecin'}, value: 2}],
  armes: [],
  armures: [],
  traits: [],
} as unknown as BolHerosModel;

function etat(over: Partial<EtatCombat> = {}): EtatCombat {
  return {round: 2, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null, ...over};
}

describe('CombatEndService', () => {
  const open = vi.fn();

  function setup(cards: readonly TapisCard[], etatCombat: EtatCombat): CombatEndService {
    open.mockReset();
    open.mockReturnValue({afterClosed: () => EMPTY});
    TestBed.configureTestingModule({
      providers: [
        CombatEndService,
        {provide: TableStore, useValue: {mode: signal('combat'), cards: signal(cards), session: signal({id: 's1'}), loadSession: vi.fn()}},
        {provide: CombatTurnStore, useValue: {etat: signal(etatCombat)}},
        {provide: BolHerosService, useValue: {heros: () => of(MEDECIN)}},
        {provide: BolFightSessionService, useValue: {}},
        {provide: MatDialog, useValue: {open, openDialogs: []}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    const service = TestBed.inject(CombatEndService);
    TestBed.tick();
    return service;
  }

  it('announces a victory when the last opponent standing is paralysed', () => {
    setup([card('hero', 1), card('pnj', 7)], etat({effets: [{...effetParalyse('pnj-7'), id: 'e-1'}]}));

    expect(open).toHaveBeenCalledTimes(1);
    expect((open.mock.calls[0][1] as {data: CombatOutcomeDialogData}).data.outcome).toBe('victoire');
  });

  it('« Après combat » only offers healers who are still standing', () => {
    const debout = card('hero', 1, {nom: 'Debout'});
    const inconscient = card('hero', 2, {nom: 'Inconscient', vitaliteCourante: 0});
    const mort = card('hero', 3, {nom: 'Mort', vitaliteCourante: -7});
    const allieATerre = card('pnj', 4, {nom: 'Allié à terre', camp: 'heros', vitaliteCourante: 0});
    const paralyse = card('hero', 5, {nom: 'Paralysé'});
    const allie = card('pnj', 6, {nom: 'Allié', camp: 'heros'});
    const service = setup([debout, inconscient, mort, allieATerre, paralyse, allie, card('pnj', 7, {vitaliteCourante: 0})], etat({effets: [{...effetParalyse('hero-5'), id: 'e-1'}]}));
    open.mockClear();

    service.askEndCombat();

    const data = (open.mock.calls[0][1] as {data: AfterCombatDialogData}).data;
    expect(data.healers.map((healer) => healer.nom)).toEqual(['Debout', 'Allié']);
  });
});
