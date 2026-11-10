import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {applyEach, form, FormField, maxLength, required} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {forkJoin, map, Observable, switchMap, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {HasPendingChanges} from '../../../core/models/pending-changes-guard.model';
import {readReturnUrl} from '../../../core/return-url.util';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {AttitudeChoixComponent} from '../../shared/attitude/attitude-choix';
import {confirmLeaveUnsaved} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {DwFormHeaderComponent} from '../../../shared/dw-form-header/dw-form-header';
import {DwValueStepperComponent} from '../../../shared/value-stepper/value-stepper';
import {CombatantAttitude, CombatCamp} from '../../models/bol-fight-session.model';
import {BolSceneDistributionSaisie, BolSceneModel} from '../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../models/combat-selection.model';
import {BolCatalogService} from '../../services/bol-catalog.service';
import {BolScenarioService} from '../../services/bol-scenario.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {SCENE_TITLE_MAX} from '../../session/play/scene-list/scene.util';
import {METEOS, MOMENTS} from '../../session/play/theatre/theatre.util';
import {titreDeChapitre} from '../../session/scenario.util';
import {openPersonnagesDialog} from './personnages-dialog/personnages-dialog';
import {memesPersonnages, personnagesDe, personnagesVus, sceneChanges, sceneFormValue} from './scene-form.util';

const PISTES_MAX = 8;
const LECTURE_MAX = 5000;
const JEU_MAX = 10000;
/** Au plus, les exemplaires d'une créature ou d'un démon (`BolSceneDistribution::QTY_MAX`). */
const QTY_MAX = 30;
/** Au plus, les personnages d'une scène (`BolSceneDistribution::SAISIE_MAX`). */
const PERSONNAGES_MAX = 60;
/** Où revenir sans adresse de retour : la bibliothèque des scénarios. */
const RETOUR_PAR_DEFAUT = '/library/scenarios';

/**
 * « Préparer la scène », sur sa propre page (`/create/scene/:id`, ou `/create/scene?chapitre=…` pour une nouvelle) : son décor (région,
 * lieu, moment, météo, danger) et ses pistes, son texte (à lire aux joueurs, en jeu, secret du MJ), et ses personnages (PNJ, créatures,
 * démons du catalogue et du compte, avec leur nombre, leur camp et leur attitude au chargement). Enregistre, puis revient d'où l'on
 * venait (`returnUrl` : la table, la bibliothèque des scénarios). L'illustration d'une scène n'y est pas : elle reste telle qu'elle est.
 */
@Component({
  selector: 'bol-scene-form-page',
  imports: [
    AttitudeChoixComponent,
    AvatarFallbackDirective,
    DwFormHeaderComponent,
    DwValueStepperComponent,
    FormField,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './scene-form-page.html',
  styleUrl: './scene-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneFormPageComponent implements HasPendingChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sceneService = inject(BolSceneService);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly selection = inject(CombatSelectionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly moments = MOMENTS;
  protected readonly meteos = METEOS;
  protected readonly dangers = [1, 2, 3, 4];
  protected readonly lectureMax = LECTURE_MAX;
  protected readonly pistesMax = PISTES_MAX;
  protected readonly qtyMax = QTY_MAX;
  protected readonly personnagesMax = PERSONNAGES_MAX;

  private readonly returnUrl = readReturnUrl() ?? RETOUR_PAR_DEFAUT;
  /** La scène à préparer ; pour une nouvelle, celle créée au premier enregistrement (un second essai, après un échec, la reprend). */
  private readonly sceneId = signal(this.route.snapshot.paramMap.get('id'));
  /** Pour une nouvelle scène : le chapitre où elle naît, à la suite des autres. */
  private readonly chapitreId = this.route.snapshot.queryParamMap.get('chapitre');
  protected readonly nouvelle = this.sceneId() === null;

  protected readonly regions = toSignal(
    inject(BolCatalogService)
      .regions()
      .pipe(map((regions) => [...regions].sort((left, right) => left.region.localeCompare(right.region, 'fr')))),
    {initialValue: []},
  );

  /** La scène lue (null pour une nouvelle, ou tant qu'elle n'est pas lue) et les autres scènes de son chapitre, où mènent les pistes. */
  private readonly scene = signal<BolSceneModel | null>(null);
  protected readonly siblings = signal<readonly BolSceneModel[]>([]);
  private readonly chapitreTitre = signal<string | null>(null);
  /** Le scénario (`BolSaga`) du chapitre de la scène : « Ajouter des personnages » propose d'abord ses fiches. */
  private readonly sagaId = signal<string | null>(null);
  protected readonly loading = signal(!this.nouvelle);

  private readonly value = signal(sceneFormValue(null));
  private readonly initial = signal(sceneFormValue(null));
  protected readonly sceneForm = form(this.value, (path) => {
    required(path.titre);
    maxLength(path.titre, SCENE_TITLE_MAX);
    maxLength(path.lieu, 120);
    maxLength(path.lecture, LECTURE_MAX);
    maxLength(path.jeu, JEU_MAX);
    maxLength(path.notes, 10000);
    applyEach(path.pistes, (piste) => maxLength(piste.texte, 200));
  });

  /** Les personnages de la scène, dans l'ordre où ils entrent ; à part du formulaire, réglés ligne par ligne. */
  private readonly personnages = signal<BolSceneDistributionSaisie[]>([]);
  private readonly personnagesInitiaux = signal<BolSceneDistributionSaisie[]>([]);
  protected readonly personnagesAffiches = computed(() =>
    personnagesVus(this.personnages(), this.selection.catalog(), !this.selection.loading() && !this.selection.loadFailed()),
  );
  protected readonly nombreDePersonnages = computed(() => this.personnages().length);

  protected readonly valid = computed(() => this.sceneForm().valid());
  protected readonly lectureLength = computed(() => this.value().lecture.length);
  protected readonly pisteCount = computed(() => this.value().pistes.length);
  protected readonly busy = signal(false);
  private readonly enregistree = signal(false);
  protected readonly dirty = computed(
    () =>
      JSON.stringify(this.value()) !== JSON.stringify(this.initial()) || !memesPersonnages(this.personnages(), this.personnagesInitiaux()),
  );

  protected readonly titre = computed(() => (this.nouvelle ? 'Nouvelle scène' : this.scene()?.titre || 'Préparer la scène'));
  protected readonly surtitre = computed(() => this.chapitreTitre() ?? 'Préparer la scène');
  protected readonly retourLabel = this.returnUrl.startsWith('/session/') ? 'Retour à la table' : 'Retour aux scénarios';

  constructor() {
    this.selection.loadCatalog();
    this.charger();
  }

  canLeave(): boolean | Observable<boolean> {
    if (this.enregistree() || !this.dirty()) {
      return true;
    }
    return confirmLeaveUnsaved(this.dialog, 'Cette scène a des changements non sauvegardés. Quitter sans enregistrer ?');
  }

  protected retour(): void {
    void this.router.navigateByUrl(this.returnUrl);
  }

  protected setAttitude(index: number, attitude: CombatantAttitude | null): void {
    this.modifier(index, {attitude});
  }

  protected setCamp(index: number, change: MatButtonToggleChange): void {
    this.modifier(index, {camp: change.value as CombatCamp});
  }

  protected setQty(index: number, qty: number): void {
    this.modifier(index, {qty: Math.min(QTY_MAX, Math.max(1, qty))});
  }

  protected retirer(index: number): void {
    this.personnages.update((liste) => liste.filter((_, position) => position !== index));
  }

  /** « Ajouter des personnages » : le dialogue des fiches, filtrées d'abord sur le scénario de la scène ; celles choisies entrent. */
  protected choisirDesPersonnages(): void {
    const pnjsEnScene = new Set(this.personnages().filter((p) => p.kind === 'pnj').map((p) => `pnj:${p.source_id}`));
    const placesLibres = PERSONNAGES_MAX - this.personnages().length;
    openPersonnagesDialog(this.dialog, {scenarioId: this.sagaId(), pnjsEnScene, placesLibres}).subscribe((fiches) => {
      for (const fiche of fiches ?? []) {
        this.ajouter(fiche);
      }
    });
  }

  /** Une fiche entre dans la scène, en adversaire, sans attitude ; une créature ou un démon déjà là gagne un exemplaire plutôt qu'une
   * ligne de plus, un PNJ déjà là n'entre pas deux fois. */
  private ajouter(fiche: CombatCatalogEntry): void {
    if (fiche.kind === 'hero') {
      return;
    }
    const kind = fiche.kind;
    const sourceId = String(fiche.sourceId);
    const deja = this.personnages().findIndex((p) => p.kind === kind && p.source_id === sourceId);
    if (deja >= 0 && kind !== 'pnj') {
      this.setQty(deja, this.personnages()[deja].qty + 1);
      return;
    }
    if (deja >= 0 || this.personnages().length >= PERSONNAGES_MAX) {
      return;
    }
    this.personnages.update((liste) => [...liste, {kind, source_id: sourceId, qty: 1, camp: 'adversaires', attitude: null}]);
  }

  protected addPiste(): void {
    if (this.pisteCount() < PISTES_MAX) {
      this.value.update((value) => ({...value, pistes: [...value.pistes, {texte: '', scene_id: null}]}));
    }
  }

  protected removePiste(index: number): void {
    this.value.update((value) => ({...value, pistes: value.pistes.filter((_, position) => position !== index)}));
  }

  /** `(submit)` natif : enregistre la scène (créée d'abord dans son chapitre si elle est nouvelle) et ses personnages, puis revient. */
  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.valid() || this.busy() || this.loading()) {
      return;
    }
    this.busy.set(true);
    const changes = {...sceneChanges(this.value()), distribution: this.personnages()};
    const sceneId = this.sceneId();
    const enregistrement = sceneId
      ? this.sceneService.update(sceneId, changes)
      : this.sceneService.create(this.value().titre.trim(), this.chapitreId, null).pipe(
          tap((scene) => this.sceneId.set(scene.id)),
          switchMap((scene) => this.sceneService.update(scene.id, changes)),
        );
    enregistrement.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.enregistree.set(true);
        this.retour();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(extractApiErrorMessage(error, "Impossible d'enregistrer la scène."), 'Fermer', {duration: 5000});
      },
    });
  }

  private modifier(index: number, changement: Partial<BolSceneDistributionSaisie>): void {
    this.personnages.update((liste) => liste.map((p, position) => (position === index ? {...p, ...changement} : p)));
  }

  /** Lit la scène (ou rien pour une nouvelle), les autres scènes de son chapitre et le nom du chapitre. */
  private charger(): void {
    const sceneId = this.sceneId();
    forkJoin({scenes: this.sceneService.scenes(), chapitres: this.scenarioService.scenarios()})
      .pipe(
        map(({scenes, chapitres}) => {
          const scene = sceneId ? (scenes.find((s) => s.id === sceneId) ?? null) : null;
          const chapitreId = scene?.scenario_id ?? this.chapitreId;
          const siblings = scenes.filter((s) => s.scenario_id === chapitreId && s.id !== sceneId).sort((a, b) => a.ordre - b.ordre);
          return {scene, siblings, chapitre: chapitres.find((c) => c.id === chapitreId) ?? null};
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({scene, siblings, chapitre}) => {
          if (sceneId && !scene) {
            this.snackBar.open('Cette scène est introuvable.', 'Fermer', {duration: 5000});
            this.enregistree.set(true);
            this.retour();
            return;
          }
          this.scene.set(scene);
          this.siblings.set(siblings);
          this.chapitreTitre.set(chapitre ? titreDeChapitre(chapitre) : null);
          this.sagaId.set(chapitre?.saga?.id ?? null);
          const value = sceneFormValue(scene);
          this.value.set(value);
          this.initial.set(sceneFormValue(scene));
          this.personnages.set(personnagesDe(scene));
          this.personnagesInitiaux.set(personnagesDe(scene));
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de lire la scène.'), 'Fermer', {duration: 5000});
        },
      });
  }
}
