import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolAccueilModel} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {chapitresDuScenario, herosCartes, scenariosDuCompte, situerScenario, teinteDeScenario} from '../../accueil/accueil.util';
import {OpenTableData, OpenTableResultat} from '../../models/open-table.model';
import {findScenario, libelleDeChapitre} from '../../scenario.util';
import {enumerer} from '../open-table.util';

/**
 * « Nouvelle partie », en dialogue sur l'accueil : une compagnie sur un scénario et son chapitre de départ (ou une partie improvisée), puis
 * « Créer la partie », qui mène à sa table. Elle prend le nom et les héros de sa compagnie. Une compagnie peut jouer plusieurs scénarios,
 * mais chacun une fois : sur un scénario qu'elle joue déjà, le dialogue propose de reprendre sa partie.
 */
@Component({
  selector: 'bol-open-table-dialog',
  imports: [AvatarFallbackDirective, MatButtonModule, MatDialogModule, MatIconModule, MatMenuModule, RouterLink],
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
  /** Le chapitre de départ de la future partie : celui demandé ; « Improviser » le retire. */
  protected readonly scenarioId = signal(this.data.scenarioId);
  private readonly compagnieId = signal<string | null>(null);

  protected readonly compagnies = computed(() => this.accueil()?.compagnies ?? []);
  /** La compagnie choisie ; la seule du compte, d'office. */
  protected readonly compagnie = computed(() => {
    const compagnies = this.compagnies();
    return compagnies.find((c) => c.id === this.compagnieId()) ?? (compagnies.length === 1 ? compagnies[0] : null);
  });
  protected readonly heros = computed(() => herosCartes(this.compagnie()?.heros ?? []));
  /** L'accueil a répondu, et le compte n'a aucune compagnie : il faut en créer une d'abord. */
  protected readonly sansCompagnie = computed(() => this.accueil() !== null && this.compagnies().length === 0);
  /** L'accueil n'a pas répondu : on ne sait rien des compagnies. */
  protected readonly accueilPerdu = computed(() => !this.loadingAccueil() && this.accueil() === null);

  private readonly scenarios = computed(() => this.accueil()?.scenarios ?? []);
  private readonly scenario = computed(() => findScenario(this.scenarios(), this.scenarioId()));

  /** Le chapitre de départ, placé dans son scénario, avec la teinte du scénario (celle de ses parties sur l'accueil). */
  protected readonly chapitre = computed(() => {
    const scenario = this.scenario();
    return scenario ? {...situerScenario(scenario, this.scenarios()), teinte: teinteDeScenario(scenario.id, this.scenarios())} : null;
  });

  /** La partie que la compagnie choisie a déjà sur ce scénario : on la reprend plutôt que d'en créer une autre. Une partie improvisée n'en
   * empêche aucune. */
  protected readonly partieExistante = computed(() => {
    const compagnie = this.compagnie();
    const chapitres = new Set(chapitresDuScenario(this.scenario()?.id ?? null, this.scenarios()).map((c) => c.id));
    if (!compagnie || !chapitres.size) {
      return null;
    }
    const partie = this.accueil()?.parties.find((p) => p.compagnie_id === compagnie.id && p.scenario_id !== null && chapitres.has(p.scenario_id));
    return partie ? {id: partie.id, texte: `${compagnie.nom} joue déjà ${this.chapitre()?.saga ?? this.chapitre()?.nom}.`} : null;
  });

  protected readonly canLaunch = computed(() => this.heros().length > 0 && !this.partieExistante() && !this.launching() && !this.loadingAccueil());

  /** « Choisir un scénario » : les sagas, puis les one shots ; celui du chapitre choisi est en gras. */
  protected readonly scenariosAChoisir = computed(() => {
    const courant = new Set(chapitresDuScenario(this.scenarioId(), this.scenarios()).map((c) => c.id));
    return scenariosDuCompte(this.scenarios()).map((choix) => ({...choix, choisi: choix.chapitres.some((c) => courant.has(c.id))}));
  });

  /** « Chapitre de départ » : les chapitres du scénario choisi, rien pour un one shot ; le choisi est en gras. */
  protected readonly chapitresDeDepart = computed(() => {
    if (!this.scenario()?.saga) {
      return [];
    }
    return chapitresDuScenario(this.scenarioId(), this.scenarios()).map((c) => ({
      id: c.id,
      libelle: libelleDeChapitre(c.numero, c.titre),
      choisi: c.id === this.scenarioId(),
    }));
  });

  /** Un chapitre demandé que le compte n'a pas : le dialogue le dit, et la partie se crée sans lui. Rien tant que l'accueil n'a pas répondu. */
  protected readonly scenarioPerdu = computed(() => {
    if (!this.scenarioId() || this.loadingAccueil() || this.scenario()) {
      return null;
    }
    return this.accueil()
      ? 'Ce chapitre est introuvable : la partie sera improvisée.'
      : 'Impossible de charger le chapitre : la partie sera improvisée.';
  });

  /** La future partie en une ligne : « Les Lames · Tolometh, avec Axel, jadawin et jean ». */
  protected readonly resume = computed(() => {
    const compagnie = this.compagnie();
    const histoire = this.chapitre()?.nom ?? 'Partie improvisée';
    const noms = this.heros().map((h) => h.nom);
    if (!compagnie) {
      return histoire;
    }
    return noms.length ? `${compagnie.nom} · ${histoire}, avec ${enumerer(noms)}` : `${compagnie.nom} · ${histoire}`;
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

  /** Un scénario choisi : la partie part de son premier chapitre (l'introduction s'il y en a une). */
  protected choisirScenario(chapitres: readonly {id: string}[]): void {
    if (chapitres.length) {
      this.scenarioId.set(chapitres[0].id);
    }
  }

  protected improviser(): void {
    this.scenarioId.set(null);
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
