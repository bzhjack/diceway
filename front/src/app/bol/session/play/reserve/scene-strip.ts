import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {forkJoin} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolSceneModel, BolSceneScenarioRef} from '../../../models/bol-scene.model';
import {BolScenarioService} from '../../../services/bol-scenario.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {SceneActionsService} from '../../scene-actions.service';
import {NO_SCENARIO, scenesOf} from '../scene-list/scene.util';
import {SceneManagerDialogComponent, SceneManagerDialogData} from './scene-manager-dialog';

/** Onglet « Scènes » du bandeau de réserve : le scénario, ses scènes en puces (un clic charge), et
 * l'accès à « Enregistrer la table » et « Gérer les scènes ». Signale à la page (`changed`) chaque
 * opération qui a modifié la session. */
@Component({
  selector: 'bol-scene-strip',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  template: `
    <mat-form-field subscriptSizing="dynamic" class="scs-scenario">
      <mat-label>Scénario</mat-label>
      <mat-select id="scs-scenario-select" [value]="selectedScenario() ?? noScenario" (selectionChange)="selectScenario($event)">
        <mat-option [value]="noScenario">Sans scénario</mat-option>
        @for (scenario of sortedScenarios(); track scenario.id) {
          <mat-option [value]="scenario.id">{{ scenario.titre }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <ul class="scs-scenes" role="list" aria-label="Scènes du scénario">
      @for (scene of visibleScenes(); track scene.id; let index = $index) {
        <li>
          <button
            type="button"
            class="scs-chip"
            [class.scs-chip--current]="scene.id === currentSceneId()"
            [attr.aria-current]="scene.id === currentSceneId() ? 'true' : null"
            [attr.aria-label]="'Charger la scène ' + scene.titre"
            [disabled]="busy()"
            (click)="load(scene)"
          >
            {{ index + 1 }} · {{ scene.titre }}
          </button>
        </li>
      } @empty {
        <li class="scs-empty">{{ loading() ? 'Chargement…' : 'Aucune scène ici. Pose tes personnages, puis enregistre la table.' }}</li>
      }
    </ul>

    <div class="scs-actions">
      <button mat-flat-button size="small" type="button" [disabled]="busy() || loading()" (click)="saveTable()">
        <mat-icon>save</mat-icon> Enregistrer la table
      </button>
      <button mat-stroked-button size="small" type="button" [disabled]="loading()" (click)="manage()">
        Gérer les scènes
      </button>
    </div>
  `,
  styles: `
    :host {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .scs-scenario {
      flex: 0 0 13rem;
    }

    .scs-scenes {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
      padding: 0.3rem 0;
      list-style: none;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--dw-border) transparent;
    }

    .scs-chip {
      padding: 0.35rem 0.75rem;
      border: 1px solid var(--dw-border);
      border-radius: 999px;
      background: var(--dw-surface-100);
      color: var(--dw-surface-700);
      font: inherit;
      font-size: 0.82rem;
      white-space: nowrap;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: var(--dw-surface-500);
        color: var(--dw-surface-900);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    }

    .scs-chip--current {
      border-color: var(--dw-color-legendary);
      color: var(--dw-color-legendary);
      background: transparent;
    }

    .scs-empty {
      font-size: 0.85rem;
      color: var(--dw-surface-500);
      white-space: nowrap;
    }

    .scs-actions {
      flex-shrink: 0;
      display: flex;
      gap: 0.4rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneStripComponent {
  private readonly sceneService = inject(BolSceneService);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly sceneActions = inject(SceneActionsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  readonly currentSceneId = input<string | null>(null);
  readonly nonHeroCount = input(0);
  /** La session a été modifiée (scène chargée ou enregistrée…) : la page la recharge. */
  readonly changed = output<void>();

  protected readonly noScenario = NO_SCENARIO;
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  private readonly scenes = signal<readonly BolSceneModel[]>([]);
  private readonly scenarios = signal<readonly BolSceneScenarioRef[]>([]);
  /** Scénario affiché — `null` = « Sans scénario ». */
  protected readonly selectedScenario = signal<string | null>(null);

  protected readonly sortedScenarios = computed(() =>
    [...this.scenarios()].sort((left, right) => left.titre.localeCompare(right.titre, 'fr')),
  );
  private readonly knownScenarioIds = computed(() => new Set(this.scenarios().map((s) => s.id)));
  protected readonly visibleScenes = computed(() =>
    scenesOf(this.scenes(), this.selectedScenario(), this.knownScenarioIds()),
  );

  constructor() {
    this.reload(true);

    // La scène courante peut avoir été créée ailleurs (barre de commande, dialogue de gestion) :
    // si elle n'est pas dans la liste, celle-ci est rechargée.
    effect(() => {
      const currentId = this.currentSceneId();
      const known = untracked(() => this.scenes().some((scene) => scene.id === currentId));
      if (currentId && !known && !untracked(() => this.loading())) {
        this.reload(false);
      }
    });
  }

  /** Recharge scènes et scénarios. Au premier chargement, se place sur le scénario de la scène
   * courante de la session. */
  private reload(selectCurrent: boolean): void {
    forkJoin({scenes: this.sceneService.scenes(), scenarios: this.scenarioService.scenarios()}).subscribe({
      next: ({scenes, scenarios}) => {
        this.scenes.set(scenes);
        this.scenarios.set(
          scenarios.filter((s): s is typeof s & {id: string} => !!s.id).map((s) => ({id: s.id, titre: s.titre})),
        );
        const known = this.knownScenarioIds();
        if (selectCurrent) {
          const scenarioId = scenes.find((s) => s.id === this.currentSceneId())?.scenario_id ?? null;
          this.selectedScenario.set(scenarioId && known.has(scenarioId) ? scenarioId : null);
        } else if (this.selectedScenario() && !known.has(this.selectedScenario()!)) {
          // Le scénario affiché a été supprimé depuis le dialogue de gestion.
          this.selectedScenario.set(null);
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.fail(error, 'Impossible de charger les scènes.');
      },
    });
  }

  protected selectScenario(change: MatSelectChange): void {
    this.selectedScenario.set(change.value === NO_SCENARIO ? null : (change.value as string));
  }

  protected load(scene: BolSceneModel): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.sceneActions.load(this.sessionId(), scene, this.nonHeroCount()).subscribe({
      next: (result) => {
        this.busy.set(false);
        if (result) {
          this.changed.emit();
        }
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.fail(error, 'Impossible de charger la scène.');
      },
    });
  }

  protected saveTable(): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.sceneActions.saveTable(this.sessionId(), this.selectedScenario()).subscribe({
      next: (scene) => {
        this.busy.set(false);
        if (scene) {
          this.scenes.update((list) => [...list, scene]);
          this.changed.emit();
        }
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.fail(error, "Impossible d'enregistrer la scène.");
      },
    });
  }

  /** Ouvre la liste complète des scènes en dialogue ; au retour, les puces sont rechargées. */
  protected manage(): void {
    const data: SceneManagerDialogData = {
      sessionId: this.sessionId(),
      currentSceneId: this.currentSceneId,
      nonHeroCount: this.nonHeroCount,
      onChanged: () => this.changed.emit(),
    };
    this.dialog
      .open(SceneManagerDialogComponent, {data, width: 'min(34rem, 94vw)', maxWidth: '94vw'})
      .afterClosed()
      .subscribe(() => this.reload(false));
  }

  private fail(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }
}
