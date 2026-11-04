import {TestBed} from '@angular/core/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {SceneStageStore} from '../theatre/scene-stage.store';
import {TableStore} from './table.store';

describe('TableStore', () => {
  const jouer = vi.fn(() => of({}));
  const fightSession = vi.fn(() => of({id: 't1', statut: 'libre'}));

  function store(): TableStore {
    jouer.mockClear();
    fightSession.mockClear();
    TestBed.configureTestingModule({
      providers: [
        TableStore,
        {provide: BolFightSessionService, useValue: {jouer, fightSession}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: SceneStageStore, useValue: {}},
      ],
    });
    return TestBed.inject(TableStore);
  }

  it('entrer à la table la marque jouée, puis la charge', () => {
    const table = store();

    table.entrer('t1');

    expect(jouer).toHaveBeenCalledWith('t1');
    expect(fightSession).toHaveBeenCalledWith('t1');
  });

  it('recharger la table ne la marque pas jouée une fois de plus', () => {
    const table = store();

    table.loadSession('t1');

    expect(jouer).not.toHaveBeenCalled();
  });
});
