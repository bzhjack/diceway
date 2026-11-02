import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {of, Subject} from 'rxjs';
import {AuthService} from '../../../core/auth/auth.service';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {SessionNewPageComponent} from './session-new-page';

const ACCUEIL: BolAccueilModel = {
  table: null,
  scenarios: [
    {id: 'A', titre: 'Le Dieu voilé'},
    {id: 'B', titre: 'La Cité des brumes'},
  ],
  scenarios_joues: [],
  scenario_recent_id: null,
  derniers_heros: ['h1'],
};

describe('SessionNewPageComponent', () => {
  const accueil = vi.fn();
  const preselectHeroes = vi.fn();
  const launch = vi.fn();
  let accueil$: Subject<BolAccueilModel>;
  let harness: RouterTestingHarness;
  let element: HTMLElement;

  /** Ouvre le seuil sur `url` ; la réponse de l'accueil n'arrive que quand le test l'envoie, comme le réseau. */
  async function ouvrir(url: string, heroes = [{catalogId: 'hero:h1', qty: 1}]): Promise<void> {
    accueil$ = new Subject<BolAccueilModel>();
    accueil.mockReset();
    accueil.mockReturnValue(accueil$);
    preselectHeroes.mockReset();
    launch.mockReset();
    launch.mockReturnValue(of({id: 's9'}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([
          {path: 'session/new', component: SessionNewPageComponent},
          {path: 'session/:id/play', children: []},
        ]),
        {provide: MatDialog, useValue: {open: vi.fn()}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: AuthService, useValue: {user: signal(null), logout: vi.fn()}},
        {provide: BolAccueilService, useValue: {accueil}},
        {
          provide: CombatSelectionService,
          useValue: {
            loadCatalog: vi.fn(),
            combatants: signal(heroes),
            entryFor: () => ({nom: 'Grimar', avatar: null}),
            remove: vi.fn(),
            preselectHeroes,
            launch,
            reset: vi.fn(),
          },
        },
      ],
    });
    harness = await RouterTestingHarness.create(url);
    element = harness.routeNativeElement as HTMLElement;
  }

  async function repondre(data: BolAccueilModel = ACCUEIL): Promise<void> {
    accueil$.next(data);
    accueil$.complete();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  async function aller(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function scenarioAffiche(): string | null {
    return element.querySelector('.snp-scenario-nom')?.textContent?.trim() ?? null;
  }

  function ouvrirLaTable(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>('.snp-header button[mat-flat-button]')!;
  }

  describe('le scénario demandé', () => {
    it('montre celui de ?scenario=', async () => {
      await ouvrir('/session/new?scenario=A');
      await repondre();

      expect(scenarioAffiche()).toBe('Le Dieu voilé');
    });

    it('suit le paramètre quand seule la query change (le composant est gardé)', async () => {
      await ouvrir('/session/new?scenario=A');
      await repondre();

      await aller('/session/new?scenario=B');

      expect(scenarioAffiche()).toBe('La Cité des brumes');
      await aller('/session/new');
      expect(scenarioAffiche()).toBeNull();
    });

    it('ne charge l’accueil et ne présélectionne les héros qu’une fois', async () => {
      await ouvrir('/session/new?scenario=A');
      await repondre();

      await aller('/session/new?scenario=B');

      expect(accueil).toHaveBeenCalledTimes(1);
      expect(preselectHeroes).toHaveBeenCalledTimes(1);
      expect(preselectHeroes).toHaveBeenCalledWith(['h1']);
    });

    it('ignore un scénario inconnu du compte', async () => {
      await ouvrir('/session/new?scenario=Z');
      await repondre();

      expect(scenarioAffiche()).toBeNull();
    });

    it('« × » retire le scénario et le paramètre de l’URL, sans toucher aux autres', async () => {
      await ouvrir('/session/new?scenario=A&autre=1');
      await repondre();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

      element.querySelector<HTMLButtonElement>('button[aria-label="Retirer le scénario"]')!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(navigate).toHaveBeenCalledWith([], {queryParams: {scenario: null}, queryParamsHandling: 'merge', replaceUrl: true});
      expect(TestBed.inject(Router).url).toBe('/session/new?autre=1');
      expect(scenarioAffiche()).toBeNull();
    });

    it('la table s’ouvre avec le scénario affiché', async () => {
      await ouvrir('/session/new?scenario=A');
      await repondre();

      ouvrirLaTable().click();

      expect(launch).toHaveBeenCalledWith(null, 'A');
    });
  });

  describe('« Ouvrir la table » pendant le chargement de l’accueil', () => {
    it('reste désactivé tant que l’accueil n’a pas répondu', async () => {
      await ouvrir('/session/new?scenario=A');
      harness.detectChanges();

      expect(ouvrirLaTable().disabled).toBe(true);

      await repondre();

      expect(ouvrirLaTable().disabled).toBe(false);
    });

    it('un clic avant la réponse ne crée rien', async () => {
      await ouvrir('/session/new?scenario=A');

      ouvrirLaTable().click();

      expect(launch).not.toHaveBeenCalled();
    });

    it('s’active aussi quand l’accueil échoue : le seuil reste utilisable, sans scénario', async () => {
      await ouvrir('/session/new?scenario=A');

      accueil$.error(new Error('hors ligne'));
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(ouvrirLaTable().disabled).toBe(false);
      expect(scenarioAffiche()).toBeNull();
    });

    it('sans héros, reste désactivé même une fois l’accueil arrivé', async () => {
      await ouvrir('/session/new', []);
      await repondre();

      expect(ouvrirLaTable().disabled).toBe(true);
    });
  });
});
