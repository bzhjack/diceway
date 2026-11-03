import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of, throwError} from 'rxjs';
import {DwConfirmDialogData} from '../../../shared/models/dw-confirm-dialog.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {CloseTableService} from './close-table.service';

describe('CloseTableService', () => {
  function monter(confirme: boolean, fermeture = of({})) {
    const open = vi.fn((_component: unknown, config: {data: DwConfirmDialogData}) => ({afterClosed: () => of(confirme), config}));
    const close = vi.fn(() => fermeture);
    const snack = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {provide: MatDialog, useValue: {open}},
        {provide: MatSnackBar, useValue: {open: snack}},
        {provide: BolFightSessionService, useValue: {close}},
      ],
    });
    return {service: TestBed.inject(CloseTableService), open, close, snack};
  }

  it('clôt la table une fois confirmé, et le dit', () => {
    const {service, open, close} = monter(true);
    const resultats: boolean[] = [];

    service.clore({id: 't1', enCombat: false}).subscribe((r) => resultats.push(r));

    expect(open.mock.calls[0][1].data.title).toBe('Clore la table');
    expect(open.mock.calls[0][1].data.message).not.toContain('combat');
    expect(close).toHaveBeenCalledWith('t1');
    expect(resultats).toEqual([true]);
  });

  it('prévient qu’un combat en cours prend fin sans les soins d’après combat', () => {
    const {service, open} = monter(true);

    service.clore({id: 't1', enCombat: true}).subscribe();

    expect(open.mock.calls[0][1].data.message).toContain('Le combat en cours prend fin, sans les soins d’après combat.');
  });

  it('ne fait rien sans confirmation', () => {
    const {service, close} = monter(false);
    const resultats: boolean[] = [];

    service.clore({id: 't1', enCombat: false}).subscribe((r) => resultats.push(r));

    expect(close).not.toHaveBeenCalled();
    expect(resultats).toEqual([false]);
  });

  it('signale un échec et ne dit pas la table close', () => {
    const {service, snack} = monter(true, throwError(() => new Error('500')));
    const resultats: boolean[] = [];

    service.clore({id: 't1', enCombat: false}).subscribe((r) => resultats.push(r));

    expect(snack).toHaveBeenCalled();
    expect(resultats).toEqual([false]);
  });
});
