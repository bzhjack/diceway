import {CompagnieEquipeComponent} from '../../compagnie/equipe/compagnie-equipe';
import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage, NgTemplateOutlet} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {BolAccueilComptes, BolAccueilModel} from '../../models/bol-accueil.model';
import {BolCompagnieModel} from '../../models/bol-compagnie.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {CompagnieDialogData} from '../models/compagnie-dialog.model';
import {OpenTableData, OpenTableResultat} from '../models/open-table.model';
import {CompagnieDialogComponent} from '../new/compagnie-dialog/compagnie-dialog';
import {OpenTableDialogComponent} from '../new/open-table-dialog/open-table-dialog';
import {bandeauDePartie, depuisQuand, partiesDeLAccueil, pluriel} from './accueil.util';
import {PartieChapitreComponent} from '../partie-chapitre/partie-chapitre';

interface AccueilBibliotheque {
  /** Son illustration (`acc-biblio--<cle>`). */
  readonly cle: string;
  readonly label: string;
  readonly route: string;
  readonly compte: (comptes: BolAccueilComptes) => number;
  /** Une ligne sous le nom, quand la tuile en regroupe plusieurs. */
  readonly detail?: (comptes: BolAccueilComptes) => string;
  /** Les boutons ronds du coin de la tuile : créer une fiche, ou aller droit à l'une des bibliothèques qu'elle regroupe. */
  readonly raccourcis: readonly AccueilRaccourci[];
}

interface AccueilRaccourci {
  readonly label: string;
  /** Une icône Material, ou `sword`, l'icône SVG de l'application. */
  readonly icon: string;
  readonly route: string;
  /** L'état de la navigation : `nouveau` fait ouvrir « Nouveau scénario » à la bibliothèque des scénarios. */
  readonly etat?: Record<string, unknown>;
}

const CREER = 'add';

const BIBLIOTHEQUES: readonly AccueilBibliotheque[] = [
  {
    cle: 'heros',
    label: 'Héros',
    route: '/library/heroes',
    compte: (c) => c.heros,
    raccourcis: [{label: 'Créer un héros', icon: CREER, route: '/create/hero'}],
  },
  {
    cle: 'pnjs',
    label: 'PNJ',
    route: '/library/pnjs',
    compte: (c) => c.pnjs,
    raccourcis: [{label: 'Créer un PNJ', icon: CREER, route: '/create/pnj'}],
  },
  {
    cle: 'bestiaire',
    label: 'Bestiaire',
    route: '/bestiaire',
    compte: (c) => c.creatures + c.demons,
    detail: (c) => `${pluriel(c.creatures, 'créature')} · ${pluriel(c.demons, 'démon')}`,
    raccourcis: [
      {label: 'Créatures', icon: 'pets', route: '/library/creatures'},
      {label: 'Démons', icon: 'bolt', route: '/library/demons'},
    ],
  },
  {
    cle: 'intendance',
    label: 'Intendance',
    route: '/intendance',
    compte: (c) => c.armes + c.armures,
    detail: (c) => `${pluriel(c.armes, 'arme')} · ${pluriel(c.armures, 'armure')}`,
    raccourcis: [
      {label: 'Armes', icon: 'sword', route: '/library/weapons'},
      {label: 'Armures', icon: 'shield', route: '/library/armors'},
    ],
  },
  {
    cle: 'scenarios',
    label: 'Scénarios',
    route: '/library/scenarios',
    compte: (c) => c.scenarios,
    raccourcis: [{label: 'Nouveau scénario', icon: CREER, route: '/library/scenarios', etat: {nouveau: true}}],
  },
  {
    cle: 'compagnies',
    label: 'Compagnies',
    route: '/library/companies',
    compte: (c) => c.compagnies,
    raccourcis: [],
  },
];

/** Les parties que la colonne montre, celle du bandeau comprise ; les suivantes sont dans « Toutes les parties ». */
const PARTIES_RECENTES = 5;

/** Accueil, sur `/` : en grand, la dernière partie jouée (son scénario, sa compagnie, ses chapitres et les scènes du chapitre en cours, ses
 * héros) à reprendre, et à côté les parties récentes à reprendre, elle en tête (leurs actions sont dans « Mes parties ») ; puis les
 * bibliothèques avec leur nombre de fiches et de quoi en créer. Le tout tient sur l'écran de référence (1440 × 704). */
@Component({
  selector: 'bol-accueil-page',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink, MatButtonModule, MatIconModule, MatTooltip, AccountMenuComponent, CompagnieEquipeComponent, DwCompactBarComponent, PartieChapitreComponent],
  templateUrl: './accueil-page.html',
  styleUrl: './accueil-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccueilPageComponent {
  private readonly accueilService = inject(BolAccueilService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly data = signal<BolAccueilModel | null>(null);
  protected readonly error = signal(false);
  /** L'accueil n'a pas encore répondu : on ne sait pas encore s'il y a des parties. */
  protected readonly chargement = computed(() => this.data() === null && !this.error());

  protected readonly parties = computed(() => {
    const data = this.data();
    return data ? partiesDeLAccueil(data) : [];
  });

  /** La dernière partie jouée, pour le bandeau ; null sans partie. */
  private readonly derniereLue = computed(() => {
    const data = this.data();
    return data?.parties.find((partie) => partie.id === data.derniere) ?? null;
  });

  protected readonly bandeau = computed(() => {
    const derniere = this.derniereLue();
    return derniere ? bandeauDePartie(derniere, this.data()?.scenarios ?? []) : null;
  });

  /** Sa carte : son scénario, ses chapitres en pastilles, ce que son menu propose. */
  protected readonly derniere = computed(() => this.parties().find((partie) => partie.derniere) ?? null);

  /** « hier », « il y a 3 jours »… ; null sans date. */
  protected readonly jouee = computed(() => depuisQuand(this.derniereLue()?.jouee_le ?? null, new Date()));

  /** Après quelle pastille vient la barre des scènes : le chapitre en cours, sinon le dernier (-1 sans pastille : la barre seule). */
  protected readonly placeDesScenes = computed(() => {
    const reperes = this.derniere()?.reperes ?? [];
    const enCours = reperes.findIndex((repere) => repere.etat === 'en-cours');
    return enCours >= 0 ? enCours : reperes.length - 1;
  });

  /** Les parties, de la plus récemment jouée (celle du bandeau) à la plus ancienne, les premières seulement. */
  protected readonly recentes = computed(() => {
    const parties = this.parties();
    return [...parties.filter((partie) => partie.derniere), ...parties.filter((partie) => !partie.derniere)].slice(0, PARTIES_RECENTES);
  });

  /** Pas de partie sans compagnie : « + Partie » attend qu'il y en ait une. */
  protected readonly aDesCompagnies = computed(() => (this.data()?.compagnies.length ?? 0) > 0);

  protected readonly bibliotheques = computed(() => {
    const comptes = this.data()?.comptes ?? null;
    return BIBLIOTHEQUES.map((bibliotheque) => ({
      cle: bibliotheque.cle,
      label: bibliotheque.label,
      route: bibliotheque.route,
      compte: comptes ? bibliotheque.compte(comptes) : null,
      detail: comptes && bibliotheque.detail ? bibliotheque.detail(comptes) : null,
      raccourcis: bibliotheque.raccourcis,
    }));
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
      const nom = params.get('nom') ?? '';
      void this.router.navigate([], {queryParams: {table: null, scenario: null, nom: null}, queryParamsHandling: 'merge', replaceUrl: true});
      if (table === 'compagnie') {
        this.nouvelleCompagnie({reprendreLaSelection: true, nomEnCours: nom});
      } else {
        this.nouvellePartie(scenario);
      }
    });
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

  /** Le dialogue « Nouvelle compagnie » : un nom et des héros. Une fois créée, l'accueil se relit (« + Partie » devient possible).
   * `retour` : on revient de « Créer un héros », le nom tapé et les héros déjà choisis restent. */
  protected nouvelleCompagnie(retour?: {reprendreLaSelection: boolean; nomEnCours: string}): void {
    this.dialog
      .open<CompagnieDialogComponent, CompagnieDialogData, BolCompagnieModel>(CompagnieDialogComponent, {
        data: {compagnie: null, ...retour},
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

  /** Relit l'accueil : après une création, un changement de chapitre, une partie marquée terminée. */
  protected charger(): void {
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.error.set(false);
        },
        error: () => this.error.set(true),
      });
  }
}
