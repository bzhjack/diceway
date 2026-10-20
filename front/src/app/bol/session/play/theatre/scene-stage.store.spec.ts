import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {firstValueFrom, of, throwError} from 'rxjs';
import {BolSceneLoadResult, BolSceneModel} from '../../../models/bol-scene.model';
import {BolCatalogService} from '../../../services/bol-catalog.service';
import {BolScenarioService} from '../../../services/bol-scenario.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {SceneActionsService} from '../../scene-actions.service';
import {SceneStageStore} from './scene-stage.store';

function scene(id: string, scenarioId: string | null, ordre: number): BolSceneModel {
  return {
    id,
    scenario_id: scenarioId,
    titre: `Scène ${id}`,
    ordre,
    notes: null,
    distribution: [],
    region_id: null,
    lieu: null,
    moment: null,
    meteo: null,
    danger: null,
    lecture: null,
    jeu: null,
    pistes: null,
    image: null,
  };
}

const SCENES = [scene('s1', 'sc1', 0), scene('s2', 'sc1', 1), scene('s3', 'sc1', 2), scene('libre', null, 0)];
const S2 = SCENES[1];
const RESULT = {session: {id: 'sess', titre: null, statut: 'libre'}, ignored: 0} as BolSceneLoadResult;

describe('SceneStageStore', () => {
  let store: SceneStageStore;
  const loadAs = vi.fn();
  const announceLoad = vi.fn();
  const open = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    loadAs.mockReset();
    announceLoad.mockReset();
    TestBed.configureTestingModule({
      providers: [
        SceneStageStore,
        {provide: BolSceneService, useValue: {scenes: () => of(SCENES)}},
        {provide: BolScenarioService, useValue: {scenarios: () => of([{id: 'sc1', titre: 'Le Sceau d’Ambre'}])}},
        {provide: BolCatalogService, useValue: {regions: () => of([{id: 5, region: 'Jungle de Qo et jungle de Qush'}])}},
        {provide: SceneActionsService, useValue: {loadAs, announceLoad}},
        {provide: MatDialog, useValue: {open}},
      ],
    });
    store = TestBed.inject(SceneStageStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('suit le scénario de la scène courante au premier sync', () => {
    store.sync('sess', 's2', ['s1']);
    expect(store.scenarioId()).toBe('sc1');
    expect(store.acts().map((a) => a.statut)).toEqual(['jouee', 'en-cours', 'a-venir']);
    expect(store.currentScene()?.id).toBe('s2');
    expect(store.regionNoms().get(5)).toBe('Jungle de Qo et jungle de Qush');
  });

  it('sans scène courante, montre les scènes sans scénario', () => {
    store.sync('sess', null, []);
    expect(store.scenarioId()).toBeNull();
    expect(store.acts().map((a) => a.scene.id)).toEqual(['libre']);
    expect(store.currentScene()).toBeNull();
  });

  it('ne charge qu’une fois sur un double clic', async () => {
    loadAs.mockReturnValue(of(RESULT));
    store.sync('sess', 's1', []);
    store.load(S2, 'replace').subscribe();
    const second = await firstValueFrom(store.load(S2, 'replace'));
    expect(second).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(loadAs).toHaveBeenCalledTimes(1);
  });

  it('ferme le rideau pendant le chargement et le rouvre à la fin du carton', () => {
    loadAs.mockReturnValue(of(RESULT));
    store.sync('sess', 's1', []);
    const values: unknown[] = [];
    store.load(S2, 'replace').subscribe((v) => values.push(v));
    expect(store.rideau()).toBe('ferme');
    expect(store.carton()).toEqual({titre: S2.titre, narration: null, lieu: null});
    vi.advanceTimersByTime(900);
    expect(values).toEqual([RESULT]);
    store.sync('sess', 's2', ['s1', 's2']);
    // Sans phrase, le carton ne montre que le titre : 1,6 s après le fondu.
    vi.advanceTimersByTime(1599);
    expect(store.rideau()).toBe('ferme');
    expect(announceLoad).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(store.rideau()).toBe('ouvert');
    expect(store.busy()).toBe(false);
    // Le chargement est annoncé à la réouverture, pas par-dessus le carton.
    expect(loadAs).toHaveBeenCalledWith('sess', S2, 'replace', false);
    expect(announceLoad).toHaveBeenCalledWith(S2.titre, RESULT);
  });

  it('écrit le carton d’après le moment, la météo et le lieu de la scène, et le tient le temps de l’écrire', () => {
    loadAs.mockReturnValue(of(RESULT));
    store.sync('sess', 's1', []);
    const preparee = {...S2, moment: 'crepuscule' as const, meteo: 'pluie' as const, lieu: 'Gué du Tyr', region_id: 5};
    store.load(preparee, 'replace').subscribe();
    expect(store.carton()).toEqual({titre: S2.titre, narration: 'Au crépuscule, sous la pluie…', lieu: 'Gué du Tyr, Jungle de Qo et jungle de Qush'});
    vi.advanceTimersByTime(900);
    store.sync('sess', 's2', ['s1', 's2']);
    vi.advanceTimersByTime(2500);
    expect(store.rideau()).toBe('ferme');
    vi.advanceTimersByTime(1500);
    expect(store.rideau()).toBe('ouvert');
  });

  it('garde le rideau fermé jusqu’à ce que la page montre la session chargée', () => {
    loadAs.mockReturnValue(of(RESULT));
    store.sync('sess', 's1', []);
    store.load(S2, 'replace').subscribe();
    vi.advanceTimersByTime(3000);
    expect(store.rideau()).toBe('ferme');
    store.sync('sess', 's2', ['s1', 's2']);
    vi.advanceTimersByTime(250);
    expect(store.rideau()).toBe('ouvert');
  });

  it('rouvre le rideau au bout de 3 s si la page ne montre pas la session', () => {
    loadAs.mockReturnValue(of(RESULT));
    store.sync('sess', 's1', []);
    store.load(S2, 'replace').subscribe();
    vi.advanceTimersByTime(900 + 2900);
    expect(store.rideau()).toBe('ferme');
    vi.advanceTimersByTime(100 + 250);
    expect(store.rideau()).toBe('ouvert');
  });

  it('laisse le plateau vierge quand la frise montre un autre scénario que celui de la scène courante', () => {
    store.sync('sess', 's2', []);
    expect(store.displayedScene()?.id).toBe('s2');
    store.selectScenario(null);
    expect(store.displayedScene()).toBeNull();
    expect(store.currentActe()).toBeNull();
    store.selectScenario('sc1');
    expect(store.displayedScene()?.id).toBe('s2');
  });

  it('montre une scène sans scénario dans la frise « Sans scénario »', () => {
    store.sync('sess', 'libre', []);
    expect(store.scenarioId()).toBeNull();
    expect(store.displayedScene()?.id).toBe('libre');
  });

  it('donne les scènes sœurs du scénario de la scène, même si la frise en montre un autre', () => {
    store.sync('sess', 's2', []);
    store.selectScenario(null);
    expect(store.siblingsOf(S2).map((s) => s.id)).toEqual(['s1', 's3']);
    expect(store.siblingsOf(SCENES[3]).map((s) => s.id)).toEqual([]);
  });

  it('donne le nom de la région d’une scène', () => {
    store.sync('sess', 's1', []);
    expect(store.regionNom({...S2, region_id: 5})).toBe('Jungle de Qo et jungle de Qush');
    expect(store.regionNom(S2)).toBeNull();
    expect(store.regionNom(null)).toBeNull();
  });

  it('prépare une scène avec les scènes sœurs de son scénario, puis garde la scène enregistrée', () => {
    const preparee = {...S2, lieu: 'Gué du Tyr'};
    open.mockReturnValue({afterClosed: () => of(preparee)});
    store.sync('sess', 's2', []);
    store.prepare(S2);
    expect(open.mock.calls[0][1].data.siblings.map((s: BolSceneModel) => s.id)).toEqual(['s1', 's3']);
    expect(store.currentScene()?.lieu).toBe('Gué du Tyr');
  });

    it('rouvre le rideau après une erreur', () => {
    loadAs.mockReturnValue(throwError(() => new Error('409')));
    store.sync('sess', 's1', []);
    store.load(S2, 'replace').subscribe({error: () => undefined});
    vi.advanceTimersByTime(1000);
    expect(store.rideau()).toBe('ouvert');
    expect(announceLoad).not.toHaveBeenCalled();
    expect(store.busy()).toBe(false);
  });
});
