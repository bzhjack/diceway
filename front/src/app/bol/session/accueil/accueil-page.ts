import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltip} from '@angular/material/tooltip';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolAccueilComptes, BolAccueilModel} from '../../models/bol-accueil.model';
import {BolCompagnieModel} from '../../models/bol-compagnie.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {AccueilPartie, AccueilScenarioChoix} from '../models/accueil.model';
import {CompagnieDialogData} from '../models/compagnie-dialog.model';
import {OpenTableData, OpenTableResultat} from '../models/open-table.model';
import {CompagnieDialogComponent} from '../new/compagnie-dialog/compagnie-dialog';
import {OpenTableDialogComponent} from '../new/open-table-dialog/open-table-dialog';
import {bandeauDePartie, chapitresDuScenario, partiesDeLAccueil, scenariosLibresPour} from './accueil.util';
import {libelleDeChapitre} from '../scenario.util';

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
  {cle: 'compagnies', label: 'Compagnies', route: '/library/companies'},
  {cle: 'sessions', label: 'Parties', route: '/library/sessions'},
];

/** Accueil, sur `/` : la dernière partie jouée (où en est son histoire, scénario › chapitre › scène, et sa compagnie) à reprendre, puis
 * toutes les parties en carrousel (leur compagnie, leur scénario, leurs chapitres en pastilles pour elles, de quoi les reprendre, changer
 * de chapitre ou les supprimer), puis les bibliothèques avec leur nombre de fiches et de quoi en créer. */
@Component({
  selector: 'bol-accueil-page',
  imports: [NgOptimizedImage, RouterLink, MatButtonModule, MatIconModule, MatMenuModule, MatTooltip, AccountMenuComponent, AvatarFallbackDirective, DwCompactBarComponent],
  templateUrl: './accueil-page.html',
  styleUrl: './accueil-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccueilPageComponent {
  private readonly accueilService = inject(BolAccueilService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly data = signal<BolAccueilModel | null>(null);
  protected readonly error = signal(false);
  /** L'accueil n'a pas encore répondu : on ne sait pas encore s'il y a des parties. */
  protected readonly chargement = computed(() => this.data() === null && !this.error());
  /** Le carrousel des parties est à son début, à sa fin (les deux : tout tient, sans flèches). */
  protected readonly railDebut = signal(true);
  protected readonly railFin = signal(true);
  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');

  protected readonly parties = computed(() => {
    const data = this.data();
    return data ? partiesDeLAccueil(data) : [];
  });

  /** La dernière partie jouée, pour le bandeau ; null sans partie. */
  protected readonly bandeau = computed(() => {
    const data = this.data();
    const derniere = data?.parties.find((partie) => partie.id === data.derniere);
    return data && derniere ? bandeauDePartie(derniere, data.scenarios) : null;
  });

  /** Pas de partie sans compagnie : « + Partie » attend qu'il y en ait une. */
  protected readonly aDesCompagnies = computed(() => (this.data()?.compagnies.length ?? 0) > 0);

  /** « Choisir un scénario » d'une partie improvisée : ceux que sa compagnie ne joue pas déjà. */
  protected scenariosDe(partie: AccueilPartie): AccueilScenarioChoix[] {
    const data = this.data();
    return data ? scenariosLibresPour(partie.id, data) : [];
  }

  protected readonly bibliotheques = computed(() => {
    const comptes = this.data()?.comptes ?? null;
    return BIBLIOTHEQUES.map((bibliotheque) => ({...bibliotheque, compte: comptes ? comptes[bibliotheque.cle] : null}));
  });

  constructor() {
    this.charger();
    // `/session/new` (le menu du compte, la palette de la table, le retour de « Créer un héros ») mène ici avec `?table=nouvelle` ou `compagnie` : le
    // dialogue s'ouvre, et l'adresse redevient celle de l'accueil.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const table = params.get('table');
      if (table !== 'nouvelle' && table !== 'compagnie') {
        return;
      }
      const scenario = params.get('scenario');
      void this.router.navigate([], {queryParams: {table: null, scenario: null}, queryParamsHandling: 'merge', replaceUrl: true});
      if (table === 'compagnie') {
        this.nouvelleCompagnie();
      } else {
        this.nouvellePartie(scenario);
      }
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

  /** Le dialogue « Nouvelle partie » : une compagnie sur un scénario, avec ce que l'accueil a déjà lu. Il mène à la table ; s'il manque une
   * compagnie, il ramène ici pour en créer une. */
  protected nouvellePartie(scenarioId: string | null = null): void {
    this.dialog
      .open<OpenTableDialogComponent, OpenTableData, OpenTableResultat>(OpenTableDialogComponent, {
        data: {scenarioId, accueil: this.data()},
        width: 'min(1120px, 94vw)',
        maxWidth: '94vw',
        ariaLabelledBy: 'otd-titre',
        autoFocus: 'first-heading',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((resultat) => {
        if (resultat === 'compagnie') {
          this.nouvelleCompagnie();
        }
      });
  }

  /** Le dialogue « Nouvelle compagnie » : un nom et des héros. Une fois créée, l'accueil se relit (« + Partie » devient possible). */
  protected nouvelleCompagnie(): void {
    this.dialog
      .open<CompagnieDialogComponent, CompagnieDialogData, BolCompagnieModel>(CompagnieDialogComponent, {
        data: {compagnie: null},
        width: 'min(720px, 94vw)',
        maxWidth: '94vw',
        ariaLabelledBy: 'otd-titre',
        autoFocus: '.otd-nom input',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((creee) => {
        if (creee) {
          this.charger();
        }
      });
  }

  /** Les chapitres du scénario d'une partie, pour « Changer de chapitre » : le courant est en gras, ceux qu'elle a joués sont marqués. Ses
   * pastilles sont dans le même ordre (un one shot n'en a pas, et n'a qu'un chapitre, le courant). */
  protected chapitresDe(partie: AccueilPartie): {id: string; libelle: string; courant: boolean; joue: boolean}[] {
    return chapitresDuScenario(partie.scenarioId, this.data()?.scenarios ?? []).map((c, i) => ({
      id: c.id,
      libelle: libelleDeChapitre(c.numero, c.titre),
      courant: c.id === partie.scenarioId,
      joue: partie.reperes[i]?.etat === 'joue',
    }));
  }

  /** Passe la partie sur ce chapitre (de son scénario, ou le premier scénario d'une partie improvisée), puis relit l'accueil. */
  protected changerChapitre(partie: AccueilPartie, chapitreId: string): void {
    if (chapitreId === partie.scenarioId) {
      return;
    }
    this.fightSessionService
      .changerChapitre(partie.id, chapitreId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.charger(),
        error: (error: unknown) =>
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de changer le chapitre de la partie.'), 'OK', {duration: 6000}),
      });
  }

  /** « Supprimer la partie » : après confirmation, elle disparaît pour de bon, puis l'accueil se relit. */
  protected supprimer(partie: AccueilPartie): void {
    confirmDialog(
      this.dialog,
      {title: 'Supprimer la partie', message: `Supprimer « ${partie.nom} » ? Cette action est irréversible.`, confirmLabel: 'Supprimer'},
      {width: '420px'},
    ).subscribe((confirme) => {
      if (!confirme) {
        return;
      }
      this.fightSessionService
        .delete(partie.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.charger(),
          error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de supprimer la partie.'), 'OK', {duration: 6000}),
        });
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
