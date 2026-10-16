import {ChangeDetectionStrategy, Component, computed, inject, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolSceneModel, SceneLoadMode} from '../../../models/bol-scene.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {SceneActe} from '../../models/theatre.model';
import {openSceneEditor} from './scene-editor-dialog/scene-editor-dialog';
import {ScenePreviewComponent} from './scene-preview';
import {SceneStageStore} from './scene-stage.store';
import {acteLabel} from './theatre.util';

/** La frise des actes, dans l'en-tête de la table : le scénario affiché (menu pour en changer) et ses scènes
 * en pastilles numérotées. Une pastille ouvre l'aperçu de la scène et ses actions : lever le rideau dessus,
 * ajouter ses personnages, la préparer. Signale à la page (`sceneChanged`) chaque scène chargée. */
@Component({
  selector: 'bol-scene-acts',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, ScenePreviewComponent],
  template: `
    <nav class="sca" aria-label="Scènes du scénario">
      <button
        mat-stroked-button
        size="small"
        type="button"
        class="sca-scenario"
        [matMenuTriggerFor]="scenarios"
        [attr.aria-label]="'Scénario affiché : ' + scenarioTitre()"
      >
        <mat-icon>auto_stories</mat-icon>
        <span class="sca-scenario-titre">{{ scenarioTitre() }}</span>
      </button>
      <mat-menu #scenarios="matMenu">
        <button mat-menu-item type="button" (click)="store.selectScenario(null)">Sans scénario</button>
        @for (scenario of sortedScenarios(); track scenario.id) {
          <button mat-menu-item type="button" (click)="store.selectScenario(scenario.id)">{{ scenario.titre }}</button>
        }
      </mat-menu>

      <ol class="sca-actes">
        @for (acte of store.acts(); track acte.scene.id) {
          <li>
            <button
              type="button"
              class="sca-acte"
              [class.sca-acte--en-cours]="acte.statut === 'en-cours'"
              [class.sca-acte--jouee]="acte.statut === 'jouee'"
              [attr.aria-current]="acte.statut === 'en-cours' ? 'step' : null"
              [attr.aria-label]="label(acte)"
              [disabled]="store.busy()"
              [matMenuTriggerFor]="apercu"
              [matMenuTriggerData]="{acte}"
            >
              <span class="sca-num" aria-hidden="true">
                @if (acte.statut === 'jouee') {
                  <mat-icon>check</mat-icon>
                } @else {
                  {{ acte.numero }}
                }
              </span>
              @if (acte.statut === 'en-cours') {
                <span class="sca-titre" aria-hidden="true">{{ acte.scene.titre }}</span>
              }
            </button>
          </li>
        } @empty {
          <li class="sca-vide">Aucune scène dans ce scénario.</li>
        }
      </ol>

      <mat-menu #apercu="matMenu" class="thr-apercu-menu">
        <ng-template matMenuContent let-acte="acte">
          <bol-scene-preview [scene]="acte.scene" [statut]="acte.statut" [regionNom]="regionNom(acte.scene)" />
          <button mat-menu-item type="button" (click)="load(acte.scene, 'replace')">
            <mat-icon>theater_comedy</mat-icon> Lever le rideau
          </button>
          @if (acte.scene.distribution.length) {
            <button mat-menu-item type="button" (click)="load(acte.scene, 'add')">
              <mat-icon>group_add</mat-icon> Ajouter ses personnages
            </button>
          }
          <button mat-menu-item type="button" (click)="edit(acte.scene)">
            <mat-icon>edit_note</mat-icon> Préparer la scène
          </button>
        </ng-template>
      </mat-menu>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .sca {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-width: 0;
    }

    .sca-scenario {
      flex-shrink: 0;
      max-width: 14rem;
    }

    .sca-scenario-titre {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sca-actes {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
      margin: 0;
      padding: 0.2rem 0.1rem;
      list-style: none;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(217, 164, 65, 0.35) transparent;
    }

    .sca-acte {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      min-width: 2rem;
      height: 2rem;
      padding: 0;
      border: 1px solid rgba(217, 164, 65, 0.45);
      border-radius: 999px;
      background: rgba(15, 10, 6, 0.6);
      color: var(--dw-surface-700);
      font: inherit;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: var(--dw-color-legendary);
        color: var(--dw-color-text-bright);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 2px;
      }

      &:disabled {
        cursor: progress;
        opacity: 0.6;
      }
    }

    .sca-num {
      display: grid;
      place-items: center;
      width: 2rem;
      flex-shrink: 0;

      .mat-icon {
        width: 1.1rem;
        height: 1.1rem;
        font-size: 1.1rem;
      }
    }

    .sca-acte--jouee {
      color: var(--dw-color-legendary);
      border-color: rgba(217, 164, 65, 0.25);
    }

    .sca-acte--en-cours {
      padding-right: 0.85rem;
      border-color: #d9a441;
      background: linear-gradient(180deg, #d9a441, #8c6a2f);
      color: #1a0f05;
    }

    .sca-titre {
      max-width: 16rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sca-vide {
      font-size: 0.82rem;
      color: var(--dw-surface-600);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneActsComponent {
  protected readonly store = inject(SceneStageStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  /** Une scène vient d'être chargée sur la table : la page recharge la session. */
  readonly sceneChanged = output<void>();

  protected readonly sortedScenarios = computed(() =>
    [...this.store.scenarios()].sort((left, right) => left.titre.localeCompare(right.titre, 'fr')),
  );
  protected readonly scenarioTitre = computed(
    () => this.store.scenarios().find((s) => s.id === this.store.scenarioId())?.titre ?? 'Sans scénario',
  );

  constructor() {
    // Les portraits de l'aperçu viennent du catalogue, chargé ici même si les coulisses restent fermées.
    inject(CombatSelectionService).loadCatalog();
  }

  protected label(acte: SceneActe): string {
    return acteLabel(acte);
  }

  protected regionNom(scene: BolSceneModel): string | null {
    return scene.region_id != null ? (this.store.regionNoms().get(scene.region_id) ?? null) : null;
  }

  protected load(scene: BolSceneModel, mode: SceneLoadMode): void {
    this.store.load(scene, mode).subscribe({
      next: (result) => {
        if (result) {
          this.sceneChanged.emit();
        }
      },
      error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger la scène.'), 'Fermer', {duration: 5000}),
    });
  }

  protected edit(scene: BolSceneModel): void {
    const siblings = this.store.acts().map((acte) => acte.scene).filter((s) => s.id !== scene.id);
    openSceneEditor(this.dialog, {scene, siblings}).subscribe((updated) => {
      if (updated) {
        this.store.replaceScene(updated);
      }
    });
  }
}
