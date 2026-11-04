import {signal, WritableSignal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';
import {BolAccueilModel} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {OpenTableData} from '../../models/open-table.model';
import {OpenTableDialogComponent} from './open-table-dialog';
import {chapitre} from '../../chapitre.testing';

const ACCUEIL: BolAccueilModel = {
  derniere: null,
  parties: [],
  scenarios: [
    chapitre('p1', 'Perle du Beshaar — 1. Sacrilège à Satarla'),
    chapitre('p2', "Perle du Beshaar — 2. De sable et d'eau"),
    chapitre('p3', "Perle du Beshaar — 3. Le tombeau d'Urzûlzalinaar"),
    chapitre('p4', "Perle du Beshaar — 4. Le réveil de l'Ébranleur"),
    chapitre('p5', 'Perle du Beshaar — 5. Tolometh'),
    chapitre('dvi', 'Le Dieu voilé — Introduction : La colère de Nemmereth'),
    chapitre('dv1', "Le Dieu voilé — 1. L'oracle de Nemmereth"),
    chapitre('ps', 'premier scénario'),
  ],
  comptes: {heros: 1, pnjs: 0, creatures: 0, demons: 0, armes: 0, armures: 0, sessions: 0},
};

describe('OpenTableDialogComponent', () => {
  const accueil = vi.fn();
  const launch = vi.fn();
  const loadCatalog = vi.fn();
  const fermer = vi.fn();
  const snack = vi.fn();
  /** Le catalogue de la bibliothèque : vide tant que le réseau n'a pas répondu, comme le vrai service. */
  let catalog: WritableSignal<readonly {catalogId: string}[]>;
  let catalogLoading: WritableSignal<boolean>;
  let catalogFailed: WritableSignal<boolean>;
  let accueil$: Subject<BolAccueilModel>;
  let fixture: ComponentFixture<OpenTableDialogComponent>;
  let element: HTMLElement;

  async function ouvrir(data: OpenTableData, heroes = [{catalogId: 'hero:h1', qty: 1}], catalogResolu = true): Promise<void> {
    catalog = signal(catalogResolu ? [{catalogId: 'hero:h1'}] : []);
    catalogLoading = signal(!catalogResolu);
    catalogFailed = signal(false);
    accueil$ = new Subject<BolAccueilModel>();
    for (const espion of [accueil, launch, loadCatalog, fermer, snack]) {
      espion.mockReset();
    }
    accueil.mockReturnValue(accueil$);
    launch.mockReturnValue(of({id: 's9'}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([{path: 'session/:id/play', children: []}]),
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: MatDialogRef, useValue: {close: fermer}},
        {provide: MatDialog, useValue: {open: vi.fn()}},
        {provide: MatSnackBar, useValue: {open: snack}},
        {provide: BolAccueilService, useValue: {accueil}},
        {
          provide: CombatSelectionService,
          useValue: {
            loadCatalog,
            loading: catalogLoading,
            loadFailed: catalogFailed,
            combatants: signal(heroes),
            entryFor: (id: string) => (catalog().some((e) => e.catalogId === id) ? {nom: 'Grimar', avatar: ''} : undefined),
            remove: vi.fn(),
            launch,
            reset: vi.fn(),
          },
        },
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

  async function repondre(data: BolAccueilModel = ACCUEIL): Promise<void> {
    accueil$.next(data);
    accueil$.complete();
    await stable();
  }

  function bouton(texte: string): HTMLButtonElement {
    return [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(texte))!;
  }

  const texte = (selecteur: string) => element.querySelector(selecteur)?.textContent?.trim() ?? null;

  const champNom = () => element.querySelector<HTMLInputElement>('.otd-nom input');

  async function nommer(nom = 'Les Lames de Satarla'): Promise<void> {
    const input = champNom()!;
    input.value = nom;
    input.dispatchEvent(new Event('input'));
    await stable();
  }

  const items = () => [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
  const item = (libelle: string) => items().find((b) => b.textContent?.replace(/\s+/g, ' ').includes(libelle))!;

  it('se présente comme une nouvelle partie', async () => {
    await ouvrir({scenarioId: null, accueil: ACCUEIL});

    expect(texte('.otd-surtitre')).toBe('Nouvelle partie');
    expect(texte('#otd-titre')).toBe('Qui est à table ?');
    expect(bouton('Créer la partie')).toBeDefined();
    expect(element.textContent).not.toContain('Clore');
  });

  describe('le scénario', () => {
    it('montre le chapitre demandé, placé dans son scénario, et ne relit pas l’accueil qu’on lui donne', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      expect(texte('.otd-chapitre-place')).toBe('Perle du Beshaar › Chapitre 5 sur 5');
      expect(texte('.otd-chapitre-nom')).toBe('Tolometh');
      expect(accueil).not.toHaveBeenCalled();
    });

    it('choisir un scénario part de son premier chapitre (l’introduction s’il y en a une)', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL});

      bouton('Choisir un scénario').click();
      await stable();
      expect(items().map((b) => b.textContent?.trim())).toEqual(['Le Dieu voilé', 'Perle du Beshaar', 'premier scénario']);
      item('Le Dieu voilé').click();
      await stable();

      expect(texte('.otd-chapitre-place')).toBe('Le Dieu voilé › Introduction');
      expect(texte('.otd-chapitre-nom')).toBe('La colère de Nemmereth');
    });

    it('le chapitre de départ se change parmi ceux du scénario seulement', async () => {
      await ouvrir({scenarioId: 'p1', accueil: ACCUEIL});

      bouton('Chapitre de départ').click();
      await stable();
      expect(items().map((b) => b.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        'check1. Sacrilège à Satarla, choisi',
        "2. De sable et d'eau",
        "3. Le tombeau d'Urzûlzalinaar",
        "4. Le réveil de l'Ébranleur",
        '5. Tolometh',
      ]);
      item('3. Le tombeau').click();
      await stable();

      expect(texte('.otd-chapitre-nom')).toBe("Le tombeau d'Urzûlzalinaar");
    });

    it('un one shot n’a pas de chapitre de départ à choisir', async () => {
      await ouvrir({scenarioId: 'ps', accueil: ACCUEIL});

      expect(texte('.otd-chapitre-place')).toBe('One shot');
      expect(bouton('Chapitre de départ')).toBeUndefined();
    });

    it('« Improviser » retire le scénario : la partie se crée sans lui', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      bouton('Improviser').click();
      await nommer();
      bouton('Créer la partie').click();

      expect(texte('.otd-chapitre-nom')).toBe('Partie improvisée');
      expect(launch).toHaveBeenCalledWith('Les Lames de Satarla', null);
    });

    it('prévient qu’un chapitre inconnu du compte est introuvable, et laisse créer la partie sans lui', async () => {
      await ouvrir({scenarioId: 'zz', accueil: ACCUEIL});
      await nommer();

      expect(texte('[role="alert"]')).toContain('introuvable');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('sans accueil, le lit : « Créer la partie » attend sa réponse, sans rien prétendre du chapitre', async () => {
      await ouvrir({scenarioId: 'p5'});
      await nommer();

      expect(accueil).toHaveBeenCalledTimes(1);
      expect(texte('[role="status"]')).toContain('Chargement du chapitre');
      expect(element.querySelector('[role="alert"]')).toBeNull();
      expect(bouton('Créer la partie').disabled).toBe(true);

      await repondre();

      expect(texte('.otd-chapitre-nom')).toBe('Tolometh');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });

    it('si l’accueil ne répond pas, reste utilisable, sans chapitre, et le dit', async () => {
      await ouvrir({scenarioId: 'p5'});
      await nommer();

      accueil$.error(new Error('réseau'));
      await stable();

      expect(texte('[role="alert"]')).toContain('Impossible de charger le chapitre');
      expect(bouton('Créer la partie').disabled).toBe(false);
    });
  });

  describe('créer la partie', () => {
    it('la crée avec son nom, son chapitre et ses héros, et mène à sa table', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      expect(texte('.otd-resume-texte')).toBe('Tolometh, avec Grimar');
      await nommer();
      expect(texte('.otd-resume-texte')).toBe('Les Lames de Satarla · Tolometh, avec Grimar');
      bouton('Créer la partie').click();
      await stable();

      expect(launch).toHaveBeenCalledWith('Les Lames de Satarla', 'p5');
      expect(fermer).toHaveBeenCalledWith(true);
      expect(TestBed.inject(Router).url).toBe('/session/s9/play');
    });

    it('si la création échoue : le dit et reste ouvert', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});
      launch.mockReturnValue(throwError(() => new Error('réseau')));
      await nommer();

      bouton('Créer la partie').click();
      await stable();

      expect(snack).toHaveBeenCalledTimes(1);
      expect(fermer).not.toHaveBeenCalled();
    });
  });

  describe('le nom de la table', () => {
    it('est obligatoire : sans lui, « Créer la partie » est désactivé et le dialogue dit pourquoi', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      expect(champNom()!.required).toBe(true);
      expect(bouton('Créer la partie').disabled).toBe(true);
      expect(texte('.otd-nom mat-hint')).toBe('« Créer la partie » attend le nom de la compagnie.');

      await nommer('   ');
      expect(bouton('Créer la partie').disabled).toBe(true);

      await nommer();
      expect(bouton('Créer la partie').disabled).toBe(false);
      expect(element.querySelector('.otd-nom mat-hint')).toBeNull();
    });

    it('part sans les blancs autour, et Entrée ouvre la table', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      await nommer('  Les Lames de Satarla  ');
      champNom()!.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
      await stable();

      expect(launch).toHaveBeenCalledWith('Les Lames de Satarla', 'p5');
    });

    it('part vide : une nouvelle partie est une nouvelle compagnie', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      expect(champNom()!.value).toBe('');
    });

    it('Entrée sans nom n’ouvre rien', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      champNom()!.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
      await stable();

      expect(launch).not.toHaveBeenCalled();
    });
  });

  describe('les héros', () => {
    it('sans héros, « Créer la partie » est désactivé et le dialogue dit pourquoi', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL}, []);
      await nommer();

      expect(bouton('Créer la partie').disabled).toBe(true);
      expect(element.textContent).toContain('« Créer la partie » attend au moins un héros.');
    });

    it('ne compte que les héros que le catalogue sait nommer', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL}, [{catalogId: 'hero:h1', qty: 1}, {catalogId: 'hero:disparu', qty: 1}]);

      expect(element.querySelectorAll('.otd-heros-pastille').length).toBe(1);
      expect(texte('.otd-compte')).toBe('1 héros');
    });

    it('tant que le catalogue n’a pas résolu la présélection, « Créer la partie » est désactivé et le chargement est annoncé', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL}, [{catalogId: 'hero:h1', qty: 1}], false);
      await nommer();

      expect(bouton('Créer la partie').disabled).toBe(true);
      expect(element.textContent).toContain('Chargement des héros');
    });

    it('si le catalogue ne charge pas : le dit, et propose de réessayer', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL});
      await nommer();
      loadCatalog.mockClear();
      catalogFailed.set(true);
      await stable();

      expect(texte('.otd-alerte--action')).toContain('Impossible de charger les héros');
      expect(bouton('Créer la partie').disabled).toBe(true);
      bouton('Réessayer').click();
      expect(loadCatalog).toHaveBeenCalledTimes(1);
    });
  });
});
