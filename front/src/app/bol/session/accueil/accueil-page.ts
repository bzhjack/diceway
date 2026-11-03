import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage, NgTemplateOutlet} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {BolAccueilComptes, BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {CloseTableService} from '../../shared/close-table/close-table.service';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {usableAvatar} from '../../../shared/avatar-fallback/avatar.util';
import {OpenTableData} from '../models/open-table.model';
import {OpenTableDialogComponent} from '../new/open-table-dialog/open-table-dialog';
import {accueilSagas, ONE_SHOT, sagaResumes, tableOuverte, teinteDeSaga} from './accueil.util';

interface AccueilBibliotheque {
  readonly cle: keyof BolAccueilComptes;
  readonly label: string;
  readonly route: string;
  /** Le lien pour créer une fiche de cette bibliothèque, quand il y en a un. */
  readonly creer?: {readonly route: string; readonly ariaLabel: string};
}

const BIBLIOTHEQUES: readonly AccueilBibliotheque[] = [
  {cle: 'heros', label: 'Héros', route: '/library/heroes', creer: {route: '/create/hero', ariaLabel: 'Créer un héros'}},
  {cle: 'pnjs', label: 'PNJ', route: '/library/pnjs', creer: {route: '/create/pnj', ariaLabel: 'Créer un PNJ'}},
  {cle: 'creatures', label: 'Créatures', route: '/library/creatures', creer: {route: '/create/creature', ariaLabel: 'Créer une créature'}},
  {cle: 'demons', label: 'Démons', route: '/library/demons', creer: {route: '/create/demon', ariaLabel: 'Créer un démon'}},
  {cle: 'armes', label: 'Armes', route: '/library/weapons'},
  {cle: 'armures', label: 'Armures', route: '/library/armors'},
  {cle: 'sessions', label: 'Tables', route: '/library/sessions'},
];

/** Accueil, sur `/` : la table ouverte (où en est l'histoire, saga › chapitre › scène, et la compagnie qui y est assise) à reprendre ou à
 * clore, puis les sagas en carrousel (leurs chapitres en pastilles et leur bouton : la table ouverte quand elle porte un de leurs chapitres,
 * sinon le chapitre à jouer, sur une nouvelle table), puis les bibliothèques avec leur nombre de fiches et de quoi en créer. */
@Component({
  selector: 'bol-accueil-page',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink, MatButtonModule, MatIconModule, AccountMenuComponent, AvatarFallbackDirective, DwCompactBarComponent],
  templateUrl: './accueil-page.html',
  styleUrl: './accueil-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccueilPageComponent {
  private readonly accueilService = inject(BolAccueilService);
  private readonly closeTable = inject(CloseTableService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly data = signal<BolAccueilModel | null>(null);
  protected readonly error = signal(false);
  /** L'accueil n'a pas encore répondu : on ne sait pas encore s'il y a une table ouverte. */
  protected readonly chargement = computed(() => this.data() === null && !this.error());
  protected readonly oneShot = ONE_SHOT;
  /** Le carrousel des sagas est à son début, à sa fin (les deux : tout tient, sans flèches). */
  protected readonly railDebut = signal(true);
  protected readonly railFin = signal(true);
  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');

  protected readonly sagas = computed(() => {
    const data = this.data();
    return data
      ? sagaResumes(
          accueilSagas(data.scenarios, new Set(data.scenarios_joues), data.table?.scenario_id ?? null, data.scenario_recent_id),
          data.table?.id ?? null,
        )
      : [];
  });

  protected readonly table = computed(() => {
    const data = this.data();
    return data?.table ? tableOuverte(data.table, data.scenarios) : null;
  });

  /** La teinte de la saga de la table ouverte, pour son étiquette ; 0 sans saga. */
  protected readonly tableTeinte = computed(() => teinteDeSaga(this.sagas(), this.table()?.saga ?? null));

  protected readonly compagnie = computed(() =>
    (this.data()?.compagnie ?? []).map((heros) => ({...heros, portrait: usableAvatar(heros.avatar), initiale: heros.nom.charAt(0).toUpperCase()})),
  );

  protected readonly bibliotheques = computed(() => {
    const comptes = this.data()?.comptes ?? null;
    return BIBLIOTHEQUES.map((bibliotheque) => ({...bibliotheque, compte: comptes ? comptes[bibliotheque.cle] : null}));
  });

  constructor() {
    this.charger();
    // `/session/new` (le menu du compte, la palette de la table, le retour de « Créer un héros ») mène ici avec `?table=nouvelle` : le
    // dialogue s'ouvre, et l'adresse redevient celle de l'accueil.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (params.get('table') !== 'nouvelle') {
        return;
      }
      const scenario = params.get('scenario');
      void this.router.navigate([], {queryParams: {table: null, scenario: null}, queryParamsHandling: 'merge', replaceUrl: true});
      this.ouvrirTable(scenario);
    });
    // Le carrousel n'existe qu'une fois l'accueil arrivé ; sa largeur change avec la fenêtre.
    effect((onCleanup) => {
      const rail = this.rail()?.nativeElement;
      if (!rail || typeof ResizeObserver === 'undefined') {
        return;
      }
      const observateur = new ResizeObserver(() => this.mesurerRail());
      observateur.observe(rail);
      onCleanup(() => observateur.disconnect());
    });
  }

  protected mesurerRail(): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      return;
    }
    this.railDebut.set(rail.scrollLeft <= 1);
    this.railFin.set(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1);
  }

  /** Une carte de plus ou de moins ; le magnétisme du carrousel la cale contre le bord. */
  protected defiler(sens: 1 | -1): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      return;
    }
    const carte = rail.firstElementChild instanceof HTMLElement ? rail.firstElementChild.offsetWidth : rail.clientWidth;
    const ecart = parseFloat(getComputedStyle(rail).columnGap) || 0;
    const doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({left: sens * (carte + ecart), behavior: doux ? 'smooth' : 'auto'});
  }

  /** Le dialogue de la table, sur ce chapitre (null : on improvise), avec ce que l'accueil a déjà lu : une nouvelle table, ou, `reprise`,
   * la table ouverte (sur ce chapitre ou un autre). Il mène à la table. */
  protected ouvrirTable(scenarioId: string | null = null, reprise = false): void {
    this.dialog.open<OpenTableDialogComponent, OpenTableData, boolean>(OpenTableDialogComponent, {
      data: {scenarioId, accueil: this.data(), reprise},
      width: 'min(1120px, 94vw)',
      maxWidth: '94vw',
      ariaLabelledBy: 'otd-titre',
      autoFocus: 'first-heading',
    });
  }

  /** « Clore la table » du bandeau : une fois close, l'accueil est relu (plus de table ouverte, son chapitre compte comme joué). */
  protected clore(): void {
    const table = this.data()?.table;
    if (!table) {
      return;
    }
    this.closeTable
      .clore({id: table.id, enCombat: table.statut === 'combat'})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((close) => {
        if (close) {
          this.charger();
        }
      });
  }

  private charger(): void {
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set(true),
      });
  }
}
