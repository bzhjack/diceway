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
  distribution: [{kind: 'creature', source_id: 'c1', qty: 2, camp: 'adversaires', attitude: 'hostile'}],
  region_id: null,
  lieu: 'Halakh',
  moment: 'jour',
  meteo: null,
  danger: 2,
  lecture: 'Quinze jours de galère.',
  jeu: null,
  jets: null,
  pistes: null,
  image: '/assets/bol/halakh.webp',
};

const CATALOGUE = [
  {catalogId: 'creature:c1', kind: 'creature', sourceId: 'c1', nom: 'Loup géant', vitalite: 6, avatar: '/loup.webp', raw: {}},
  {catalogId: 'pnj:p1', kind: 'pnj', sourceId: 'p1', nom: 'Drajit', vitalite: 10, avatar: '/drajit.webp', raw: {}},
  {catalogId: 'hero:h1', kind: 'hero', sourceId: 'h1', nom: 'Dogon', vitalite: 10, avatar: '/dogon.webp', raw: {}},
] as unknown as CombatCatalogEntry[];

describe('SceneFormPageComponent', () => {
  async function rendre(params: {id?: string; chapitre?: string; jets?: BolSceneModel['jets']; regions?: {id: number; region: string}[]} = {id: 's1'}) {
    const sceneService = {
      scenes: vi.fn(() => of([{...SCENE, jets: params.jets ?? null}, {...SCENE, id: 's2', titre: 'La citadelle', ordre: 1}])),
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
        {provide: BolCatalogService, useValue: {regions: () => of(params.regions ?? [])}},
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

    expect(texte(page.querySelector('.sfp-fil'))).toBe('Le Dieu voilé — 1. L’oracle de Nemmereth · scène 1 sur 2');
    expect(page.querySelector<HTMLInputElement>('#sfp-titre')!.value).toBe('Cap au sud');
    expect(page.querySelector<HTMLImageElement>('.sfp-decor-image')!.getAttribute('src')).toBe('/assets/bol/halakh.webp');
    expect(texte(page.querySelector('.sfp-pastille--jour b'))).toBe('Jour');
    expect(page.querySelector<HTMLTextAreaElement>('#sfp-lecture')!.value).toBe('Quinze jours de galère.');
    expect([...page.querySelectorAll('.sca-nom')].map((e) => texte(e))).toEqual(['Loup géant']);
    expect(texte(page.querySelector('.sca-nombre'))).toBe('×2');
    expect(page.querySelector('.sca-bande .prg-camp-option--adversaires')?.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('.sca-nom bol-attitude-puce')?.classList).toContain('apu--hostile');
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

  it('« Ajouter des personnages » ouvre le dialogue sur le scénario de la scène, avec ses personnages ; ce qu’il valide les remplace', async () => {
    const {page, texte, fixture, open} = await rendre();
    const valides = [
      {kind: 'creature', source_id: 'c1', qty: 3, camp: 'adversaires', attitude: 'hostile'},
      {kind: 'pnj', source_id: 'p1', qty: 1, camp: 'heros', attitude: null},
    ];
    open.mockReturnValueOnce({afterClosed: () => of(valides)});

    [...page.querySelectorAll<HTMLButtonElement>('button')].find((b) => texte(b)?.includes('Ajouter des personnages'))!.click();
    await fixture.whenStable();

    expect((open.mock.calls[0] as unknown[])[1]).toMatchObject({
      data: {
        scenarioId: 'dv',
        sceneTitre: 'Cap au sud',
        sceneImage: '/assets/bol/halakh.webp',
        sceneAmbiance: 'Halakh, de jour, danger 2',
        personnages: [{kind: 'creature', source_id: 'c1', qty: 2, camp: 'adversaires', attitude: 'hostile'}],
      },
    });
    expect([...page.querySelectorAll('.sca-nom')].map((e) => texte(e))).toEqual(['Loup géant', 'Drajit']);
    expect(texte(page.querySelector('.sca-nombre'))).toBe('×3');
    expect(texte(page.querySelector('.sfp-camp--allies'))).toBe('1 allié');
  });

  it('l’ambiance se choisit dans les menus des pastilles, le texte par onglets ; tout s’enregistre', async () => {
    const {page, texte, fixture, sceneService, enregistrer} = await rendre();
    const choisir = async (pastille: string, option: string) => {
      page.querySelector<HTMLButtonElement>(pastille)!.click();
      await fixture.whenStable();
      [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')].find((b) => texte(b)?.endsWith(option))!.click();
      await fixture.whenStable();
    };

    await choisir('.sfp-pastille--jour', 'Nuit');
    await choisir('.sfp-pastille--danger-2', 'Danger 4 sur 4');
    expect(page.querySelector('.sfp-pastille--nuit')).not.toBeNull();
    [...page.querySelectorAll<HTMLButtonElement>('.sfp-onglet')].find((b) => texte(b)?.startsWith('Mise en scène'))!.click();
    await fixture.whenStable();
    const jeu = page.querySelector<HTMLTextAreaElement>('#sfp-jeu')!;
    jeu.value = 'Jet de Vigueur, difficulté -1.';
    jeu.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(page.querySelector('#sfp-lecture')).toBeNull();
    expect(texte(page.querySelector('.sfp-texte-compte'))).toBe('30 / 10000');
    await enregistrer();
    expect((sceneService.update.mock.calls[0] as unknown[])[1]).toMatchObject({moment: 'nuit', danger: 4, jeu: 'Jet de Vigueur, difficulté -1.'});
  });

  it('les onglets suivent le carnet de la table ; « En jeu » devient « Mise en scène »', async () => {
    const {page, texte} = await rendre();

    expect([...page.querySelectorAll('.sfp-onglet')].map((b) => texte(b))).toEqual(['À lire aux joueurs (écrit)', 'Jets', 'Mise en scène', 'lock Secret du MJ', 'Pistes']);
  });

  it('« Jet » ajoute une ligne : un titre, deux attributs au plus, une difficulté, l’enjeu et l’échec ; tout s’enregistre', async () => {
    const {page, texte, fixture, sceneService, enregistrer} = await rendre();
    const cliquer = async (el: HTMLElement) => {
      el.click();
      await fixture.whenStable();
    };
    const saisir = async (champ: HTMLInputElement, valeur: string) => {
      champ.value = valeur;
      champ.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const attribut = (label: string) => [...page.querySelectorAll<HTMLButtonElement>('.sfp-jet-attribut')].find((b) => texte(b) === label)!;
    const champ = (label: string) =>
      [...page.querySelectorAll<HTMLElement>('.sfp-jet mat-form-field')].find((f) => texte(f.querySelector('mat-label'))?.startsWith(label))!.querySelector<HTMLInputElement>('input')!;

    await cliquer([...page.querySelectorAll<HTMLButtonElement>('.sfp-onglet')].find((b) => texte(b) === 'Jets')!);
    expect(page.querySelector('.sfp-jet')).toBeNull();
    await cliquer([...page.querySelectorAll<HTMLButtonElement>('button')].find((b) => texte(b) === 'add Jet')!);

    expect(page.querySelectorAll('.sfp-jet')).toHaveLength(1);
    expect(texte(page.querySelector('.sfp-jet-sans'))).toBe('Sans jet : un effet automatique');
    expect(texte([...page.querySelectorAll('.sfp-onglet')].find((b) => texte(b)?.startsWith('Jets'))!)).toBe('Jets 1');
    await saisir(champ('Jet 1'), ' Coquillage ');
    await cliquer(attribut('Esprit'));
    await cliquer(attribut('Vigueur'));
    expect(attribut('Esprit').getAttribute('aria-pressed')).toBe('true');
    expect(attribut('Agilité').disabled).toBe(true);
    await cliquer(attribut('Esprit'));
    expect(attribut('Agilité').disabled).toBe(false);
    await saisir(champ('Enjeu'), 'dégager sa jambe');
    await saisir(champ('Échec'), 'le pied reste pris');
    await cliquer(page.querySelector<HTMLElement>('.sfp-jet mat-select')!);
    await cliquer([...document.querySelectorAll<HTMLElement>('mat-option')].find((o) => texte(o) === 'Ardue −1')!);
    await enregistrer();

    expect((sceneService.update.mock.calls[0] as unknown[])[1]).toMatchObject({
      jets: [{titre: 'Coquillage', attributs: ['vigueur'], difficulte: 'ardue', enjeu: 'dégager sa jambe', echec: 'le pied reste pris', reussite: null, carriere: null, quand: null}],
    });
  });

  it('le moment d’un jet se lit sous « Réussite, carrière, quand », déplié d’office quand l’un d’eux est écrit', async () => {
    const trou = {titre: 'Trou', attributs: ['esprit' as const], difficulte: 'moyenne' as const, enjeu: null, echec: null, reussite: null, carriere: null, quand: 'si le joueur regarde où il marche'};
    const coquillage = {...trou, titre: 'Coquillage', quand: null};
    const {page, texte, fixture} = await rendre({id: 's1', jets: [trou, coquillage]});
    [...page.querySelectorAll<HTMLButtonElement>('.sfp-onglet')].find((b) => texte(b)?.startsWith('Jets'))!.click();
    await fixture.whenStable();

    const plus = [...page.querySelectorAll<HTMLDetailsElement>('details.sfp-jet-plus')];
    expect(plus.map((d) => texte(d.querySelector('summary'))?.replace(' (écrit)', ''))).toEqual(['Réussite, carrière, quand', 'Réussite, carrière, quand']);
    expect(plus.map((d) => d.open)).toEqual([true, false]);
    expect(plus[0].querySelector<HTMLInputElement>('.sfp-jet-quand input')?.value).toBe('si le joueur regarde où il marche');
  });

  it('un jet sans titre empêche d’enregistrer ; on le monte, on le descend, on le retire', async () => {
    const {page, texte, fixture} = await rendre();
    const cliquer = async (el: HTMLElement) => {
      el.click();
      await fixture.whenStable();
    };
    const bouton = (label: string) => page.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    const titres = () => [...page.querySelectorAll<HTMLInputElement>('.sfp-jet-titre input')].map((i) => i.value);
    const enregistrer = () => [...page.querySelectorAll<HTMLButtonElement>('button[type="submit"]')][0];

    await cliquer([...page.querySelectorAll<HTMLButtonElement>('.sfp-onglet')].find((b) => texte(b) === 'Jets')!);
    const ajouter = [...page.querySelectorAll<HTMLButtonElement>('button')].find((b) => texte(b) === 'add Jet')!;
    await cliquer(ajouter);
    expect(enregistrer().disabled).toBe(true);
    await cliquer(ajouter);
    const [premier, second] = [...page.querySelectorAll<HTMLInputElement>('.sfp-jet-titre input')];
    for (const [champ, valeur] of [[premier, 'Tentacules'], [second, 'Algues']] as const) {
      champ.value = valeur;
      champ.dispatchEvent(new Event('input'));
    }
    await fixture.whenStable();
    expect(enregistrer().disabled).toBe(false);

    expect(bouton('Monter le jet 1').disabled).toBe(true);
    await cliquer(bouton('Descendre le jet 1'));
    expect(titres()).toEqual(['Algues', 'Tentacules']);
    await cliquer(bouton('Retirer le jet 1'));
    expect(titres()).toEqual(['Tentacules']);
  });

  it('la région se choisit sur la carte ; fermer la carte sans choix la laisse comme elle était', async () => {
    const {page, texte, fixture, open, sceneService, enregistrer} = await rendre({id: 's1', regions: [{id: 14, region: 'Satarla'}, {id: 6, region: 'Lysor'}]});
    const pastille = page.querySelector<HTMLButtonElement>('.sfp-region')!;
    const fermeAvec = async (resultat: unknown) => {
      open.mockReturnValueOnce({afterClosed: () => of(resultat)});
      pastille.click();
      await fixture.whenStable();
    };

    await fermeAvec(6);
    expect((open.mock.calls[0] as unknown[])[1]).toEqual(expect.objectContaining({data: {regions: [{id: 6, region: 'Lysor'}, {id: 14, region: 'Satarla'}], regionId: null}}));
    expect(texte(pastille)).toContain('Lysor');
    await fermeAvec(undefined);
    await fermeAvec('');
    expect(texte(pastille)).toContain('Lysor');

    await enregistrer();
    expect(((sceneService.update.mock.calls[0] as unknown[])[1] as Record<string, unknown>)['region_id']).toBe(6);
  });

  it('la carte des régions ne s’ouvre pas tant que les régions ne sont pas chargées', async () => {
    const {page} = await rendre();

    expect(page.querySelector<HTMLButtonElement>('.sfp-region')!.disabled).toBe(true);
  });

  it('sous le rang, « + » et « − » changent le nombre, le camp se choisit d’un clic ; tout s’enregistre', async () => {
    const {page, fixture, texte, sceneService, enregistrer} = await rendre();
    const bande = page.querySelector('.sca-bande')!;

    bande.querySelector<HTMLButtonElement>('[aria-label="Un Loup géant de plus"]')!.click();
    await fixture.whenStable();
    expect(texte(page.querySelector('.sca-nombre'))).toBe('×3');
    bande.querySelector<HTMLButtonElement>('[aria-label="Un Loup géant de moins"]')!.click();
    bande.querySelector<HTMLButtonElement>('.prg-camp-option--heros')!.click();
    await fixture.whenStable();
    expect(texte(page.querySelector('.sca-nombre'))).toBe('×2');
    expect(page.querySelector('.sca--allie')).not.toBeNull();
    await enregistrer();

    const distribution = ((sceneService.update.mock.calls[0] as unknown[])[1] as {distribution: {qty: number; camp: string}[]}).distribution;
    expect(distribution[0]).toEqual(expect.objectContaining({qty: 2, camp: 'heros'}));
  });

  it('la pastille de l’attitude ouvre son menu ; « Sans attitude » l’efface', async () => {
    const {page, fixture, sceneService, enregistrer} = await rendre();

    const pastille = page.querySelector<HTMLButtonElement>('.sca-attitude button')!;
    expect(pastille.getAttribute('aria-label')).toBe('Attitude de Loup géant : Hostile');
    pastille.click();
    await fixture.whenStable();
    [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')].find((b) => b.textContent?.includes('Sans attitude'))!.click();
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

    expect(page.querySelectorAll('bol-scene-carte').length).toBe(0);
    expect(composant.canLeave()).not.toBe(true);
    expect(open).toHaveBeenCalled();
  });

  it('une nouvelle scène naît dans son chapitre, puis s’enregistre avec ses personnages', async () => {
    const {page, sceneService, enregistrer, fixture, texte} = await rendre({chapitre: 'dv1'});

    expect(texte(page.querySelector('.sfp-kicker'))).toBe('Nouvelle scène');
    expect(texte(page.querySelector('.sfp-fil'))).toBe('Le Dieu voilé — 1. L’oracle de Nemmereth · nouvelle scène');
    const titre = page.querySelector<HTMLInputElement>('#sfp-titre')!;
    titre.value = 'La citadelle';
    titre.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    await enregistrer();

    expect(sceneService.create).toHaveBeenCalledWith('La citadelle', 'dv1');
    expect(sceneService.update).toHaveBeenCalledWith('nouvelle', expect.objectContaining({titre: 'La citadelle', distribution: []}));
  });
});
