import {signal, WritableSignal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';
import {BolAccueilModel, BolAccueilTable} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {OpenTableData} from '../../models/open-table.model';
import {OpenTableDialogComponent} from './open-table-dialog';
import {chapitre} from '../../chapitre.testing';

const TABLE: BolAccueilTable = {
  id: 't1',
  titre: null,
  statut: 'combat',
  scenario_id: 'p1',
  scene_id: null,
  scenes: [],
  scenes_jouees: [],
  created_at: '2026-07-30T12:00:00Z',
};

const ACCUEIL: BolAccueilModel = {
  table: null,
  scenarios: [
    chapitre('p1', 'Perle du Beshaar — 1. Sacrilège à Satarla'),
    chapitre('p2', "Perle du Beshaar — 2. De sable et d'eau"),
    chapitre('p3', "Perle du Beshaar — 3. Le tombeau d'Urzûlzalinaar"),
    chapitre('p4', "Perle du Beshaar — 4. Le réveil de l'Ébranleur"),
    chapitre('p5', 'Perle du Beshaar — 5. Tolometh'),
  ],
  scenarios_joues: [],
  scenario_recent_id: null,
  derniers_heros: ['h1'],
  compagnie: [],
  comptes: {heros: 1, pnjs: 0, creatures: 0, demons: 0, armes: 0, armures: 0, sessions: 1},
};

describe('OpenTableDialogComponent', () => {
  const accueil = vi.fn();
  const preselectHeroes = vi.fn();
  const launch = vi.fn();
  const loadCatalog = vi.fn();
  const closeSession = vi.fn();
  const changer = vi.fn();
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
    for (const espion of [accueil, preselectHeroes, launch, loadCatalog, closeSession, changer, fermer, snack]) {
      espion.mockReset();
    }
    accueil.mockReturnValue(accueil$);
    launch.mockReturnValue(of({id: 's9'}));
    closeSession.mockReturnValue(of({}));
    changer.mockReturnValue(of({}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([{path: 'session/:id/play', children: []}]),
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: MatDialogRef, useValue: {close: fermer}},
        {provide: MatDialog, useValue: {open: vi.fn()}},
        {provide: MatSnackBar, useValue: {open: snack}},
        {provide: BolAccueilService, useValue: {accueil}},
        {provide: BolFightSessionService, useValue: {close: closeSession, changerChapitre: changer}},
        {
          provide: CombatSelectionService,
          useValue: {
            loadCatalog,
            loading: catalogLoading,
            loadFailed: catalogFailed,
            combatants: signal(heroes),
            entryFor: (id: string) => (catalog().some((e) => e.catalogId === id) ? {nom: 'Grimar', avatar: ''} : undefined),
            remove: vi.fn(),
            preselectHeroes,
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

  async function nommer(nom = 'Les veillées'): Promise<void> {
    const input = champNom()!;
    input.value = nom;
    input.dispatchEvent(new Event('input'));
    await stable();
  }

  describe('l’histoire', () => {
    it('montre le chapitre choisi, placé dans sa saga, et ne relit pas l’accueil qu’on lui donne', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      expect(texte('.otd-chapitre-place')).toBe('Perle du Beshaar › Chapitre 5 sur 5');
      expect(texte('.otd-chapitre-nom')).toBe('Tolometh');
      expect(accueil).not.toHaveBeenCalled();
      expect(preselectHeroes).toHaveBeenCalledWith(['h1']);
    });

    it('« Changer de chapitre » propose les chapitres de chaque saga, sans quitter le dialogue', async () => {
      await ouvrir({scenarioId: 'p5', accueil: {...ACCUEIL, scenarios_joues: ['p2']}});
      const items = () => [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];

      bouton('Changer de chapitre').click();
      await stable();
      items().find((b) => b.textContent?.includes('Perle du Beshaar'))!.click();
      await stable();

      const chapitres = items().filter((b) => /^\d\./.test(b.textContent?.trim().replace(/^check\s*/, '') ?? ''));
      expect(chapitres.map((b) => b.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        '1. Sacrilège à Satarla',
        "2. De sable et d'eau · joué",
        "3. Le tombeau d'Urzûlzalinaar · le prochain",
        "4. Le réveil de l'Ébranleur",
        'check5. Tolometh, choisi',
      ]);

      chapitres[2].click();
      await stable();

      expect(fermer).not.toHaveBeenCalled();
      expect(texte('.otd-chapitre-nom')).toBe("Le tombeau d'Urzûlzalinaar");
      expect(texte('.otd-chapitre-place')).toBe('Perle du Beshaar › Chapitre 3 sur 5');
    });

    it('« Improviser » retire le chapitre : la table s’ouvre sans scénario', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      bouton('Improviser').click();
      await nommer();
      bouton('Ouvrir la table').click();

      expect(texte('.otd-chapitre-nom')).toBe('Partie improvisée');
      expect(launch).toHaveBeenCalledWith('Les veillées', null);
    });

    it('prévient qu’un chapitre inconnu du compte est introuvable, et laisse ouvrir la table sans lui', async () => {
      await ouvrir({scenarioId: 'zz', accueil: ACCUEIL});
      await nommer();

      expect(texte('[role="alert"]')).toContain('introuvable');
      expect(bouton('Ouvrir la table').disabled).toBe(false);
    });

    it('sans accueil, le lit : « Ouvrir la table » attend sa réponse, sans rien prétendre du chapitre', async () => {
      await ouvrir({scenarioId: 'p5'});
      await nommer();

      expect(accueil).toHaveBeenCalledTimes(1);
      expect(texte('[role="status"]')).toContain('Chargement du chapitre');
      expect(element.querySelector('[role="alert"]')).toBeNull();
      expect(bouton('Ouvrir la table').disabled).toBe(true);

      await repondre();

      expect(texte('.otd-chapitre-nom')).toBe('Tolometh');
      expect(preselectHeroes).toHaveBeenCalledWith(['h1']);
      expect(bouton('Ouvrir la table').disabled).toBe(false);
    });

    it('si l’accueil ne répond pas, reste utilisable, sans chapitre, et le dit', async () => {
      await ouvrir({scenarioId: 'p5'});
      await nommer();

      accueil$.error(new Error('réseau'));
      await stable();

      expect(texte('[role="alert"]')).toContain('Impossible de charger le chapitre');
      expect(bouton('Ouvrir la table').disabled).toBe(false);
    });
  });

  describe('ouvrir la table', () => {
    it('sans autre table ouverte, l’ouvre avec le chapitre et mène à elle', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      expect(texte('.otd-resume-texte')).toBe('Tolometh, avec Grimar');
      expect(element.querySelector('.otd-deja')).toBeNull();
      await nommer();
      expect(texte('.otd-resume-texte')).toBe('Les veillées · Tolometh, avec Grimar');
      bouton('Ouvrir la table').click();
      await stable();

      expect(closeSession).not.toHaveBeenCalled();
      expect(launch).toHaveBeenCalledWith('Les veillées', 'p5');
      expect(fermer).toHaveBeenCalledWith(true);
      expect(TestBed.inject(Router).url).toBe('/session/s9/play');
    });

    it('avec une table ouverte : la signale, demande confirmation, la clôt puis ouvre la nouvelle', async () => {
      await ouvrir({scenarioId: 'p5', accueil: {...ACCUEIL, table: TABLE}});

      expect(texte('.otd-deja-table')).toContain('Sacrilège à Satarla');
      expect(texte('.otd-deja-texte')).toBe(
        'Ouvrir celle-ci la clôt : le combat en cours s’arrête, son chapitre compte comme joué, elle reste dans « Mes tables », d’où elle se reprend.',
      );
      expect(texte('.otd-resume-cloture')).toBe('Sacrilège à Satarla sera close.');

      await nommer();
      bouton('Ouvrir la table').click();
      await stable();

      expect(launch).not.toHaveBeenCalled();
      expect(texte('#otd-titre')).toBe('Clore Sacrilège à Satarla ?');
      expect([...element.querySelectorAll('.otd-confirmation li')].map((li) => li.textContent?.trim())).toEqual([
        'le combat en cours s’arrête',
        'son chapitre compte comme joué',
        'elle reste dans « Mes tables », d’où elle se reprend',
      ]);
      expect(document.activeElement).toBe(bouton('Clore et ouvrir Les veillées'));

      bouton('Clore et ouvrir Les veillées').click();
      await stable();

      expect(closeSession).toHaveBeenCalledWith('t1');
      expect(launch).toHaveBeenCalledWith('Les veillées', 'p5');
      expect(closeSession.mock.invocationCallOrder[0]).toBeLessThan(launch.mock.invocationCallOrder[0]);
      expect(TestBed.inject(Router).url).toBe('/session/s9/play');
    });

    it('« Annuler » revient au choix sans rien clore', async () => {
      await ouvrir({scenarioId: 'p5', accueil: {...ACCUEIL, table: TABLE}});
      await nommer();
      bouton('Ouvrir la table').click();
      await stable();

      bouton('Annuler').click();
      await stable();

      expect(texte('#otd-titre')).toBe('Qui est à table ce soir ?');
      expect(closeSession).not.toHaveBeenCalled();
      expect(launch).not.toHaveBeenCalled();
    });

    it('si l’ouverture échoue : le dit, revient au choix, et relit l’accueil (l’ancienne table a pu se clore)', async () => {
      await ouvrir({scenarioId: 'p5', accueil: {...ACCUEIL, table: TABLE}});
      launch.mockReturnValue(throwError(() => new Error('réseau')));
      await nommer();
      bouton('Ouvrir la table').click();
      await stable();

      bouton('Clore et ouvrir Les veillées').click();
      await stable();

      expect(snack).toHaveBeenCalledTimes(1);
      expect(fermer).not.toHaveBeenCalled();
      expect(texte('#otd-titre')).toBe('Qui est à table ce soir ?');
      expect(accueil).toHaveBeenCalledTimes(1);
    });
  });

  describe('le nom de la table', () => {
    it('est obligatoire : sans lui, « Ouvrir la table » est désactivé et le dialogue dit pourquoi', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      expect(champNom()!.required).toBe(true);
      expect(bouton('Ouvrir la table').disabled).toBe(true);
      expect(texte('.otd-nom mat-hint')).toBe('« Ouvrir la table » attend un nom.');

      await nommer('   ');
      expect(bouton('Ouvrir la table').disabled).toBe(true);

      await nommer();
      expect(bouton('Ouvrir la table').disabled).toBe(false);
      expect(element.querySelector('.otd-nom mat-hint')).toBeNull();
    });

    it('part sans les blancs autour, et Entrée ouvre la table', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      await nommer('  Les veillées  ');
      champNom()!.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
      await stable();

      expect(launch).toHaveBeenCalledWith('Les veillées', 'p5');
    });

    it('Entrée sans nom n’ouvre rien', async () => {
      await ouvrir({scenarioId: 'p5', accueil: ACCUEIL});

      champNom()!.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
      await stable();

      expect(launch).not.toHaveBeenCalled();
    });
  });

  describe('reprendre la table ouverte', () => {
    const REPRISE = {...ACCUEIL, table: TABLE, compagnie: [{id: 'h1', nom: 'Axel', avatar: null}]};
    const items = () => [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];

    it('sur son chapitre : mène à elle sans rien changer, avec ses héros, sans rien clore', async () => {
      await ouvrir({scenarioId: 'p1', accueil: REPRISE, reprise: true});

      expect(texte('#otd-titre')).toBe('Reprendre la table');
      expect(element.querySelector('.otd-deja')).toBeNull();
      expect([...element.querySelectorAll('.otd-heros-nom')].map((n) => n.textContent)).toEqual(['Axel']);
      expect(element.querySelector('.otd-heros-retirer')).toBeNull();
      expect(bouton('Ajouter un héros')).toBeUndefined();
      expect(loadCatalog).not.toHaveBeenCalled();
      expect(champNom()).toBeNull();
      expect(texte('.otd-resume-texte')).toBe('Sacrilège à Satarla, avec Axel');

      bouton('Reprendre la table').click();
      await stable();

      expect(changer).not.toHaveBeenCalled();
      expect(closeSession).not.toHaveBeenCalled();
      expect(fermer).toHaveBeenCalledWith(true);
      expect(TestBed.inject(Router).url).toBe('/session/t1/play');
    });

    it('sur un autre chapitre : la même table passe dessus, avec ses héros et son état', async () => {
      await ouvrir({scenarioId: 'p1', accueil: REPRISE, reprise: true});
      bouton('Changer de chapitre').click();
      await stable();
      items().find((b) => b.textContent?.includes('Perle du Beshaar'))!.click();
      await stable();
      items().find((b) => b.textContent?.includes('3. Le tombeau'))!.click();
      await stable();

      expect(texte('.otd-resume-cloture')).toBe('La table quitte Sacrilège à Satarla, avec ses héros et son état.');
      bouton("Passer à Le tombeau d'Urzûlzalinaar").click();
      await stable();

      expect(changer).toHaveBeenCalledWith('t1', 'p3');
      expect(closeSession).not.toHaveBeenCalled();
      expect(launch).not.toHaveBeenCalled();
      expect(TestBed.inject(Router).url).toBe('/session/t1/play');
    });

    it('« Improviser » passe la table en partie improvisée', async () => {
      await ouvrir({scenarioId: 'p1', accueil: REPRISE, reprise: true});

      bouton('Improviser').click();
      await stable();
      bouton('Passer en partie improvisée').click();
      await stable();

      expect(changer).toHaveBeenCalledWith('t1', null);
    });

    it('si le changement échoue : le dit et reste ouvert', async () => {
      await ouvrir({scenarioId: 'p1', accueil: REPRISE, reprise: true});
      changer.mockReturnValue(throwError(() => new Error('réseau')));

      bouton('Improviser').click();
      await stable();
      bouton('Passer en partie improvisée').click();
      await stable();

      expect(snack).toHaveBeenCalledTimes(1);
      expect(fermer).not.toHaveBeenCalled();
    });
  });

  describe('les héros', () => {
    it('sans héros, « Ouvrir la table » est désactivé et le dialogue dit pourquoi', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL}, []);
      await nommer();

      expect(bouton('Ouvrir la table').disabled).toBe(true);
      expect(element.textContent).toContain('« Ouvrir la table » attend au moins un héros.');
    });

    it('ne compte que les héros que le catalogue sait nommer', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL}, [{catalogId: 'hero:h1', qty: 1}, {catalogId: 'hero:disparu', qty: 1}]);

      expect(element.querySelectorAll('.otd-heros-pastille').length).toBe(1);
      expect(texte('.otd-compte')).toBe('1 héros');
    });

    it('tant que le catalogue n’a pas résolu la présélection, « Ouvrir la table » est désactivé et le chargement est annoncé', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL}, [{catalogId: 'hero:h1', qty: 1}], false);
      await nommer();

      expect(bouton('Ouvrir la table').disabled).toBe(true);
      expect(element.textContent).toContain('Chargement des héros');
    });

    it('si le catalogue ne charge pas : le dit, et propose de réessayer', async () => {
      await ouvrir({scenarioId: null, accueil: ACCUEIL});
      await nommer();
      loadCatalog.mockClear();
      catalogFailed.set(true);
      await stable();

      expect(texte('.otd-alerte--action')).toContain('Impossible de charger les héros');
      expect(bouton('Ouvrir la table').disabled).toBe(true);
      bouton('Réessayer').click();
      expect(loadCatalog).toHaveBeenCalledTimes(1);
    });
  });
});
