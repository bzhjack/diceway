import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {EMPTY, of} from 'rxjs';
import {BolFightSessionModel, BolSessionSceneRef} from '../../../models/bol-fight-session.model';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {PaletteCommand} from '../../models/command-palette.model';
import {SceneStageStore} from '../theatre/scene-stage.store';
import {CombatEndService} from './combat-end.service';
import {ExpandedCardStore} from './expanded-card.store';
import {TableCommandsService} from './table-commands.service';
import {TableStore} from './table.store';

function scene(over: Partial<BolSceneModel> = {}): BolSceneModel {
  return {id: 'sc-1', scenario_id: null, titre: 'Ma scène', ordre: 0, distribution: [], ...over} as BolSceneModel;
}

const ailleurs: BolSessionSceneRef = {id: 'sc-9', titre: 'Ailleurs', scenario: {id: 'Y', titre: 'Autre scénario'}};

function table(over: Partial<BolFightSessionModel> = {}): BolFightSessionModel {
  return {id: 's1', titre: 'Table', statut: 'libre', heros: [], pnjs: [], creatures: [], demons: [], ...over} as unknown as BolFightSessionModel;
}

describe('TableCommandsService : « Enregistrer la table comme scène »', () => {
  const create = vi.fn();
  const dialogOpen = vi.fn();
  let commands: TableCommandsService;
  let store: TableStore;

  /** La palette renvoie « Enregistrer la table comme scène », puis le dialogue de titre renvoie « Ma scène ». */
  function setup(session: BolFightSessionModel): void {
    create.mockReset();
    create.mockImplementation((titre: string, scenarioId: string | null) => of(scene({titre, scenario_id: scenarioId})));
    dialogOpen.mockReset();
    const palette: PaletteCommand = {type: 'action', id: 'saveScene'};
    dialogOpen.mockReturnValueOnce({afterClosed: () => of(palette)}).mockReturnValueOnce({afterClosed: () => of('Ma scène')});
    TestBed.configureTestingModule({
      providers: [
        TableStore,
        TableCommandsService,
        {provide: MatDialog, useValue: {open: dialogOpen, openDialogs: []}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: Router, useValue: {navigate: vi.fn(), navigateByUrl: vi.fn()}},
        {provide: BolFightSessionService, useValue: {fightSession: vi.fn(() => EMPTY)}},
        {provide: BolSceneService, useValue: {scenes: () => of([]), create}},
        {provide: CombatSelectionService, useValue: {catalog: signal([]), loadCatalog: vi.fn()}},
        {provide: SceneStageStore, useValue: {sync: vi.fn(), reload: vi.fn()}},
        {provide: CombatEndService, useValue: {}},
        {provide: ExpandedCardStore, useValue: {foldCard: vi.fn()}},
      ],
    });
    store = TestBed.inject(TableStore);
    store.session.set(session);
    commands = TestBed.inject(TableCommandsService);
  }

  it('range la scène dans le scénario de la table, même sans scène courante', () => {
    setup(table({scenario_id: 'X', scene_id: null, scene: null}));

    commands.openPalette();

    expect(create).toHaveBeenCalledWith('Ma scène', 'X', 's1');
  });

  it('range la scène dans le scénario de la table, pas dans celui de la scène courante', () => {
    setup(
      table({
        scenario_id: 'X',
        scene_id: 'sc-9',
        scene: ailleurs,
      }),
    );

    commands.openPalette();

    expect(create).toHaveBeenCalledWith('Ma scène', 'X', 's1');
  });

  it('sur une table qui improvise, la scène va dans « On improvise » même si la scène courante a un scénario', () => {
    setup(
      table({
        scenario_id: null,
        scene_id: 'sc-9',
        scene: ailleurs,
      }),
    );

    commands.openPalette();

    expect(create).toHaveBeenCalledWith('Ma scène', null, 's1');
  });
});
