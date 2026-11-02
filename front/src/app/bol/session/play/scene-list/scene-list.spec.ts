import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of, Subject} from 'rxjs';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {BolScenarioModel} from '../../../models/bol-scenario.model';
import {BolScenarioService} from '../../../services/bol-scenario.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {SceneActionsService} from '../../scene-actions.service';
import {SceneListComponent} from './scene-list';

function scene(id: string, scenarioId: string | null): BolSceneModel {
  return {id, scenario_id: scenarioId, titre: `Scène ${id}`, ordre: 0, distribution: []} as unknown as BolSceneModel;
}

describe('SceneListComponent : scénario affiché', () => {
  const saveTable = vi.fn();
  let fixture: ComponentFixture<SceneListComponent>;

  /** La table est sur le scénario X (ou aucun) ; sa scène courante, elle, est rangée dans le scénario Y. Les
   * réponses n'arrivent qu'une fois les entrées posées, comme avec le réseau. */
  async function rendre(tableScenario: string | null): Promise<void> {
    saveTable.mockReset();
    saveTable.mockReturnValue(of(null));
    const scenes$ = new Subject<BolSceneModel[]>();
    const scenarios$ = new Subject<BolScenarioModel[]>();
    TestBed.configureTestingModule({
      providers: [
        {provide: BolSceneService, useValue: {scenes: () => scenes$}},
        {provide: BolScenarioService, useValue: {scenarios: () => scenarios$}},
        {provide: SceneActionsService, useValue: {saveTable, load: vi.fn()}},
        {provide: MatDialog, useValue: {open: vi.fn()}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    fixture = TestBed.createComponent(SceneListComponent);
    fixture.componentRef.setInput('sessionId', 's1');
    fixture.componentRef.setInput('currentSceneId', 'sc-y');
    fixture.componentRef.setInput('scenarioId', tableScenario);
    scenes$.next([scene('sc-y', 'Y'), scene('sc-x', 'X')]);
    scenes$.complete();
    scenarios$.next([{id: 'X', titre: 'Scénario X'}, {id: 'Y', titre: 'Scénario Y'}] as BolScenarioModel[]);
    scenarios$.complete();
    await fixture.whenStable();
  }

  function saveButton(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.scl-save')!;
  }

  it('s’ouvre sur le scénario de la table : « Enregistrer la table comme scène » y range la scène', async () => {
    await rendre('X');

    saveButton().click();

    expect(saveTable).toHaveBeenCalledWith('s1', 'X');
  });

  it('sur une table qui improvise, la scène va dans « On improvise » même si la scène courante a un scénario', async () => {
    await rendre(null);

    saveButton().click();

    expect(saveTable).toHaveBeenCalledWith('s1', null);
  });
});
