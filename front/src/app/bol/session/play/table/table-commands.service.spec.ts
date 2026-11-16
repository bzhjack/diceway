import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {BolSceneDistributionSaisie, BolSceneModel} from '../../../models/bol-scene.model';
import {PersonnagesDialogData} from '../../../scenario/models/personnages-dialog.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {SceneStageStore} from '../theatre/scene-stage.store';
import {ExpandedCardStore} from './expanded-card.store';
import {TableCommandsService} from './table-commands.service';
import {TableStore} from './table.store';

const LOUPS: BolSceneDistributionSaisie = {kind: 'creature', source_id: 'c1', qty: 3, camp: 'adversaires', attitude: 'hostile'};
const GUE = {id: 's1', titre: 'Le gué', image: null, lieu: 'Gué du Tyr', moment: 'nuit', danger: 2} as unknown as BolSceneModel;

describe('TableCommandsService.ajouterDesPersonnages', () => {
  function monter(choix: BolSceneDistributionSaisie[] | undefined) {
    const apres = {id: 't1', titre: 'Table'} as unknown as BolFightSessionModel;
    const open = vi.fn(() => ({afterClosed: () => of(choix)}));
    const ajouter = vi.fn(() => of({session: apres, ignored: 0}));
    const session = signal<BolFightSessionModel | null>({id: 't1', titre: 'Table'} as unknown as BolFightSessionModel);
    const snack = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        TableCommandsService,
        {provide: MatDialog, useValue: {open}},
        {provide: MatSnackBar, useValue: {open: snack}},
        {provide: Router, useValue: {}},
        {provide: BolFightSessionService, useValue: {ajouterDesPersonnages: ajouter}},
        {provide: TableStore, useValue: {sessionId: signal('t1'), session}},
        {provide: SceneStageStore, useValue: {displayedScene: signal(GUE), sagaId: signal('perle')}},
        {provide: ExpandedCardStore, useValue: {foldCard: vi.fn()}},
      ],
    });
    TestBed.inject(TableCommandsService).ajouterDesPersonnages();
    const data = (open.mock.calls[0] as unknown[])[1] as {data: PersonnagesDialogData};
    return {data: data.data, ajouter, session, apres, snack};
  }

  it('ouvre le casting vide, pour la table, sur le scénario et la scène en cours', () => {
    const {data} = monter(undefined);

    expect(data).toEqual(expect.objectContaining({cible: 'table', personnages: [], scenarioId: 'perle', sceneTitre: 'Le gué', sceneAmbiance: 'Gué du Tyr, de nuit, danger 2'}));
  });

  it('assied à la table ceux que le casting rend, et pose la session à jour', () => {
    const {ajouter, session, apres, snack} = monter([LOUPS]);

    expect(ajouter).toHaveBeenCalledWith('t1', [LOUPS]);
    expect(session()).toBe(apres);
    expect(snack.mock.calls[0][0]).toBe('3 personnages rejoignent la table.');
  });

  it('« Annuler » n’ajoute rien', () => {
    const {ajouter} = monter(undefined);

    expect(ajouter).not.toHaveBeenCalled();
  });
});
