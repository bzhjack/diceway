import {HttpErrorResponse} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, convertToParamMap, provideRouter, Router} from '@angular/router';
import {of, throwError} from 'rxjs';
import {BolScenarioModel} from '../../models/bol-scenario.model';
import {BolSceneModel} from '../../models/bol-scene.model';
import {BolScenarioService} from '../../services/bol-scenario.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {ScenarioLibraryPageComponent} from './scenario-library-page';

const DIEU_VOILE = {id: 'dv', titre: 'Le Dieu voilé'};
/** Un scénario créé par son seul nom, encore sans chapitre. */
const VIDE = {id: 'zv', titre: 'Zalut oubliée'};
const CHAPITRES: BolScenarioModel[] = [
  {id: 'dv1', titre: 'L’oracle de Nemmereth', numero: 1, pitch: 'Cap au sud.', saga: DIEU_VOILE},
  {id: 'dvi', titre: 'La colère de Nemmereth', numero: 0, pitch: null, saga: DIEU_VOILE},
];

function scene(id: string, scenarioId: string, ordre: number, qtys: number[] = []): BolSceneModel {
  return {
    id,
    scenario_id: scenarioId,
    titre: `Scène ${id}`,
    ordre,
    notes: null,
    distribution: qtys.map((qty) => ({kind: 'pnj', source_id: 'x', qty, positions: []})),
    region_id: null,
    lieu: id === 's0' ? 'Halakh' : null,
    moment: id === 's0' ? 'jour' : null,
    meteo: id === 's0' ? 'clair' : null,
    danger: id === 's0' ? 1 : null,
    lecture: null,
    jeu: null,
    pistes: null,
    image: null,
  } as BolSceneModel;
}

const SCENES = [scene('s1', 'dv1', 1), scene('s0', 'dv1', 0, [2, 1]), scene('si', 'dvi', 0)];

describe('ScenarioLibraryPageComponent', () => {
  async function rendre(retour: Record<string, string> = {}) {
    const reponses: unknown[] = [];
    const open = vi.fn(() => ({afterClosed: () => of(reponses.shift())}));
    const scenarioService = {
      sagas: vi.fn(() => of([DIEU_VOILE, VIDE])),
      creerScenario: vi.fn(() => of({id: 'nouvelle', titre: 'Perle'})),
      scenarios: vi.fn(() => of(CHAPITRES)),
      create: vi.fn(() => of({id: 'n1', titre: 'x', saga: DIEU_VOILE})),
      update: vi.fn(() => of({})),
      delete: vi.fn(() => of(true)),
      renommerScenario: vi.fn(() => of({})),
      supprimerScenario: vi.fn(() => of(true)),
    };
    const sceneService = {scenes: vi.fn(() => of(SCENES)), create: vi.fn(() => of({})), reorder: vi.fn(() => of(true)), delete: vi.fn(() => of(true))};
    const snack = vi.fn();
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: ActivatedRoute, useValue: {snapshot: {queryParamMap: convertToParamMap(retour)}}},
        {provide: BolScenarioService, useValue: scenarioService},
        {provide: BolSceneService, useValue: sceneService},
        {provide: MatDialog, useValue: {open}},
        {provide: MatSnackBar, useValue: {open: snack}},
      ],
    });
    const fixture = TestBed.createComponent(ScenarioLibraryPageComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    /** Un bouton par son libellé (après l'éventuelle ligature de son icône), son `aria-label`, ou le nom d'une option de la colonne. */
    const bouton = (libelle: string, dans: ParentNode = page) =>
      [...dans.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) =>
          texte(b) === libelle ||
          texte(b)?.endsWith(` ${libelle}`) ||
          b.getAttribute('aria-label') === libelle ||
          texte(b.querySelector('.dw-lr-option-label')) === libelle,
      )!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    /** Le prochain dialogue ouvert renverra cette valeur. */
    const repondre = (valeur: unknown) => reponses.push(valeur);
    return {page, open, scenarioService, sceneService, snack, texte, bouton, cliquer, repondre};
  }

  it('range les scénarios par nom, ceux sans chapitre compris, et montre le premier : ses chapitres dans l’ordre, repliés', async () => {
    const {page, texte} = await rendre();

    expect([...page.querySelectorAll('nav .dw-lr-option-label')].map((e) => texte(e))).toEqual(['Le Dieu voilé', 'Zalut oubliée']);
    expect(texte(page.querySelector('.sl-titre'))).toBe('Le Dieu voilé');
    expect([...page.querySelectorAll('.sl-chapitre-nom')].map((e) => texte(e))).toEqual([
      'Introduction : La colère de Nemmereth',
      '1. L’oracle de Nemmereth',
    ]);
    expect([...page.querySelectorAll('.sl-chapitre-compte')].map((e) => texte(e))).toEqual(['1 scène', '2 scènes']);
    expect([...page.querySelectorAll('.sl-chapitre-bascule')].map((b) => b.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    expect(page.querySelector('.sl-chapitre table')).toBeNull();
    expect(page.textContent).not.toContain('one shot');
  });

  it('déplie un chapitre pour montrer son pitch et ses scènes par rang, le replie', async () => {
    const {page, texte, cliquer} = await rendre();
    const bascule = page.querySelectorAll<HTMLButtonElement>('.sl-chapitre-bascule')[1];

    await cliquer(bascule);

    expect(bascule.getAttribute('aria-expanded')).toBe('true');
    expect(page.querySelector(`#${bascule.getAttribute('aria-controls')}`)).not.toBeNull();
    expect(texte(page.querySelectorAll('.sl-chapitre')[1].querySelector('.sl-pitch'))).toBe('Cap au sud.');
    const lignes = [...page.querySelectorAll('.sl-chapitre')[1].querySelectorAll('tbody tr')];
    expect(lignes.map((tr) => texte(tr.querySelector('.sl-scene-titre')))).toEqual(['Scène s0', 'Scène s1']);
    expect([...lignes[0].querySelectorAll('td')].slice(2, 6).map((td) => texte(td))).toEqual(['Halakh', 'Jour · Ciel clair', '1', '3']);

    await cliquer(bascule);

    expect(bascule.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('.sl-chapitre table')).toBeNull();
  });

  it('un scénario sans chapitre le dit, et se supprime sans parler de chapitres', async () => {
    const {page, texte, bouton, cliquer, repondre, open, scenarioService} = await rendre();
    await cliquer(bouton('Zalut oubliée'));

    expect(texte(page.querySelector('.sl-vide--scenario'))).toBe('Aucun chapitre : ajoutes-en un avec « Chapitre ».');

    repondre(true);
    await cliquer(bouton('Supprimer'));
    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({data: expect.objectContaining({message: 'Supprimer « Zalut oubliée » ? Cette action est irréversible.'})});
    expect(scenarioService.supprimerScenario).toHaveBeenCalledWith('zv');
  });

  it('un nouveau scénario naît de son seul nom, puis la bibliothèque se relit et le montre', async () => {
    const {bouton, cliquer, repondre, scenarioService, open} = await rendre();
    repondre('Perle du Beshaar');
    const lectures = scenarioService.sagas.mock.calls.length;

    await cliquer(bouton('Nouveau scénario'));

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({data: expect.objectContaining({title: 'Nouveau scénario', label: 'Nom du scénario'})});
    expect(scenarioService.creerScenario).toHaveBeenCalledWith('Perle du Beshaar');
    expect(scenarioService.sagas).toHaveBeenCalledTimes(lectures + 1);
  });

  it('un nouveau chapitre prend le numéro qui suit le dernier', async () => {
    const {bouton, cliquer, repondre, scenarioService, open} = await rendre();
    repondre({numero: 2, titre: 'Envolé le Corbeau !', pitch: ''});

    await cliquer(bouton('Chapitre'));

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({data: expect.objectContaining({scenario: 'Le Dieu voilé', numero: 2})});
    expect(scenarioService.create).toHaveBeenCalledWith({titre: 'Le Dieu voilé — 2. Envolé le Corbeau !', pitch: null});
  });

  it('le premier chapitre d’un scénario vide porte le numéro 1', async () => {
    const {bouton, cliquer, repondre, scenarioService, open} = await rendre();
    await cliquer(bouton('Zalut oubliée'));
    repondre({numero: 1, titre: 'Le réveil', pitch: ''});

    await cliquer(bouton('Chapitre'));

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({data: expect.objectContaining({scenario: 'Zalut oubliée', numero: 1})});
    expect(scenarioService.create).toHaveBeenCalledWith({titre: 'Zalut oubliée — 1. Le réveil', pitch: null});
  });

  it('renomme le scénario', async () => {
    const {bouton, cliquer, repondre, scenarioService} = await rendre();
    repondre('Le Dieu dévoilé');

    await cliquer(bouton('Renommer'));

    expect(scenarioService.renommerScenario).toHaveBeenCalledWith('dv', 'Le Dieu dévoilé');
  });

  it('supprime un scénario d’un bloc, ses chapitres et leurs scènes', async () => {
    const {bouton, cliquer, repondre, scenarioService, open} = await rendre();
    repondre(true);

    await cliquer(bouton('Supprimer'));

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({
      data: expect.objectContaining({message: 'Supprimer « Le Dieu voilé », ses 2 chapitres et leurs 3 scènes ? Cette action est irréversible.'}),
    });
    expect(scenarioService.supprimerScenario).toHaveBeenCalledWith('dv');
  });

  it('dit pourquoi le serveur refuse (une partie joue ce scénario)', async () => {
    const {bouton, cliquer, repondre, scenarioService, snack} = await rendre();
    scenarioService.supprimerScenario.mockReturnValue(
      throwError(() => new HttpErrorResponse({status: 409, error: {message: 'Une partie joue un chapitre de ce scénario.'}})),
    );
    repondre(true);

    await cliquer(bouton('Supprimer'));

    expect(snack.mock.calls[0][0]).toContain('Une partie joue un chapitre de ce scénario.');
  });

  it('« Scène » mène à « Préparer la scène » dans son chapitre, qui reviendra sur ce scénario, ce chapitre déplié', async () => {
    const {page, bouton, cliquer, open} = await rendre();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await cliquer(bouton('Scène', page.querySelectorAll('.sl-chapitre')[1]));

    expect(navigate).toHaveBeenCalledWith(['/create/scene'], {queryParams: {chapitre: 'dv1'}, state: {returnUrl: '/library/scenarios?scenario=dv&chapitre=dv1'}});
    expect(open).not.toHaveBeenCalled();
  });

  it('une scène se prépare sur sa page, qui reviendra ici', async () => {
    const {page, cliquer} = await rendre();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await cliquer(page.querySelectorAll<HTMLButtonElement>('.sl-chapitre-bascule')[1]);

    await cliquer(page.querySelector<HTMLButtonElement>('[aria-label="Préparer Scène s0"]')!);

    expect(navigate).toHaveBeenCalledWith(['/create/scene', 's0'], {state: {returnUrl: '/library/scenarios?scenario=dv&chapitre=dv1'}});
  });

  it('au retour, montre le scénario qu’on regardait', async () => {
    const {page, texte} = await rendre({scenario: 'zv', chapitre: 'dv1'});

    expect(texte(page.querySelector('.sl-titre'))).toBe('Zalut oubliée');
  });

  it('au retour, déplie le chapitre de la scène préparée', async () => {
    const {page} = await rendre({scenario: 'dv', chapitre: 'dv1'});

    expect([...page.querySelectorAll('.sl-chapitre-bascule')].map((b) => b.getAttribute('aria-expanded'))).toEqual(['false', 'true']);
  });

  it('range une scène plus bas dans son chapitre', async () => {
    const {page, bouton, cliquer, sceneService} = await rendre();
    await cliquer(page.querySelectorAll<HTMLButtonElement>('.sl-chapitre-bascule')[1]);

    await cliquer(bouton('Descendre Scène s0'));

    expect(sceneService.reorder).toHaveBeenCalledWith('dv1', ['s1', 's0']);
  });
});
