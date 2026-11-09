import {HttpErrorResponse} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter} from '@angular/router';
import {of, throwError} from 'rxjs';
import {BolScenarioModel} from '../../models/bol-scenario.model';
import {BolSceneModel} from '../../models/bol-scene.model';
import {BolScenarioService} from '../../services/bol-scenario.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {ScenarioLibraryPageComponent} from './scenario-library-page';

const DIEU_VOILE = {id: 'dv', titre: 'Le Dieu voilé'};
const CHAPITRES: BolScenarioModel[] = [
  {id: 'dv1', titre: 'L’oracle de Nemmereth', numero: 1, pitch: 'Cap au sud.', saga: DIEU_VOILE},
  {id: 'ps', titre: 'premier scénario', numero: null, pitch: null, saga: null},
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
  async function rendre() {
    const reponses: unknown[] = [];
    const open = vi.fn(() => ({afterClosed: () => of(reponses.shift())}));
    const scenarioService = {
      scenarios: vi.fn(() => of(CHAPITRES)),
      create: vi.fn(() => of({id: 'n1', titre: 'x', saga: {id: 'nouvelle', titre: 'Perle'}})),
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

  it('range les scénarios puis les one shots, et montre le premier : ses chapitres dans l’ordre, repliés, avec leur nombre de scènes', async () => {
    const {page, texte} = await rendre();

    expect([...page.querySelectorAll('nav .dw-lr-option-label')].map((e) => texte(e))).toEqual(['Le Dieu voilé', 'premier scénario']);
    expect(texte(page.querySelector('.sl-titre'))).toBe('Le Dieu voilé');
    expect([...page.querySelectorAll('.sl-chapitre-nom')].map((e) => texte(e))).toEqual([
      'Introduction : La colère de Nemmereth',
      '1. L’oracle de Nemmereth',
    ]);
    expect([...page.querySelectorAll('.sl-chapitre-compte')].map((e) => texte(e))).toEqual(['1 scène', '2 scènes']);
    expect([...page.querySelectorAll('.sl-chapitre-bascule')].map((b) => b.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    expect(page.querySelector('.sl-chapitre table')).toBeNull();
    expect(page.querySelector('.sl-pitch')).toBeNull();
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
    expect(page.querySelectorAll('.sl-chapitre')[0].querySelector('table')).toBeNull();

    await cliquer(bascule);

    expect(bascule.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('.sl-chapitre table')).toBeNull();
  });

  it('un one shot montre ses scènes sans rien à déplier', async () => {
    const {page, bouton, cliquer} = await rendre();

    await cliquer(bouton('premier scénario'));

    expect(page.querySelector('.sl-chapitre-bascule')).toBeNull();
    expect(page.querySelector('.sl-chapitre-corps')).not.toBeNull();
  });

  it('un nouveau scénario naît avec son premier chapitre, puis la bibliothèque se relit', async () => {
    const {bouton, cliquer, repondre, scenarioService, open} = await rendre();
    repondre({scenario: 'Perle du Beshaar', numero: 1, titre: 'Sacrilège à Satarla', pitch: 'Un vol.'});
    const lectures = scenarioService.scenarios.mock.calls.length;

    await cliquer(bouton('Nouveau scénario'));

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({data: expect.objectContaining({nommerLeScenario: true, numero: 1})});
    expect(scenarioService.create).toHaveBeenCalledWith({titre: 'Perle du Beshaar — 1. Sacrilège à Satarla', pitch: 'Un vol.'});
    expect(scenarioService.scenarios).toHaveBeenCalledTimes(lectures + 1);
  });

  it('un nouveau chapitre prend le numéro qui suit le dernier', async () => {
    const {bouton, cliquer, repondre, scenarioService, open} = await rendre();
    repondre({scenario: null, numero: 2, titre: 'Envolé le Corbeau !', pitch: ''});

    await cliquer(bouton('Chapitre'));

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({data: expect.objectContaining({scenario: 'Le Dieu voilé', numero: 2})});
    expect(scenarioService.create).toHaveBeenCalledWith({titre: 'Le Dieu voilé — 2. Envolé le Corbeau !', pitch: null});
  });

  it('renomme le scénario', async () => {
    const {bouton, cliquer, repondre, scenarioService} = await rendre();
    repondre('Le Dieu dévoilé');

    await cliquer(bouton('Renommer'));

    expect(scenarioService.renommerScenario).toHaveBeenCalledWith('dv', 'Le Dieu dévoilé');
  });

  it('supprime un scénario d’un bloc, un one shot par son chapitre', async () => {
    const {bouton, cliquer, repondre, scenarioService} = await rendre();
    repondre(true);
    await cliquer(bouton('Supprimer'));
    expect(scenarioService.supprimerScenario).toHaveBeenCalledWith('dv');

    await cliquer(bouton('premier scénario'));
    repondre(true);
    await cliquer(bouton('Supprimer'));
    expect(scenarioService.delete).toHaveBeenCalledWith('ps');
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

  it('une nouvelle scène naît vide dans son chapitre, sans table, et le déplie', async () => {
    const {page, bouton, cliquer, repondre, sceneService} = await rendre();
    repondre('Le texte de l’oracle');

    await cliquer(bouton('Scène', page.querySelectorAll('.sl-chapitre')[1]));

    expect(sceneService.create).toHaveBeenCalledWith('Le texte de l’oracle', 'dv1', null);
    expect(page.querySelectorAll('.sl-chapitre-bascule')[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('range une scène plus bas dans son chapitre', async () => {
    const {page, bouton, cliquer, sceneService} = await rendre();
    await cliquer(page.querySelectorAll<HTMLButtonElement>('.sl-chapitre-bascule')[1]);

    await cliquer(bouton('Descendre Scène s0'));

    expect(sceneService.reorder).toHaveBeenCalledWith('dv1', ['s1', 's0']);
  });
});
