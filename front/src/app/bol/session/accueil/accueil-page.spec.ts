import {provideHttpClient} from '@angular/common/http';
import {ApplicationRef, ChangeDetectionStrategy, Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {NEVER, Observable, of, throwError} from 'rxjs';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {CompagnieDialogComponent} from '../new/compagnie-dialog/compagnie-dialog';
import {OpenTableDialogComponent} from '../new/open-table-dialog/open-table-dialog';
import {AccueilPageComponent} from './accueil-page';
import {chapitre} from '../chapitre.testing';

/** Le menu du compte tire l'authentification Google : il a ses propres tests. */
@Component({selector: 'bol-account-menu', template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class AccountMenuStubComponent {}

const DATA: BolAccueilModel = {
  derniere: 't1',
  compagnies: [
    {id: 'c1', nom: 'Les Lames de Satarla', heros: [{id: 'h1', nom: 'Axel', avatar: null}], parties: 1},
    {id: 'c2', nom: 'Les Fils du Serpent', heros: [{id: 'h3', nom: 'Balaram', avatar: null}], parties: 1},
  ],
  parties: [
    {
      id: 't1',
      compagnie_id: 'c1',
      titre: 'Les Lames de Satarla',
      statut: 'libre',
      jouee_le: '2026-11-04T10:00:00+00:00',
      scenario_id: 'p1',
      scene_id: 's2',
      scenes: [
        {id: 's1', titre: 'La taverne de Marsus'},
        {id: 's2', titre: 'La nuit du coup fourré'},
        {id: 's3', titre: 'Arrivée à Malakut'},
      ],
      scenes_jouees: ['s1', 's2'],
      chapitres_joues: [],
      scenario_termine: false,
      figurants: 0,
      heros: [
        {id: 'h1', nom: 'Axel', avatar: null},
        {id: 'h2', nom: 'jadawin', avatar: '/api/bol/portraits/abc.png'},
      ],
    },
    {
      id: 't2',
      compagnie_id: 'c2',
      titre: 'Les Fils du Serpent',
      statut: 'libre',
      jouee_le: '2026-11-03T10:00:00+00:00',
      scenario_id: 'p2',
      scene_id: null,
      scenes: [],
      scenes_jouees: [],
      chapitres_joues: ['p1'],
      scenario_termine: false,
      figurants: 0,
      heros: [{id: 'h3', nom: 'Balaram', avatar: null}],
    },
    {
      id: 't3',
      compagnie_id: null,
      titre: null,
      statut: 'libre',
      jouee_le: '2026-11-01T10:00:00+00:00',
      scenario_id: null,
      scene_id: null,
      scenes: [],
      scenes_jouees: [],
      chapitres_joues: [],
      scenario_termine: false,
      figurants: 0,
      heros: [],
    },
  ],
  scenarios: [
    chapitre('p1', 'Perle du Beshaar — 1. Sacrilège à Satarla'),
    chapitre('p2', "Perle du Beshaar — 2. De sable et d'eau"),
    chapitre('dv1', "Le Dieu voilé — 1. L'oracle de Nemmereth"),
  ],
  comptes: {heros: 5, pnjs: 196, creatures: 103, demons: 15, armes: 54, armures: 6, sessions: 3, compagnies: 2, scenarios: 3},
};

describe('AccueilPageComponent', () => {
  const open = vi.fn();
  const changerChapitre = vi.fn();
  const marquer = vi.fn();
  const snack = vi.fn();
  let accueil: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    for (const espion of [open, changerChapitre, marquer, snack]) {
      espion.mockReset();
    }
    open.mockReturnValue({afterClosed: () => of(true)});
    changerChapitre.mockReturnValue(of({}));
    marquer.mockReturnValue(of({}));
  });

  function configurer(providers: unknown[] = []): void {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([{path: '', component: AccueilPageComponent}]),
        provideHttpClient(),
        {provide: BolAccueilService, useValue: {accueil}},
        {provide: BolFightSessionService, useValue: {changerChapitre, marquerScenarioTermine: marquer}},
        {provide: MatDialog, useValue: {open}},
        {provide: MatSnackBar, useValue: {open: snack}},
        ...providers,
      ],
    });
    TestBed.overrideComponent(AccueilPageComponent, {remove: {imports: [AccountMenuComponent]}, add: {imports: [AccountMenuStubComponent]}});
  }

  /** `suivante` : la réponse des lectures d'après la première. */
  async function rendre(reponse: Observable<BolAccueilModel> = of(DATA), suivante = reponse): Promise<HTMLElement> {
    accueil = vi.fn(() => suivante).mockReturnValueOnce(reponse);
    configurer();
    const fixture = TestBed.createComponent(AccueilPageComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  async function stable(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  const texte = (el: Element | null | undefined) => el?.textContent?.trim().replace(/\s+/g, ' ') ?? null;
  const items = () => [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
  const item = (libelle: string) => items().find((b) => texte(b)?.includes(libelle))!;
  const lignes = (page: HTMLElement) => [...page.querySelectorAll('.acc-autre')];
  /** L'accueil où la partie `id` est la dernière jouée (celle du bandeau), modifiée par `changer`. */
  const avecDerniere = (id: string, changer = (partie: BolAccueilModel['parties'][number]) => partie) =>
    of({...DATA, derniere: id, parties: DATA.parties.map((partie) => (partie.id === id ? changer(partie) : partie))});

  it('montre la dernière partie jouée en grand : son scénario, sa compagnie, où elle en est, qui y est assis, de quoi la reprendre', async () => {
    const page = await rendre();
    const soir = page.querySelector('.acc-soir')!;

    expect(texte(soir.querySelector('.acc-soir-surtitre'))).toContain('Dernière partie jouée');
    expect(texte(soir.querySelector('.acc-soir-titre'))).toBe('Perle du Beshaar');
    expect(texte(soir.querySelector('.acc-soir-compagnie .ceq-nom'))).toBe('Les Lames de Satarla');
    expect([...soir.querySelectorAll('.acc-repere')].map((r) => r.querySelector('.sr-only')?.textContent)).toEqual([
      '1. Sacrilège à Satarla : en cours',
      "2. De sable et d'eau : à jouer",
    ]);
    expect([...soir.querySelectorAll('.acc-scene')].map((li) => li.className)).toEqual([
      'acc-scene acc-scene--jouee',
      'acc-scene acc-scene--en-cours',
      'acc-scene acc-scene--a-jouer',
    ]);
    expect(texte(soir.querySelector('.acc-soir-texte'))).toBe('1. Sacrilège à Satarla — scène 2 sur 3 : La nuit du coup fourré');
    expect(soir.querySelector('.acc-soir-scene')?.textContent).toBe('La nuit du coup fourré');
    const compagnie = soir.querySelector('.acc-soir-compagnie')!;
    expect(texte(compagnie.querySelector('.ceq-noms'))).toBe('Axel et jadawin');
    expect([...compagnie.querySelectorAll('.ceq-lien')].map((a) => a.getAttribute('href'))).toEqual(['/create/hero/h1', '/create/hero/h2']);
    expect(texte(compagnie.querySelector('.ceq-initiale'))).toBe('A');
    expect(compagnie.querySelector('img')?.getAttribute('src')).toBe('/api/bol/portraits/abc.png');
    expect(soir.querySelector<HTMLAnchorElement>('.acc-soir-actions a')?.getAttribute('href')).toBe('/session/t1/play');
    expect(page.textContent).not.toContain('Clore');
  });

  it('dit le combat engagé à côté de la scène en cours', async () => {
    const page = await rendre(of({...DATA, parties: [{...DATA.parties[0], statut: 'combat'}, ...DATA.parties.slice(1)]}));

    expect(page.querySelector('.acc-soir-texte')?.textContent).toContain('La nuit du coup fourré · combat engagé');
  });

  it('à côté, les parties, celle du bandeau en tête : une ligne chacune, qui mène à sa table, puis « Toutes les parties »', async () => {
    const page = await rendre();
    const [lames, fils, sansNom] = lignes(page);

    expect(texte(page.querySelector('.acc-autres-titre'))).toBe('Parties');
    expect(lignes(page).length).toBe(3);
    expect(lames.classList).toContain('acc-autre--derniere');
    expect(texte(lames.querySelector('.acc-autre-detail'))).toBe('Les Lames de Satarla · 1. Sacrilège à Satarla');
    expect(lames.textContent).toContain(', la dernière jouée');
    expect(fils.classList).not.toContain('acc-autre--derniere');
    expect(texte(fils.querySelector('.acc-autre-scenario'))).toBe('Perle du Beshaar');
    expect(texte(fils.querySelector('.acc-autre-detail'))).toBe("Les Fils du Serpent · 2. De sable et d'eau");
    expect(texte(sansNom.querySelector('.acc-autre-scenario'))).toBe('Partie improvisée');
    expect(texte(sansNom.querySelector('.acc-autre-detail'))).toBe('Table sans nom');
    expect(fils.querySelectorAll('a').length).toBe(1);
    expect(fils.querySelector('a')?.getAttribute('href')).toBe('/session/t2/play');
    expect(page.querySelector('.acc-partie-nouvelle')?.getAttribute('aria-label')).toBe('Nouvelle partie');
    expect(page.querySelector('.acc-autres-toutes')?.getAttribute('href')).toBe('/library/sessions');
  });

  it('ne montre que la partie du bandeau et les quatre autres les plus récentes', async () => {
    const parties = [0, 1, 2, 3, 4, 5].map((i) => ({...DATA.parties[1], id: `x${i}`, titre: `Compagnie ${i}`}));
    const page = await rendre(of({...DATA, parties: [DATA.parties[0], ...parties]}));

    expect(lignes(page).map((ligne) => texte(ligne.querySelector('.acc-autre-detail'))?.split(' · ')[0])).toEqual([
      'Les Lames de Satarla',
      'Compagnie 0',
      'Compagnie 1',
      'Compagnie 2',
      'Compagnie 3',
    ]);
  });

  it('seule, la dernière partie est aussi la seule ligne de la colonne', async () => {
    const page = await rendre(of({...DATA, parties: [DATA.parties[0]]}));

    expect(lignes(page).length).toBe(1);
    expect(lignes(page)[0].classList).toContain('acc-autre--derniere');
  });

  it('sans légende, chaque pastille donne le nom de son chapitre en bulle', async () => {
    const page = await rendre();

    expect(page.querySelector('.acc-legende')).toBeNull();
    const pastille = page.querySelector<HTMLElement>('.acc-soir .acc-repere')!;
    pastille.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await stable();

    expect(document.querySelector('.mat-mdc-tooltip')?.textContent).toContain('1. Sacrilège à Satarla');
  });

  it('« + Partie » ouvre le dialogue qui associe une compagnie à un scénario', async () => {
    const page = await rendre();

    page.querySelector<HTMLButtonElement>('.acc-partie-nouvelle')!.click();

    expect(open).toHaveBeenCalledWith(OpenTableDialogComponent, expect.objectContaining({data: {scenarioId: null, accueil: DATA}}));
  });

  it('le bouton du haut crée une compagnie, puis l’accueil se relit', async () => {
    const page = await rendre();
    const bouton = page.querySelector<HTMLButtonElement>('.acc-entete-actions button')!;

    expect(texte(bouton)).toContain('Nouvelle compagnie');
    bouton.click();
    await stable();

    expect(open).toHaveBeenCalledWith(CompagnieDialogComponent, expect.objectContaining({data: {compagnie: null}}));
    expect(accueil).toHaveBeenCalledTimes(2);
  });

  it('si « Nouvelle partie » dit qu’il faut une compagnie, ouvre « Nouvelle compagnie »', async () => {
    const page = await rendre();
    open.mockReturnValueOnce({afterClosed: () => of('compagnie')});

    page.querySelector<HTMLButtonElement>('.acc-partie-nouvelle')!.click();
    await stable();

    expect(open).toHaveBeenLastCalledWith(CompagnieDialogComponent, expect.objectContaining({data: {compagnie: null}}));
  });

  it('« Changer de chapitre » ne propose que les chapitres du scénario de la partie, puis relit l’accueil', async () => {
    const page = await rendre();
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();
    expect(document.querySelectorAll('.pch-courant').length).toBe(1);
    expect(document.querySelector('.pch-courant')?.textContent).toBe('1. Sacrilège à Satarla');
    expect(items().filter((b) => /^\d\./.test(texte(b) ?? '')).map((b) => texte(b))).toEqual([
      '1. Sacrilège à Satarla, en cours',
      "2. De sable et d'eau",
    ]);
    item("2. De sable et d'eau").click();
    await stable();

    expect(changerChapitre).toHaveBeenCalledWith('t1', 'p2');
    expect(accueil).toHaveBeenCalledTimes(2);
  });

  it('en plein combat, « Changer de chapitre » est grisé et dit pourquoi', async () => {
    const page = await rendre(of({...DATA, parties: DATA.parties.map((p) => (p.id === 't1' ? {...p, statut: 'combat' as const} : p))}));
    const bouton = page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!;

    expect(bouton.disabled).toBe(true);
    expect(texte(bouton)).toContain('combat en cours');
  });

  it('en plein combat, « Choisir un scénario » est grisé et dit pourquoi', async () => {
    const page = await rendre(avecDerniere('t3', (p) => ({...p, statut: 'combat' as const})));
    const bouton = page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!;

    expect(bouton.disabled).toBe(true);
    expect(texte(bouton)).toBe('swap_horiz Choisir un scénario : combat en cours');
  });

  it('les lignes des parties n’ont pas de menu : leurs actions sont dans « Mes parties »', async () => {
    const page = await rendre();

    expect(lignes(page).every((ligne) => ligne.querySelectorAll('button').length === 0)).toBe(true);
  });

  it('dit si la première scène du nouveau chapitre a laissé des figurants de côté', async () => {
    const page = await rendre(avecDerniere('t2'));
    changerChapitre.mockReturnValue(of({figurants_ignores: 2}));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();
    items().find((b) => !b.querySelector('.pch-courant') && /^\d\./.test(texte(b) ?? ''))!.click();
    await stable();
    document.querySelectorAll<HTMLButtonElement>('mat-dialog-actions button').forEach((b) => b.click());
    await stable();

    expect(snack.mock.calls.map((c) => c[0] as string).join()).toContain('2 personnages ont été ignorés');
  });

  it('« Changer de chapitre » marque ceux que cette partie a joués', async () => {
    const page = await rendre(avecDerniere('t2'));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    expect(texte(item('1. Sacrilège à Satarla'))).toBe('1. Sacrilège à Satarla · joué');
    expect(texte(item("2. De sable et d'eau"))).toBe("2. De sable et d'eau, en cours");
  });

  it('changer de chapitre demande confirmation quand des figurants partiraient', async () => {
    const page = await rendre(of({...DATA, parties: DATA.parties.map((p) => (p.id === 't1' ? {...p, figurants: 2} : p))}));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    open.mockReturnValue({afterClosed: () => of(false)});
    item("2. De sable et d'eau").click();
    await stable();

    expect((open.mock.calls[0][1] as {data: {message: string}}).data.message).toContain('ses 2 figurants partent, avec leurs blessures');
    expect(changerChapitre).not.toHaveBeenCalled();
  });

  it('confirmé, le changement de chapitre a lieu', async () => {
    const page = await rendre(of({...DATA, parties: DATA.parties.map((p) => (p.id === 't1' ? {...p, figurants: 1} : p))}));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    item("2. De sable et d'eau").click();
    await stable();

    expect(open).toHaveBeenCalledTimes(1);
    expect((open.mock.calls[0][1] as {data: {message: string}}).data.message).toContain('son figurant part, avec ses blessures');
    expect(changerChapitre).toHaveBeenCalledWith('t1', 'p2');
  });

  it('sans figurant, le changement de chapitre ne demande rien', async () => {
    const page = await rendre();
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    item("2. De sable et d'eau").click();
    await stable();

    expect(open).not.toHaveBeenCalled();
    expect(changerChapitre).toHaveBeenCalledWith('t1', 'p2');
  });

  it('une partie improvisée choisit un scénario, puis un de ses chapitres', async () => {
    const page = await rendre(avecDerniere('t3'));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();
    item('Le Dieu voilé').click();
    await stable();
    item("1. L'oracle de Nemmereth").click();
    await stable();

    expect(changerChapitre).toHaveBeenCalledWith('t3', 'dv1');
  });

  it('« Choisir un scénario » ne propose pas celui que sa compagnie joue déjà', async () => {
    const page = await rendre(avecDerniere('t3', (p) => ({...p, compagnie_id: 'c1'})));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    expect(item('Le Dieu voilé')).toBeDefined();
    expect(item('Perle du Beshaar')).toBeUndefined();
  });

  it('le MJ marque le scénario terminé sous les chapitres du bandeau, puis l’accueil se relit', async () => {
    const page = await rendre();
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    item('Marquer le scénario terminé').click();
    await stable();

    expect(marquer).toHaveBeenCalledWith('t1', true);
    expect(accueil).toHaveBeenCalledTimes(2);
  });

  it('une autre partie terminée le dit sur sa ligne', async () => {
    const page = await rendre(of({...DATA, parties: DATA.parties.map((p) => (p.id === 't2' ? {...p, scenario_termine: true} : p))}));

    expect(texte(lignes(page)[1].querySelector('.acc-autre-detail'))).toBe('Les Fils du Serpent · Scénario terminé');
  });

  it('terminée, la partie du bandeau permet de se raviser', async () => {
    const page = await rendre(avecDerniere('t2', (p) => ({...p, scenario_termine: true})));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    expect(item('Marquer le scénario terminé')).toBeUndefined();
    item('Scénario pas encore terminé').click();
    await stable();

    expect(marquer).toHaveBeenCalledWith('t2', false);
  });

  it('une partie improvisée n’a pas de scénario à marquer', async () => {
    const page = await rendre(avecDerniere('t3'));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    expect(item('Le Dieu voilé')).toBeDefined();
    expect(item('Marquer le scénario terminé')).toBeUndefined();
  });

  it('si le marquage échoue, le dit', async () => {
    const page = await rendre();
    marquer.mockReturnValue(throwError(() => new Error('réseau')));
    page.querySelector<HTMLButtonElement>('.acc-soir .pch-bouton')!.click();
    await stable();

    item('Marquer le scénario terminé').click();
    await stable();

    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledTimes(1);
  });

  it('une lecture réussie après un échec efface l’erreur : les parties réapparaissent', async () => {
    const page = await rendre(throwError(() => new Error('réseau')), of(DATA));
    expect(page.querySelector('.acc-autres')).toBeNull();

    page.querySelector<HTMLButtonElement>('.acc-entete-actions button')!.click();
    await stable();
    TestBed.tick();

    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(texte(page.querySelector('.acc-soir-titre'))).toBe('Perle du Beshaar');
    expect(lignes(page).length).toBe(3);
  });

  it('compte les fiches de chaque bibliothèque : le bestiaire réunit créatures et démons, l’intendance armes et armures', async () => {
    const page = await rendre();
    const tuiles = [...page.querySelectorAll('.acc-biblio')];

    expect(tuiles.map((t) => t.querySelector('.acc-biblio-lien')?.getAttribute('aria-label'))).toEqual([
      'Héros, 5', 'PNJ, 196', 'Bestiaire, 118', 'Intendance, 60', 'Scénarios, 3', 'Compagnies, 2',
    ]);
    expect(tuiles[2].querySelector('.acc-biblio-lien')?.getAttribute('href')).toBe('/bestiaire');
    expect(texte(tuiles[2].querySelector('.acc-biblio-detail'))).toBe('103 créatures · 15 démons');
    expect(tuiles[3].querySelector('.acc-biblio-lien')?.getAttribute('href')).toBe('/intendance');
    expect(texte(tuiles[3].querySelector('.acc-biblio-detail'))).toBe('54 armes · 6 armures');
    expect(tuiles[4].querySelector('.acc-biblio-lien')?.getAttribute('href')).toBe('/library/scenarios');
  });

  it('chaque tuile a dans son coin de quoi créer, ou d’aller droit aux bibliothèques qu’elle regroupe', async () => {
    const page = await rendre();
    const raccourcis = [...page.querySelectorAll('.acc-biblio')].map((t) =>
      [...t.querySelectorAll('.acc-biblio-raccourci')].map((b) => `${b.getAttribute('aria-label')} ${b.getAttribute('href') ?? '(bouton)'}`),
    );

    expect(raccourcis).toEqual([
      ['Créer un héros /create/hero'],
      ['Créer un PNJ /create/pnj'],
      ['Créatures /library/creatures', 'Démons /library/demons'],
      ['Armes /library/weapons', 'Armures /library/armors'],
      ['Nouveau scénario /library/scenarios'],
      ['Nouvelle compagnie (bouton)'],
    ]);

    page.querySelector<HTMLButtonElement>('.acc-biblio-raccourci[aria-label="Nouvelle compagnie"]')!.click();
    expect(open).toHaveBeenLastCalledWith(CompagnieDialogComponent, expect.objectContaining({data: {compagnie: null}}));
  });

  it('sans compagnie, dit qu’il en faut une pour lancer une partie, sans proposer de partie', async () => {
    const page = await rendre(of({...DATA, derniere: null, parties: [], compagnies: []}));

    expect(texte(page.querySelector('.acc-soir-titre'))).toBe('Aucune compagnie');
    expect(texte(page.querySelector('.acc-soir-texte'))).toContain('Il faut d’abord créer une compagnie pour lancer une partie');
    expect(page.querySelector('.acc-autres')).toBeNull();
    expect(page.querySelector('.acc-partie-nouvelle')).toBeNull();

    [...page.querySelectorAll<HTMLButtonElement>('.acc-soir button')].find((b) => b.textContent?.includes('Nouvelle compagnie'))!.click();

    expect(open).toHaveBeenCalledWith(CompagnieDialogComponent, expect.anything());
  });

  it('avec une compagnie mais sans partie, propose d’en lancer une', async () => {
    const page = await rendre(of({...DATA, derniere: null, parties: []}));

    expect(texte(page.querySelector('.acc-soir-titre'))).toBe('Aucune partie');
    expect(page.querySelector('.acc-autres')).toBeNull();

    [...page.querySelectorAll<HTMLButtonElement>('.acc-soir button')].find((b) => b.textContent?.includes('Partie'))!.click();

    expect(open).toHaveBeenCalledWith(OpenTableDialogComponent, expect.objectContaining({data: expect.objectContaining({scenarioId: null})}));
  });

  it('ouvre le dialogue quand on y arrive par /session/new (?table=nouvelle), puis rend son adresse à l’accueil', async () => {
    accueil = vi.fn(() => of(DATA));
    configurer();

    await RouterTestingHarness.create('/?table=nouvelle&scenario=p2');

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(OpenTableDialogComponent, expect.objectContaining({data: expect.objectContaining({scenarioId: 'p2'})}));
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('rouvre « Nouvelle compagnie » au retour de la création d’un héros (?table=compagnie)', async () => {
    accueil = vi.fn(() => of(DATA));
    configurer();

    await RouterTestingHarness.create('/?table=compagnie');

    expect(open).toHaveBeenCalledWith(CompagnieDialogComponent, expect.objectContaining({data: {compagnie: null, reprendreLaSelection: true, nomEnCours: ''}}));
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('au retour de la création d’un héros, rend le nom déjà tapé (?nom=…) et le retire de l’adresse', async () => {
    accueil = vi.fn(() => of(DATA));
    configurer();

    await RouterTestingHarness.create('/?table=compagnie&nom=Les%20Lames');

    expect(open).toHaveBeenCalledWith(CompagnieDialogComponent, expect.objectContaining({data: {compagnie: null, reprendreLaSelection: true, nomEnCours: 'Les Lames'}}));
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('pendant le chargement, le bandeau n’affirme rien : il se dit occupé', async () => {
    const page = await rendre(NEVER);
    const bandeau = page.querySelector('.acc-soir')!;

    expect(bandeau.textContent).not.toContain('Aucune');
    expect(bandeau.getAttribute('aria-busy')).toBe('true');
    expect(bandeau.querySelector('[role="status"]')?.textContent).toContain('Chargement');
  });

  it('une fois l’accueil arrivé, le bandeau n’est plus occupé', async () => {
    const page = await rendre();

    expect(page.querySelector('.acc-soir')?.getAttribute('aria-busy')).toBe('false');
  });

  it('dit quand l’accueil ne se charge pas, dans le bandeau, sans prétendre qu’il n’y a aucune partie', async () => {
    const page = await rendre(throwError(() => new Error('réseau')));
    const bandeau = page.querySelector('.acc-soir')!;

    expect(bandeau.textContent).not.toContain('Aucune partie');
    expect(page.querySelectorAll('[role="alert"]').length).toBe(1);
    expect(bandeau.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger les parties');
    expect(bandeau.querySelector<HTMLAnchorElement>('a[href="/library/sessions"]')?.textContent).toContain('Mes parties');
  });
});
