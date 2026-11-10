import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, convertToParamMap, provideRouter, Router} from '@angular/router';
import {of, throwError} from 'rxjs';
import {BolSceneModel} from '../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../models/combat-selection.model';
import {BolCatalogService} from '../../services/bol-catalog.service';
import {BolScenarioService} from '../../services/bol-scenario.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {SceneFormPageComponent} from './scene-form-page';

const SCENE: BolSceneModel = {
  id: 's1',
  scenario_id: 'dv1',
  titre: 'Cap au sud',
  ordre: 0,
  notes: null,
  distribution: [{kind: 'creature', source_id: 'c1', qty: 2, camp: 'adversaires', attitude: 'hostile', positions: [null, null]}],
  region_id: null,
  lieu: 'Halakh',
  moment: 'jour',
  meteo: null,
  danger: 2,
  lecture: 'Quinze jours de galère.',
  jeu: null,
  pistes: null,
  image: '/assets/bol/halakh.webp',
};

const CATALOGUE = [
  {catalogId: 'creature:c1', kind: 'creature', sourceId: 'c1', nom: 'Loup géant', vitalite: 6, avatar: '/loup.webp', raw: {}},
  {catalogId: 'pnj:p1', kind: 'pnj', sourceId: 'p1', nom: 'Drajit', vitalite: 10, avatar: '/drajit.webp', raw: {}},
  {catalogId: 'hero:h1', kind: 'hero', sourceId: 'h1', nom: 'Dogon', vitalite: 10, avatar: '/dogon.webp', raw: {}},
] as unknown as CombatCatalogEntry[];

describe('SceneFormPageComponent', () => {
  async function rendre(params: {id?: string; chapitre?: string} = {id: 's1'}) {
    const sceneService = {
      scenes: vi.fn(() => of([SCENE, {...SCENE, id: 's2', titre: 'La citadelle', ordre: 1}])),
      update: vi.fn((id: string) => of({...SCENE, id})),
      create: vi.fn(() => of({...SCENE, id: 'nouvelle', distribution: []})),
    };
    const open = vi.fn((): {afterClosed: () => unknown} => ({afterClosed: () => of(true)}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(params.id ? {id: params.id} : {}),
              queryParamMap: convertToParamMap(params.chapitre ? {chapitre: params.chapitre} : {}),
            },
          },
        },
        {provide: BolSceneService, useValue: sceneService},
        {provide: BolScenarioService, useValue: {scenarios: () => of([{id: 'dv1', titre: 'L’oracle de Nemmereth', numero: 1, saga: {id: 'dv', titre: 'Le Dieu voilé'}}])}},
        {provide: BolCatalogService, useValue: {regions: () => of([])}},
        {provide: CombatSelectionService, useValue: {catalog: signal(CATALOGUE), loadCatalog: vi.fn(), loading: signal(false), loadFailed: signal(false)}},
        {provide: MatDialog, useValue: {open}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    const fixture = TestBed.createComponent(SceneFormPageComponent);
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const enregistrer = async () => {
      page.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return {fixture, page, texte, sceneService, navigate, open, enregistrer, composant: fixture.componentInstance};
  }

  it('reprend la scène : son chapitre en surtitre, son texte, ses personnages avec leur nom, leur nombre et leur attitude', async () => {
    const {page, texte} = await rendre();

    expect(texte(page.querySelector('.dw-fh-eyebrow'))).toBe('Le Dieu voilé — 1. L’oracle de Nemmereth');
    expect(page.querySelector<HTMLTextAreaElement>('#sfp-lecture')!.value).toBe('Quinze jours de galère.');
    expect([...page.querySelectorAll('.sfp-perso-texte')].map((e) => texte(e))).toEqual(['Loup géant']);
    expect(page.querySelector<HTMLInputElement>('.sfp-perso input')!.value).toBe('2');
    expect([...page.querySelectorAll('.sfp-perso .mat-button-toggle-checked')].map((t) => texte(t))).toEqual(['Adversaire']);
    expect([...page.querySelectorAll('.sfp-perso .atp-option[aria-pressed="true"]')].map((b) => texte(b))).toEqual(['Hostile']);
  });

  it('enregistre le texte et les personnages, sans toucher à l’illustration, puis revient', async () => {
    const {sceneService, navigate, enregistrer} = await rendre();

    await enregistrer();

    const changes = (sceneService.update.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(changes['lecture']).toBe('Quinze jours de galère.');
    expect('image' in changes).toBe(false);
    expect(changes['distribution']).toEqual([{kind: 'creature', source_id: 'c1', qty: 2, camp: 'adversaires', attitude: 'hostile'}]);
    expect(navigate).toHaveBeenCalledWith('/library/scenarios');
  });

  it('« Ajouter des personnages » ouvre le dialogue sur le scénario de la scène ; un PNJ choisi entre en adversaire, une créature déjà là gagne un exemplaire', async () => {
    const {page, texte, fixture, open} = await rendre();
    open.mockReturnValueOnce({afterClosed: () => of([CATALOGUE[1], CATALOGUE[0]])});

    [...page.querySelectorAll<HTMLButtonElement>('button')].find((b) => texte(b)?.includes('Ajouter des personnages'))!.click();
    await fixture.whenStable();

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({data: {scenarioId: 'dv', pnjsEnScene: new Set(), placesLibres: 59}});
    expect([...page.querySelectorAll('.sfp-perso-texte')].map((e) => texte(e))).toEqual(['Loup géant', 'Drajit']);
    expect(page.querySelector<HTMLInputElement>('.sfp-perso input')!.value).toBe('3');
  });

  it('un clic sur l’attitude choisie l’efface', async () => {
    const {page, fixture, sceneService, enregistrer} = await rendre();

    page.querySelector<HTMLButtonElement>('.sfp-perso .atp-option[aria-pressed="true"]')!.click();
    await fixture.whenStable();
    await enregistrer();

    expect(((sceneService.update.mock.calls[0] as unknown[])[1] as {distribution: {attitude: unknown}[]}).distribution[0].attitude).toBeNull();
  });

  it('une nouvelle scène dont l’enregistrement échoue après sa création n’est pas créée une seconde fois', async () => {
    const {page, sceneService, enregistrer, fixture} = await rendre({chapitre: 'dv1'});
    sceneService.update.mockReturnValueOnce(throwError(() => new Error('réseau')));
    const titre = page.querySelector<HTMLInputElement>('#sfp-titre')!;
    titre.value = 'La citadelle';
    titre.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    await enregistrer();
    await enregistrer();

    expect(sceneService.create).toHaveBeenCalledTimes(1);
    expect(sceneService.update).toHaveBeenLastCalledWith('nouvelle', expect.objectContaining({titre: 'La citadelle'}));
  });

  it('retire un personnage ; quitter sans enregistrer demande confirmation', async () => {
    const {page, fixture, composant, open} = await rendre();

    page.querySelector<HTMLButtonElement>('[aria-label="Retirer Loup géant"]')!.click();
    await fixture.whenStable();

    expect(page.querySelectorAll('.sfp-perso').length).toBe(0);
    expect(composant.canLeave()).not.toBe(true);
    expect(open).toHaveBeenCalled();
  });

  it('une nouvelle scène naît dans son chapitre, puis s’enregistre avec ses personnages', async () => {
    const {page, sceneService, enregistrer, fixture, texte} = await rendre({chapitre: 'dv1'});

    expect(texte(page.querySelector('.dw-fh-title'))).toBe('Nouvelle scène');
    const titre = page.querySelector<HTMLInputElement>('#sfp-titre')!;
    titre.value = 'La citadelle';
    titre.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    await enregistrer();

    expect(sceneService.create).toHaveBeenCalledWith('La citadelle', 'dv1', null);
    expect(sceneService.update).toHaveBeenCalledWith('nouvelle', expect.objectContaining({titre: 'La citadelle', distribution: []}));
  });
});
