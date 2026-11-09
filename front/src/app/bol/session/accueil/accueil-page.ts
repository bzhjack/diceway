import {CompagnieEquipeComponent} from '../../compagnie/equipe/compagnie-equipe';
import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage, NgTemplateOutlet} from '@angular/common';
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
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {AccueilPartie, AccueilScenarioChoix} from '../models/accueil.model';
import {CompagnieDialogData} from '../models/compagnie-dialog.model';
import {OpenTableData, OpenTableResultat} from '../models/open-table.model';
import {CompagnieDialogComponent} from '../new/compagnie-dialog/compagnie-dialog';
import {OpenTableDialogComponent} from '../new/open-table-dialog/open-table-dialog';
import {bandeauDePartie, chapitresDuScenario, depuisQuand, partiesDeLAccueil, pluriel, scenariosLibresPour} from './accueil.util';
import {ignoresMessage} from '../play/scene-list/scene.util';
import {libelleDeChapitre} from '../scenario.util';

interface AccueilBibliotheque {
  /** Son illustration (`acc-biblio--<cle>`). */
  readonly cle: string;
  readonly label: string;
  readonly route: string;
  readonly compte: (comptes: BolAccueilComptes) => number;
  /** Une ligne sous le nom, quand la tuile en regroupe plusieurs. */
  readonly detail?: (comptes: BolAccueilComptes) => string;
}

const BIBLIOTHEQUES: readonly AccueilBibliotheque[] = [
  {cle: 'heros', label: 'Héros', route: '/library/heroes', compte: (c) => c.heros},
  {cle: 'pnjs', label: 'PNJ', route: '/library/pnjs', compte: (c) => c.pnjs},
  {
    cle: 'bestiaire',
    label: 'Bestiaire',
    route: '/bestiaire',
    compte: (c) => c.creatures + c.demons,
    detail: (c) => `${pluriel(c.creatures, 'créature')} · ${pluriel(c.demons, 'démon')}`,
  },
  {
    cle: 'intendance',
    label: 'Intendance',
    route: '/intendance',
    compte: (c) => c.armes + c.armures,
    detail: (c) => `${pluriel(c.armes, 'arme')} · ${pluriel(c.armures, 'armure')}`,
  },
  {cle: 'scenarios', label: 'Scénarios', route: '/library/scenarios', compte: (c) => c.scenarios},
  {cle: 'compagnies', label: 'Compagnies', route: '/library/companies', compte: (c) => c.compagnies},
];

/** Les autres parties que la colonne du bandeau montre ; les suivantes sont dans « Toutes les parties ». */
const AUTRES_PARTIES = 4;

/** Accueil, sur `/` : en grand, la dernière partie jouée (son scénario, sa compagnie, ses chapitres et les scènes du chapitre en cours, ses
 * héros) à reprendre, et à côté les autres parties récentes (de quoi les reprendre, changer de chapitre ou les supprimer) ; puis les
 * bibliothèques avec leur nombre de fiches et de quoi en créer. Le tout tient sur l'écran de référence (1440 × 704). */
@Component({
  selector: 'bol-accueil-page',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink, MatButtonModule, MatIconModule, MatMenuModule, MatTooltip, AccountMenuComponent, CompagnieEquipeComponent, DwCompactBarComponent],
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

  /** Les autres parties, de la plus récemment jouée à la plus ancienne, les premières seulement. */
  protected readonly autres = computed(() => this.parties().filter((partie) => !partie.derniere).slice(0, AUTRES_PARTIES));

  /** Pas de partie sans compagnie : « + Partie » attend qu'il y en ait une. */
  protected readonly aDesCompagnies = computed(() => (this.data()?.compagnies.length ?? 0) > 0);

  /** « Choisir un scénario » d'une partie improvisée : ceux que sa compagnie ne joue pas déjà. */
  protected scenariosDe(partie: AccueilPartie): AccueilScenarioChoix[] {
    const data = this.data();
    return data ? scenariosLibresPour(partie.id, data) : [];
  }

  protected readonly bibliotheques = computed(() => {
    const comptes = this.data()?.comptes ?? null;
    return BIBLIOTHEQUES.map((bibliotheque) => ({
      cle: bibliotheque.cle,
      label: bibliotheque.label,
      route: bibliotheque.route,
      compte: comptes ? bibliotheque.compte(comptes) : null,
      detail: comptes && bibliotheque.detail ? bibliotheque.detail(comptes) : null,
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

  /** Les chapitres du scénario d'une partie, pour « Changer de chapitre » : le courant est en gras, ceux qu'elle a joués sont marqués. Ses
   * pastilles sont dans le même ordre. */
  protected chapitresDe(partie: AccueilPartie): {id: string; libelle: string; courant: boolean; joue: boolean}[] {
    return chapitresDuScenario(partie.scenarioId, this.data()?.scenarios ?? []).map((c, i) => ({
      id: c.id,
      libelle: libelleDeChapitre(c.numero, c.titre),
      courant: c.id === partie.scenarioId,
      joue: partie.reperes[i]?.etat === 'joue',
    }));
  }

  /** Passe la partie sur ce chapitre (de son scénario, ou le premier scénario d'une partie improvisée), puis relit l'accueil. Si des
   * figurants partiraient, le MJ confirme d'abord : ils ne reviennent pas. */
  protected changerChapitre(partie: AccueilPartie, chapitreId: string): void {
    if (chapitreId === partie.scenarioId) {
      return;
    }
    const n = partie.figurantsARetirer;
    if (n === 0) {
      this.appliquerChapitre(partie, chapitreId);
      return;
    }
    confirmDialog(
      this.dialog,
      {
        title: 'Changer de chapitre',
        message: `La table passe à la première scène de ce chapitre : ${n > 1 ? `ses ${n} figurants partent, avec leurs blessures` : 'son figurant part, avec ses blessures'}. Les héros et leurs alliés restent.`,
        confirmLabel: 'Changer de chapitre',
      },
      {width: '420px'},
    ).subscribe((confirme) => {
      if (confirme) {
        this.appliquerChapitre(partie, chapitreId);
      }
    });
  }

  private appliquerChapitre(partie: AccueilPartie, chapitreId: string): void {
    this.fightSessionService
      .changerChapitre(partie.id, chapitreId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.charger();
          const ignores = ignoresMessage(session.figurants_ignores);
          if (ignores) {
            this.snackBar.open(ignores, 'OK', {duration: 6000});
          }
        },
        error: (error: unknown) =>
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de changer le chapitre de la partie.'), 'OK', {duration: 6000}),
      });
  }

  /** Le MJ dit que la partie a fini son scénario, ou se ravise ; l'accueil se relit. Pas de confirmation : ça se défait d'un clic. */
  protected marquerTermine(partie: AccueilPartie, termine: boolean): void {
    this.fightSessionService
      .marquerScenarioTermine(partie.id, termine)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.charger(),
        error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de marquer le scénario.'), 'OK', {duration: 6000}),
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
        next: (data) => {
          this.data.set(data);
          this.error.set(false);
        },
        error: () => this.error.set(true),
      });
  }
}
