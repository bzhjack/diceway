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
  const items = () => [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
  const item = (libelle: string) => items().find((b) => b.textContent?.replace(/\s+/g, ' ').includes(libelle))!;

  async function choisirCompagnie(nom: string): Promise<void> {
    bouton('compagnie').click();
    await stable();
    item(nom).click();
    await stable();
  }

  it('associe une compagnie à un scénario, sans demander de nom ni de héros', async () => {
    await ouvrir({scenarioId: null, accueil: ACCUEIL});

    expect(texte('.otd-surtitre')).toBe('Nouvelle partie');
    expect(element.querySelector('.otd-nom')).toBeNull();
    expect(bouton('Ajouter un héros')).toBeUndefined();
    expect(bouton('Créer la partie')).toBeDefined();
  });

  describe('la compagnie', () => {
    it('attend qu’on en choisisse une parmi celles du compte, et le dit', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      expect(bouton('Créer la partie').disabled).toBe(true);
      expect(element.textContent).toContain('« Créer la partie » attend une compagnie.');

      bouton('Choisir une compagnie').click();
      await stable();
      expect(items().map((b) => b.textContent?.trim())).toEqual(['Les Lames', 'Les Fils', 'Les Anciens']);
    });

    it('prend d’office la seule compagnie du compte', async () => {
      await ouvrir({scenarioId: 'p1', accueil: {...ACCUEIL, compagnies: [LAMES]}});

      expect(texte('.otd-compagnie-nom')).toBe('Les Lames');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('montre les héros de la compagnie choisie', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      await choisirCompagnie('Les Lames');

      expect(texte('.otd-compagnie-nom')).toBe('Les Lames');
      expect([...element.querySelectorAll('.otd-heros-nom')].map((n) => n.textContent)).toEqual(['Axel', 'Grimar']);
      expect(element.querySelector('.otd-heros-retirer')).toBeNull();
    });

    it('une compagnie sans héros ne peut pas jouer, et le dialogue le dit', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      await choisirCompagnie('Les Anciens');

      expect(element.textContent).toContain('Cette compagnie n’a pas de héros');
      expect(bouton('Créer la partie').disabled).toBe(true);
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
    it('montre le chapitre demandé, placé dans son scénario, et ne relit pas l’accueil qu’on lui donne', async () => {
      await ouvrir({scenarioId: 'p3', accueil: ACCUEIL});

      expect(texte('.otd-chapitre-place')).toBe('Perle du Beshaar › Chapitre 3 sur 3');
      expect(texte('.otd-chapitre-nom')).toBe("Le tombeau d'Urzûlzalinaar");
      expect(accueil).not.toHaveBeenCalled();
    });

    it('choisir un scénario part de son premier chapitre (l’introduction s’il y en a une)', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL});

      bouton('Choisir un scénario').click();
      await stable();
      expect(items().map((b) => b.textContent?.trim())).toEqual(['Le Dieu voilé', 'Perle du Beshaar', 'premier scénario']);
      expect(document.querySelectorAll('.otd-menu-choisi').length).toBe(0);
      item('Le Dieu voilé').click();
      await stable();

      bouton('Choisir un scénario').click();
      await stable();
      expect(document.querySelectorAll('.mat-mdc-menu-panel mat-icon').length).toBe(0);
      expect([...document.querySelectorAll('.otd-menu-choisi')].map((e) => e.textContent)).toEqual(['Le Dieu voilé']);

      expect(texte('.otd-chapitre-place')).toBe('Le Dieu voilé › Introduction');
      expect(texte('.otd-chapitre-nom')).toBe('La colère de Nemmereth');
    });

    it('le chapitre de départ se change parmi ceux du scénario seulement', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      bouton('Chapitre de départ').click();
      await stable();
      expect(items().map((b) => b.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        '1. Sacrilège à Satarla, choisi',
        "2. De sable et d'eau",
        "3. Le tombeau d'Urzûlzalinaar",
      ]);
      // Le choisi est en gras : ni coche, ni décalage de la ligne.
      expect(document.querySelectorAll('.mat-mdc-menu-panel mat-icon').length).toBe(0);
      expect([...document.querySelectorAll('.otd-menu-choisi')].map((e) => e.textContent)).toEqual(['1. Sacrilège à Satarla']);
      item('3. Le tombeau').click();
      await stable();

      expect(texte('.otd-chapitre-nom')).toBe("Le tombeau d'Urzûlzalinaar");
    });

    it('un one shot n’a pas de chapitre de départ à choisir', async () => {
      await ouvrir({scenarioId: 'ps', accueil: ACCUEIL});

      expect(texte('.otd-chapitre-place')).toBe('One shot');
      expect(bouton('Chapitre de départ')).toBeUndefined();
    });

    it('sans scénario choisi, la partie se crée improvisée', async () => {
      await ouvrir({scenarioId: null, accueil: {...ACCUEIL, compagnies: [LAMES]}});

      bouton('Créer la partie').click();

      expect(texte('.otd-chapitre-nom')).toBe('Partie improvisée');
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

    it('prévient qu’un chapitre inconnu du compte est introuvable', async () => {
      await ouvrir({scenarioId: 'zz', accueil: ACCUEIL});

      expect(texte('[role="alert"]')).toContain('introuvable');
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

      expect(texte('.otd-chapitre-nom')).toBe('Sacrilège à Satarla');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });
  });

  describe('une compagnie déjà sur ce scénario', () => {
    const AVEC_PARTIE = {...ACCUEIL, parties: [partie({scenario_id: 'p2'})]};

    it('le dit, propose de reprendre sa partie, et ne la crée pas deux fois', async () => {
      await ouvrir({scenarioId: 'p1', accueil: AVEC_PARTIE});

      await choisirCompagnie('Les Lames');

      expect(texte('.otd-deja')).toContain('Les Lames joue déjà Perle du Beshaar');
      expect(element.querySelector<HTMLAnchorElement>('.otd-deja a')?.getAttribute('href')).toBe('/session/t1/play');
      expect(bouton('Créer la partie').disabled).toBe(true);
    });

    it('une autre compagnie peut jouer le même scénario', async () => {
      await ouvrir({scenarioId: 'p1', accueil: AVEC_PARTIE});

      await choisirCompagnie('Les Fils');

      expect(element.querySelector('.otd-deja')).toBeNull();
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('la même compagnie peut jouer un autre scénario', async () => {
      await ouvrir({scenarioId: 'dv1', accueil: AVEC_PARTIE});

      await choisirCompagnie('Les Lames');

      expect(element.querySelector('.otd-deja')).toBeNull();
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('elle peut aussi improviser une autre partie', async () => {
      await ouvrir({scenarioId: null, accueil: {...ACCUEIL, parties: [partie({scenario_id: null})]}});

      await choisirCompagnie('Les Lames');

      expect(element.querySelector('.otd-deja')).toBeNull();
    });
  });

  describe('créer la partie', () => {
    it('la crée pour cette compagnie sur ce chapitre, et mène à sa table', async () => {
      await ouvrir({scenarioId: 'p3', accueil: ACCUEIL});
      await choisirCompagnie('Les Lames');

      expect(texte('.otd-resume-texte')).toBe("Les Lames · Le tombeau d'Urzûlzalinaar, avec Axel et Grimar");
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
