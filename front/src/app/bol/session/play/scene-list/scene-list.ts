import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {forkJoin, Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';
import {confirmDialog} from '../../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {promptDialog} from '../../../../shared/dw-prompt-dialog/dw-prompt-dialog';
import {BolSceneModel, BolSceneScenarioRef} from '../../../models/bol-scene.model';
import {BolScenarioService} from '../../../services/bol-scenario.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {SceneActionsService} from '../../scene-actions.service';
import {
  distributionSummary,
  moveScene,
  NO_SCENARIO,
  normalizeTitre,
  SCENE_TITLE_MAX,
  scenesOf,
} from './scene.util';

/** Onglet « Scènes » de la réserve : scènes rangées par scénario, création à partir de la table,
 * chargement sur la table. Parle directement aux services ; signale à la page (`changed`) chaque
 * opération qui a modifié la session, pour qu'elle la recharge. */
@Component({
  selector: 'bol-scene-list',
  imports: [
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    DwCollapsibleRowComponent,
  ],
  templateUrl: './scene-list.html',
  styleUrl: './scene-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneListComponent {
  private readonly sceneService = inject(BolSceneService);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly sceneActions = inject(SceneActionsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  /** Scène courante de la session, marquée dans la liste. */
  readonly currentSceneId = input<string | null>(null);
  /** Nombre de PNJ / créatures / démons sur la table : décide si le chargement demande « Remplacer ou Ajouter ». */
  readonly nonHeroCount = input(0);
  /** La session a été modifiée (scène chargée, ou scène courante changée) : la page la recharge. */
  readonly changed = output<void>();

  protected readonly noScenario = NO_SCENARIO;

  protected readonly loading = signal(true);
  /** Une opération réseau est en cours : les actions sont désactivées. */
  protected readonly busy = signal(false);
  private readonly scenes = signal<readonly BolSceneModel[]>([]);
  private readonly scenarios = signal<readonly BolSceneScenarioRef[]>([]);
  /** Scénario affiché — `null` = « Sans scénario ». */
  protected readonly selectedScenario = signal<string | null>(null);
  protected readonly expandedId = signal<string | null>(null);

  protected readonly sortedScenarios = computed(() =>
    [...this.scenarios()].sort((left, right) => left.titre.localeCompare(right.titre, 'fr')),
  );

  private readonly knownScenarioIds = computed(() => new Set(this.scenarios().map((s) => s.id)));

  protected readonly visibleScenes = computed(() =>
    scenesOf(this.scenes(), this.selectedScenario(), this.knownScenarioIds()),
  );

  constructor() {
    forkJoin({scenes: this.sceneService.scenes(), scenarios: this.scenarioService.scenarios()}).subscribe({
      next: ({scenes, scenarios}) => {
        this.scenes.set(scenes);
        this.scenarios.set(
          scenarios
            .filter((s): s is typeof s & {id: string} => !!s.id)
            .map((s) => ({id: s.id, titre: s.titre})),
        );
        // À l'ouverture : le scénario de la scène courante de la session, sinon « Sans scénario ».
        const current = scenes.find((s) => s.id === this.currentSceneId());
        const scenarioId = current?.scenario_id ?? null;
        this.selectedScenario.set(scenarioId && this.knownScenarioIds().has(scenarioId) ? scenarioId : null);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.fail(error, 'Impossible de charger les scènes.');
      },
    });

    // La scène courante de la session peut avoir été créée hors de cette liste (barre de commande) :
    // si elle n'y figure pas, la liste est rechargée.
    effect(() => {
      const currentId = this.currentSceneId();
      if (currentId && !this.loading() && !this.scenes().some((scene) => scene.id === currentId)) {
        this.sceneService.scenes().subscribe((scenes) => {
          // Évite une boucle si la scène n'existe vraiment plus : on ne remplace que si elle est revenue.
          if (scenes.some((scene) => scene.id === currentId)) {
            this.scenes.set(scenes);
          }
        });
      }
    });
  }

  protected summary(scene: BolSceneModel): string {
    return distributionSummary(scene.distribution);
  }

  protected selectScenario(change: MatSelectChange): void {
    this.selectedScenario.set(change.value === NO_SCENARIO ? null : (change.value as string));
    this.expandedId.set(null);
  }

  /** Une ligne dépliée n'est pas déplaçable à la souris (cf. `cdkDragDisabled` dans le template) :
   * sélectionner du texte dans ses notes ne doit pas déclencher un glisser-déposer. */
  protected toggle(scene: BolSceneModel): void {
    this.expandedId.update((id) => (id === scene.id ? null : scene.id));
  }

  protected newScenario(): void {
    promptDialog(this.dialog, {
      title: 'Nouveau scénario',
      label: 'Titre du scénario',
      maxLength: SCENE_TITLE_MAX,
      confirmLabel: 'Créer',
    }).subscribe((raw) => {
      const titre = normalizeTitre(raw);
      if (!titre) {
        return;
      }
      this.run(this.scenarioService.create({titre}), 'Impossible de créer le scénario.', (scenario) => {
        if (scenario.id) {
          this.scenarios.update((list) => [...list, {id: scenario.id!, titre: scenario.titre}]);
          this.selectedScenario.set(scenario.id);
          this.expandedId.set(null);
        }
      });
    });
  }

  /** « Enregistrer la table comme scène » : la scène est créée dans le scénario sélectionné et
   * devient la scène courante de la session. */
  protected saveTable(): void {
    this.run(
      this.sceneActions.saveTable(this.sessionId(), this.selectedScenario()),
      "Impossible d'enregistrer la scène.",
      (scene) => {
        if (scene) {
          this.scenes.update((list) => [...list, scene]);
          this.changed.emit();
        }
      },
    );
  }

  protected load(scene: BolSceneModel): void {
    this.run(
      this.sceneActions.load(this.sessionId(), scene, this.nonHeroCount()),
      'Impossible de charger la scène.',
      (result) => {
        if (result) {
          this.changed.emit();
        }
      },
    );
  }

  protected rename(scene: BolSceneModel): void {
    promptDialog(this.dialog, {
      title: 'Renommer la scène',
      label: 'Titre de la scène',
      value: scene.titre,
      maxLength: SCENE_TITLE_MAX,
      confirmLabel: 'Renommer',
    }).subscribe((raw) => {
      const titre = normalizeTitre(raw);
      if (!titre || titre === scene.titre) {
        return;
      }
      this.run(this.sceneService.update(scene.id, {titre}), 'Impossible de renommer la scène.', (updated) => {
        this.replaceScene(updated);
        // Le titre de la scène courante est affiché dans la barre du haut.
        if (scene.id === this.currentSceneId()) {
          this.changed.emit();
        }
      });
    });
  }

  /** Notes enregistrées à la perte de focus, seulement si elles ont changé. */
  protected saveNotes(scene: BolSceneModel, raw: string): void {
    const notes = raw.trim() ? raw : null;
    if (notes === (scene.notes ?? null)) {
      return;
    }
    this.run(this.sceneService.update(scene.id, {notes}), "Impossible d'enregistrer les notes.", (updated) =>
      this.replaceScene(updated),
    );
  }

  protected updateFromTable(scene: BolSceneModel): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Mettre à jour la scène',
        message: `La distribution enregistrée de « ${scene.titre} » sera remplacée par les personnages actuellement sur la table.`,
        confirmLabel: 'Mettre à jour',
      },
      {width: '420px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.run(
        this.sceneService.replaceDistribution(scene.id, this.sessionId()),
        'Impossible de mettre à jour la scène.',
        (updated) => {
          this.replaceScene(updated);
          this.snackBar.open(`Scène « ${updated.titre} » mise à jour.`, undefined, {duration: 2500});
        },
      );
    });
  }

  protected remove(scene: BolSceneModel): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer la scène',
        message: `Voulez-vous supprimer « ${scene.titre} » ? Les personnages déjà sur la table ne sont pas retirés.`,
        confirmLabel: 'Supprimer',
      },
      {width: '420px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.run(this.sceneService.delete(scene.id), 'Impossible de supprimer la scène.', () => {
        this.scenes.update((list) => list.filter((s) => s.id !== scene.id));
        if (scene.id === this.currentSceneId()) {
          this.changed.emit();
        }
      });
    });
  }

  /** Boutons « Monter » / « Descendre » : alternative clavier au glisser-déposer. */
  protected move(scene: BolSceneModel, delta: -1 | 1): void {
    const ids = moveScene(
      this.visibleScenes().map((s) => s.id),
      scene.id,
      delta,
    );
    if (ids) {
      this.applyOrder(ids);
    }
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const ids = this.visibleScenes().map((s) => s.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this.applyOrder(ids);
  }

  /** Applique le nouvel ordre tout de suite à l'écran, puis le persiste ; en cas d'échec, la liste
   * est rechargée depuis le serveur. */
  private applyOrder(ids: readonly string[]): void {
    const rank = new Map(ids.map((id, index) => [id, index]));
    this.scenes.update((list) => list.map((s) => (rank.has(s.id) ? {...s, ordre: rank.get(s.id)!} : s)));

    this.busy.set(true);
    this.sceneService.reorder(this.selectedScenario(), ids).subscribe({
      next: () => this.busy.set(false),
      error: (error: unknown) => {
        this.busy.set(false);
        this.fail(error, "Impossible d'enregistrer le nouvel ordre.");
        this.sceneService.scenes().subscribe((scenes) => this.scenes.set(scenes));
      },
    });
  }

  private replaceScene(updated: BolSceneModel): void {
    this.scenes.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
  }

  /** Exécute une opération réseau avec l'indicateur `busy` et le message d'erreur commun. */
  private run<T>(request: Observable<T>, errorMessage: string, onSuccess: (value: T) => void): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    request.subscribe({
      next: (value) => {
        this.busy.set(false);
        onSuccess(value);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.fail(error, errorMessage);
      },
    });
  }

  private fail(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }
}
