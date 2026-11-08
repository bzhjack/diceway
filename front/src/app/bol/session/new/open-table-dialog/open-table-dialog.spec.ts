import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';
import {BolAccueilModel, BolAccueilPartie} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {OpenTableData} from '../../models/open-table.model';
import {OpenTableDialogComponent} from './open-table-dialog';
import {chapitre} from '../../chapitre.testing';

const LAMES = {id: 'c1', nom: 'Les Lames', heros: [{id: 'h1', nom: 'Axel', avatar: null}, {id: 'h2', nom: 'Grimar', avatar: null}], parties: 0};
const FILS = {id: 'c2', nom: 'Les Fils', heros: [{id: 'h3', nom: 'Balaram', avatar: null}], parties: 0};
const VIDE = {id: 'c3', nom: 'Les Anciens', heros: [], parties: 0};

const ACCUEIL: BolAccueilModel = {
  derniere: null,
  parties: [],
  compagnies: [LAMES, FILS, VIDE],
  scenarios: [
    chapitre('p1', 'Perle du Beshaar — 1. Sacrilège à Satarla'),
    chapitre('p2', "Perle du Beshaar — 2. De sable et d'eau"),
    chapitre('p3', "Perle du Beshaar — 3. Le tombeau d'Urzûlzalinaar"),
    chapitre('dvi', 'Le Dieu voilé — Introduction : La colère de Nemmereth'),
    chapitre('dv1', "Le Dieu voilé — 1. L'oracle de Nemmereth"),
    chapitre('ps', 'premier scénario'),
  ],
  comptes: {heros: 3, pnjs: 0, creatures: 0, demons: 0, armes: 0, armures: 0, sessions: 0, compagnies: 3},
};

const partie = (over: Partial<BolAccueilPartie>): BolAccueilPartie => ({
  id: 't1',
  compagnie_id: 'c1',
  titre: 'Les Lames',
  statut: 'libre',
  jouee_le: null,
  scenario_id: null,
  scene_id: null,
  scenes: [],
  scenes_jouees: [],
  chapitres_joues: [],
  scenario_termine: false,
  heros: [],
  figurants: 0,
  ...over,
});

describe('OpenTableDialogComponent', () => {
  const accueil = vi.fn();
  const creerPartie = vi.fn();
  const fermer = vi.fn();
  const snack = vi.fn();
  let accueil$: Subject<BolAccueilModel>;
  let fixture: ComponentFixture<OpenTableDialogComponent>;
  let element: HTMLElement;

  async function ouvrir(data: OpenTableData): Promise<void> {
    accueil$ = new Subject<BolAccueilModel>();
    for (const espion of [accueil, creerPartie, fermer, snack]) {
      espion.mockReset();
    }
    accueil.mockReturnValue(accueil$);
    creerPartie.mockReturnValue(of({id: 's9'}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([{path: 'session/:id/play', children: []}]),
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: MatDialogRef, useValue: {close: fermer}},
        {provide: MatSnackBar, useValue: {open: snack}},
        {provide: BolAccueilService, useValue: {accueil}},
        {provide: BolFightSessionService, useValue: {creerPartie}},
      ],
    });
    fixture = TestBed.createComponent(OpenTableDialogComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function stable(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function bouton(libelle: string): HTMLButtonElement {
    return [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(libelle))!;
  }

  const texte = (selecteur: string) => element.querySelector(selecteur)?.textContent?.trim() ?? null;
  const textes = (selecteur: string) => [...element.querySelectorAll(selecteur)].map((e) => e.textContent?.trim().replace(/\s+/g, ' '));
  /** La ligne d'une compagnie ou d'un scénario, d'après son nom. */
  const ligne = (nom: string) =>
    [...element.querySelectorAll<HTMLElement>('.otd-choix')].find((c) => c.querySelector('.otd-compagnie-nom, .otd-scenario-nom')?.textContent?.trim() === nom)!;
  const radio = (nom: string) => ligne(nom).querySelector<HTMLInputElement>('input[type="radio"]')!;
  const chapitres = () => [...element.querySelectorAll<HTMLButtonElement>('.otd-depart-chapitre')];

  async function choisir(nom: string): Promise<void> {
    radio(nom).click();
    await stable();
  }

  it('associe une compagnie à un scénario, sans demander de nom ni de héros, et sans menu', async () => {
    await ouvrir({scenarioId: null, accueil: ACCUEIL});

    expect(texte('.otd-surtitre')).toBe('Nouvelle partie');
    expect(element.querySelector('.otd-nom')).toBeNull();
    expect(element.querySelector('[mat-menu-trigger-for], .mat-mdc-menu-trigger')).toBeNull();
    expect(bouton('Ajouter un héros')).toBeUndefined();
    expect(bouton('Créer la partie')).toBeDefined();
  });

  describe('la compagnie', () => {
    it('montre toutes celles du compte, avec leurs héros, et attend qu’on en choisisse une', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      expect(textes('.otd-compagnie-nom')).toEqual(['Les Lames', 'Les Fils', 'Les Anciens']);
      expect(textes('.otd-choix-ligne .otd-compagnie-heros .otd-choix-detail')).toEqual(['Axel et Grimar', 'Balaram', 'Aucun héros']);
      expect(element.querySelectorAll('input[name="otd-compagnie"]:checked').length).toBe(0);
      expect(bouton('Créer la partie').disabled).toBe(true);
      expect(element.textContent).toContain('« Créer la partie » attend une compagnie.');
    });

    it('prend d’office la seule compagnie du compte', async () => {
      await ouvrir({scenarioId: 'p1', accueil: {...ACCUEIL, compagnies: [LAMES]}});

      expect(radio('Les Lames').checked).toBe(true);
      expect(ligne('Les Lames').classList).toContain('otd-choix--on');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('choisir une compagnie la cercle et permet de créer la partie', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      await choisir('Les Fils');

      expect(ligne('Les Fils').classList).toContain('otd-choix--on');
      expect(ligne('Les Lames').classList).not.toContain('otd-choix--on');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('une compagnie sans héros ne peut pas jouer, et le dialogue le dit', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      await choisir('Les Anciens');

      expect(element.textContent).toContain('Cette compagnie n’a pas de héros');
      expect(bouton('Créer la partie').disabled).toBe(true);
    });

    it('« Nouvelle compagnie », sous la liste, ramène à l’accueil pour en créer une', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL});

      bouton('Nouvelle compagnie').click();

      expect(fermer).toHaveBeenCalledWith('compagnie');
    });

    it('sans compagnie, dit qu’il faut d’abord en créer une, et y mène', async () => {
      await ouvrir({scenarioId: null, accueil: {...ACCUEIL, compagnies: []}});

      expect(element.textContent).toContain('Il faut d’abord une compagnie');
      expect(bouton('Créer la partie').disabled).toBe(true);

      bouton('Nouvelle compagnie').click();

      expect(fermer).toHaveBeenCalledWith('compagnie');
    });
  });

  describe('le scénario', () => {
    it('propose la partie improvisée, puis les sagas et les one shots, avec leur nombre de chapitres', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL});

      expect(textes('.otd-scenario-nom')).toEqual(['Partie improvisée', 'Le Dieu voilé', 'Perle du Beshaar', 'premier scénario']);
      expect(ligne('Perle du Beshaar').querySelector('.otd-choix-detail')?.textContent).toBe('3 chapitres');
      expect(ligne('premier scénario').querySelector('.otd-choix-detail')?.textContent).toBe('One shot');
      expect(radio('Partie improvisée').checked).toBe(true);
    });

    it('montre le chapitre demandé dans son scénario, et ne relit pas l’accueil qu’on lui donne', async () => {
      await ouvrir({scenarioId: 'p3', accueil: ACCUEIL});

      expect(radio('Perle du Beshaar').checked).toBe(true);
      expect(chapitres().map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
      expect(texte('.otd-depart-nom')).toBe("3. Le tombeau d'Urzûlzalinaar");
      expect(accueil).not.toHaveBeenCalled();
    });

    it('choisir un scénario part de son premier chapitre (l’introduction s’il y en a une)', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL});

      await choisir('Le Dieu voilé');

      expect(chapitres().map((c) => c.textContent?.trim())).toEqual(['Intro', '1']);
      expect(texte('.otd-depart-nom')).toBe('Introduction : La colère de Nemmereth');
    });

    it('le chapitre de départ se change parmi ceux du scénario seulement', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      expect(chapitres().map((c) => c.getAttribute('aria-label'))).toEqual([
        '1. Sacrilège à Satarla',
        "2. De sable et d'eau",
        "3. Le tombeau d'Urzûlzalinaar",
      ]);
      chapitres()[2].click();
      await stable();

      expect(chapitres().map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
      expect(texte('.otd-depart-nom')).toBe("3. Le tombeau d'Urzûlzalinaar");
    });

    it('un one shot n’a pas de chapitre de départ à choisir', async () => {
      await ouvrir({scenarioId: 'ps', accueil: ACCUEIL});

      expect(radio('premier scénario').checked).toBe(true);
      expect(element.querySelector('.otd-depart')).toBeNull();
    });

    it('sans scénario choisi, la partie se crée improvisée', async () => {
      await ouvrir({scenarioId: null, accueil: {...ACCUEIL, compagnies: [LAMES]}});

      expect(texte('.otd-resume-texte')).toBe('Les Lames · Partie improvisée');
      bouton('Créer la partie').click();

      expect(creerPartie).toHaveBeenCalledWith('c1', null);
    });

    it('on revient à la partie improvisée après avoir choisi un scénario', async () => {
      await ouvrir({scenarioId: 'p1', accueil: {...ACCUEIL, compagnies: [LAMES]}});

      await choisir('Partie improvisée');
      bouton('Créer la partie').click();

      expect(element.querySelector('.otd-depart')).toBeNull();
      expect(creerPartie).toHaveBeenCalledWith('c1', null);
    });

    it('dit si la première scène a laissé des figurants de côté', async () => {
      await ouvrir({scenarioId: 'p1', accueil: {...ACCUEIL, compagnies: [LAMES]}});
      creerPartie.mockReturnValue(of({id: 's9', figurants_ignores: 1}));

      bouton('Créer la partie').click();
      await stable();

      expect(snack).toHaveBeenCalledTimes(1);
      expect(snack.mock.calls[0][0]).toContain('1 personnage a été ignoré');
    });

    it('prévient qu’un chapitre inconnu du compte est introuvable : la partie sera improvisée', async () => {
      await ouvrir({scenarioId: 'zz', accueil: ACCUEIL});

      expect(texte('[role="alert"]')).toContain('introuvable');
      expect(radio('Partie improvisée').checked).toBe(true);
    });

    it('sans accueil, le lit : « Créer la partie » attend sa réponse, sans rien prétendre', async () => {
      await ouvrir({scenarioId: 'p1'});

      expect(accueil).toHaveBeenCalledTimes(1);
      expect(texte('[role="status"]')).toContain('Chargement');
      expect(element.textContent).not.toContain('Il faut d’abord une compagnie');
      expect(bouton('Créer la partie').disabled).toBe(true);

      accueil$.next({...ACCUEIL, compagnies: [LAMES]});
      accueil$.complete();
      await stable();

      expect(texte('.otd-depart-nom')).toBe('1. Sacrilège à Satarla');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });
  });

  describe('une compagnie déjà sur ce scénario', () => {
    const AVEC_PARTIE = {...ACCUEIL, parties: [partie({scenario_id: 'p2'})]};

    it('le dit sur sa ligne, propose de reprendre sa partie, et ne la crée pas deux fois', async () => {
      await ouvrir({scenarioId: 'p1', accueil: AVEC_PARTIE});

      await choisir('Les Lames');

      const perle = ligne('Perle du Beshaar');
      expect(perle.classList).toContain('otd-choix--pris');
      expect(perle.querySelector('.otd-choix-detail')?.textContent).toBe('Déjà joué par cette compagnie');
      expect(perle.querySelector<HTMLAnchorElement>('a.otd-reprendre')?.getAttribute('href')).toBe('/session/t1/play');
      expect(bouton('Créer la partie').disabled).toBe(true);
    });

    it('une autre compagnie peut jouer le même scénario', async () => {
      await ouvrir({scenarioId: 'p1', accueil: AVEC_PARTIE});

      await choisir('Les Fils');

      expect(element.querySelector('.otd-choix--pris')).toBeNull();
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('la même compagnie peut jouer un autre scénario ; celui qu’elle joue ne se choisit plus', async () => {
      await ouvrir({scenarioId: 'dv1', accueil: AVEC_PARTIE});

      await choisir('Les Lames');

      expect(radio('Perle du Beshaar').disabled).toBe(true);
      expect(radio('Le Dieu voilé').checked).toBe(true);
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('elle peut aussi improviser une autre partie', async () => {
      await ouvrir({scenarioId: null, accueil: {...ACCUEIL, parties: [partie({scenario_id: null})]}});

      await choisir('Les Lames');

      expect(element.querySelector('.otd-choix--pris')).toBeNull();
    });
  });

  describe('créer la partie', () => {
    it('la crée pour cette compagnie sur ce chapitre, et mène à sa table', async () => {
      await ouvrir({scenarioId: 'p3', accueil: ACCUEIL});
      await choisir('Les Lames');

      expect(texte('.otd-resume-texte')).toBe("Les Lames · Perle du Beshaar, à partir de 3. Le tombeau d'Urzûlzalinaar");
      bouton('Créer la partie').click();
      await stable();

      expect(creerPartie).toHaveBeenCalledWith('c1', 'p3');
      expect(fermer).toHaveBeenCalledWith(true);
      expect(TestBed.inject(Router).url).toBe('/session/s9/play');
    });

    it('si la création échoue : le dit et reste ouvert', async () => {
      await ouvrir({scenarioId: 'p3', accueil: {...ACCUEIL, compagnies: [LAMES]}});
      creerPartie.mockReturnValue(throwError(() => new Error('réseau')));

      bouton('Créer la partie').click();
      await stable();

      expect(snack).toHaveBeenCalledTimes(1);
      expect(fermer).not.toHaveBeenCalled();
    });
  });
});
