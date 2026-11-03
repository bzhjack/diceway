import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of, Subject} from 'rxjs';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {BolScenarioModel} from '../../../models/bol-scenario.model';
import {BolScenarioService} from '../../../services/bol-scenario.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {SceneActionsService} from './scene-actions.service';
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

  /** Ouvre le sélecteur « Scénario » et clique l'option de ce titre, comme le MJ. */
  async function choisirScenario(titre: string): Promise<void> {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.mat-mdc-select-trigger')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const option = Array.from(document.querySelectorAll<HTMLElement>('mat-option')).find((el) => el.textContent?.trim() === titre)!;
    option.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('le filtre suit le scénario de la table quand il change (scène d’un autre scénario chargée) : l’enregistrement n’y ramène pas l’ancien', async () => {
    await rendre('X');

    fixture.componentRef.setInput('scenarioId', 'Y');
    await fixture.whenStable();
    saveButton().click();

    expect(saveTable).toHaveBeenCalledWith('s1', 'Y');
  });

  it('le filtre suit aussi une table qui passe à « On improvise »', async () => {
    await rendre('X');

    fixture.componentRef.setInput('scenarioId', null);
    await fixture.whenStable();
    saveButton().click();

    expect(saveTable).toHaveBeenCalledWith('s1', null);
  });

  it('le MJ peut choisir un autre scénario dans le filtre avant d’enregistrer', async () => {
    await rendre('X');

    await choisirScenario('Scénario Y');
    saveButton().click();

    expect(saveTable).toHaveBeenCalledWith('s1', 'Y');
  });

  it('un scénario de la table inconnu du compte ramène le filtre sur « On improvise »', async () => {
    await rendre('X');

    fixture.componentRef.setInput('scenarioId', 'Z');
    await fixture.whenStable();
    saveButton().click();

    expect(saveTable).toHaveBeenCalledWith('s1', null);
  });
});
