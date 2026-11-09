import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {CompagnieEquipeComponent} from '../../../compagnie/equipe/compagnie-equipe';
import {BolAccueilModel} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {chapitresDuScenario, herosCartes, marqueDeChapitre, pluriel, scenariosDuCompte} from '../../accueil/accueil.util';
import {OpenTableData, OpenTableResultat} from '../../models/open-table.model';
import {findScenario, libelleDeChapitre} from '../../scenario.util';
import {ignoresMessage} from '../../play/scene-list/scene.util';

/**
 * « Nouvelle partie », en dialogue sur l'accueil : une compagnie sur un scénario et son chapitre de départ (ou une partie improvisée), puis
 * « Créer la partie », qui mène à sa table. Tout est en vue, sans menu : les compagnies avec leurs héros à gauche, les scénarios à droite,
 * les chapitres de départ sous celui choisi. Elle prend le nom et les héros de sa compagnie. Une compagnie peut jouer plusieurs scénarios,
 * mais chacun une fois : ceux qu'elle joue déjà sont grisés, avec de quoi reprendre sa partie.
 */
@Component({
  selector: 'bol-open-table-dialog',
  imports: [CompagnieEquipeComponent, MatButtonModule, MatDialogModule, MatIconModule, RouterLink],
  templateUrl: './open-table-dialog.html',
  styleUrl: './open-table-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenTableDialogComponent {
  private readonly data = inject<OpenTableData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<OpenTableDialogComponent, OpenTableResultat>>(MatDialogRef);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly accueilService = inject(BolAccueilService);
  private readonly fightSessionService = inject(BolFightSessionService);

  protected readonly launching = signal(false);
  private readonly accueil = signal<BolAccueilModel | null>(this.data.accueil ?? null);
  /** L'accueil n'a pas encore répondu : on ne connaît ni les compagnies ni les scénarios ; la partie ne se crée pas encore. */
  protected readonly loadingAccueil = signal(!this.data.accueil);
  /** Le chapitre de départ de la future partie : celui demandé, puis celui choisi ; aucun tant que la partie est improvisée. */
  protected readonly scenarioId = signal(this.data.scenarioId);
  private readonly compagnieId = signal<string | null>(null);

  protected readonly compagnies = computed(() => this.accueil()?.compagnies ?? []);
  /** La compagnie choisie ; la seule du compte, d'office. */
  protected readonly compagnie = computed(() => {
    const compagnies = this.compagnies();
    return compagnies.find((c) => c.id === this.compagnieId()) ?? (compagnies.length === 1 ? compagnies[0] : null);
  });
  protected readonly heros = computed(() => herosCartes(this.compagnie()?.heros ?? []));
  /** Les compagnies à choisir, chacune avec ses héros (portrait ou initiale). */
  protected readonly compagniesAChoisir = computed(() =>
    this.compagnies().map((c) => {
      const heros = herosCartes(c.heros);
      return {id: c.id, nom: c.nom, heros};
    }),
  );
  /** L'accueil a répondu, et le compte n'a aucune compagnie : il faut en créer une d'abord. */
  protected readonly sansCompagnie = computed(() => this.accueil() !== null && this.compagnies().length === 0);
  /** L'accueil n'a pas répondu : on ne sait rien des compagnies. */
  protected readonly accueilPerdu = computed(() => !this.loadingAccueil() && this.accueil() === null);

  private readonly scenarios = computed(() => this.accueil()?.scenarios ?? []);
  private readonly scenario = computed(() => findScenario(this.scenarios(), this.scenarioId()));
  /** Sans chapitre de départ (ou avec un chapitre que le compte n'a pas), la partie est improvisée. */
  protected readonly improvisee = computed(() => this.scenario() === null);

  /**
   * Les scénarios à choisir, par nom : leur teinte, leur nombre de chapitres, s'il est choisi (le chapitre de départ est
   * l'un des siens) et la partie que la compagnie choisie y a déjà (on la reprend plutôt que d'en créer une autre).
   */
  protected readonly scenariosAChoisir = computed(() => {
    const courant = this.scenarioId();
    const compagnie = this.compagnie();
    const parties = compagnie ? (this.accueil()?.parties ?? []).filter((p) => p.compagnie_id === compagnie.id && p.scenario_id !== null) : [];
    return scenariosDuCompte(this.scenarios()).map((choix) => {
      const ids = new Set(choix.chapitres.map((c) => c.id));
      return {
        ...choix,
        detail: pluriel(choix.chapitres.length, 'chapitre'),
        choisi: courant !== null && ids.has(courant),
        partieId: parties.find((p) => ids.has(p.scenario_id ?? ''))?.id ?? null,
      };
    });
  });

  /** La partie que la compagnie choisie a déjà sur le scénario choisi : elle ne se crée pas deux fois. Une partie improvisée n'en empêche aucune. */
  private readonly partieExistante = computed(() => this.scenariosAChoisir().find((s) => s.choisi)?.partieId ?? null);

  protected readonly canLaunch = computed(() => this.heros().length > 0 && !this.partieExistante() && !this.launching() && !this.loadingAccueil());

  /** Les chapitres de départ du scénario choisi : leur marque (« Intro », « 1 »…), leur libellé, le choisi. Rien à choisir pour un
   * scénario d'un seul chapitre. */
  protected readonly chapitresDeDepart = computed(() => {
    const chapitres = chapitresDuScenario(this.scenarioId(), this.scenarios());
    if (chapitres.length < 2) {
      return [];
    }
    return chapitres.map((c) => ({
      id: c.id,
      marque: marqueDeChapitre(c),
      libelle: libelleDeChapitre(c.numero, c.titre),
      choisi: c.id === this.scenarioId(),
    }));
  });

  protected readonly chapitreChoisi = computed(() => this.chapitresDeDepart().find((c) => c.choisi)?.libelle ?? null);

  /** Un chapitre demandé que le compte n'a pas : le dialogue le dit, et la partie se crée sans lui. Rien tant que l'accueil n'a pas répondu. */
  protected readonly scenarioPerdu = computed(() => {
    if (!this.scenarioId() || this.loadingAccueil() || this.scenario()) {
      return null;
    }
    return this.accueil()
      ? 'Ce chapitre est introuvable : la partie sera improvisée.'
      : 'Impossible de charger le chapitre : la partie sera improvisée.';
  });

  /** La future partie en une ligne : « Les Lames · Perle du Beshaar, à partir de 3. Le tombeau d'Urzûlzalinaar ». Ses héros sont en vue,
   * sous sa compagnie. */
  protected readonly resume = computed(() => {
    const scenario = this.scenario();
    const histoire = !scenario
      ? 'Partie improvisée'
      : scenario.saga
        ? `${scenario.saga.titre}, à partir de ${libelleDeChapitre(scenario.numero, scenario.titre)}`
        : scenario.titre;
    const compagnie = this.compagnie();
    return compagnie ? `${compagnie.nom} · ${histoire}` : histoire;
  });

  constructor() {
    if (!this.data.accueil) {
      this.chargerAccueil();
    }
  }

  protected choisirCompagnie(id: string): void {
    this.compagnieId.set(id);
  }

  protected choisirChapitre(id: string): void {
    this.scenarioId.set(id);
  }

  /** Un scénario choisi : la partie part de son premier chapitre (l'introduction s'il y en a une) ; aucun : elle est improvisée. */
  protected choisirScenario(chapitres: readonly {id: string}[] | null): void {
    if (chapitres === null) {
      this.scenarioId.set(null);
    } else if (chapitres.length) {
      this.scenarioId.set(chapitres[0].id);
    }
  }

  /** Sans compagnie : l'accueil ouvre « Nouvelle compagnie » à la place de ce dialogue. */
  protected creerUneCompagnie(): void {
    this.dialogRef.close('compagnie');
  }

  /** « Créer la partie » : elle se crée, puis mène à sa table. */
  protected creer(): void {
    const compagnie = this.compagnie();
    if (!compagnie || !this.canLaunch()) {
      return;
    }
    this.launching.set(true);
    this.fightSessionService
      .creerPartie(compagnie.id, this.scenario()?.id ?? null)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.launching.set(false);
          this.dialogRef.close(true);
          const ignores = ignoresMessage(session.figurants_ignores);
          if (ignores) {
            this.snackBar.open(ignores, 'OK', {duration: 6000});
          }
          if (session.id) {
            void this.router.navigate(['/session', session.id, 'play']);
          }
        },
        error: (error: unknown) => {
          this.launching.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de créer la partie.'), 'OK', {duration: 6000});
        },
      });
  }

  private chargerAccueil(): void {
    this.loadingAccueil.set(true);
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.accueil.set(data);
          this.loadingAccueil.set(false);
        },
        // Sans l'accueil, on ne connaît aucune compagnie : le dialogue le dit (`accueilPerdu`), sans prétendre que le compte n'en a pas.
        error: () => this.loadingAccueil.set(false),
      });
  }
}
