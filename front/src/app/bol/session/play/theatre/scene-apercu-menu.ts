import {ChangeDetectionStrategy, Component, inject, output, viewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenu, MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolSceneLoadResult, BolSceneModel, SceneLoadMode} from '../../../models/bol-scene.model';
import {ScenePreviewComponent} from './scene-preview';
import {SceneStageStore} from './scene-stage.store';

/** Le menu d'aperçu d'une scène, partagé par la frise des actes et les pistes de la lecture : l'aperçu, puis « Charger
 * la scène », « Ajouter ses personnages » et « Préparer la scène ». Les actions sont des éléments de ce menu, donc
 * atteignables au clavier. Le déclencheur passe l'acte en données : `[matMenuTriggerFor]="apercu.menu()"`,
 * `[matMenuTriggerData]="{acte}"`. Signale chaque scène chargée (`sceneChanged`), avec la session à jour. */
@Component({
  selector: 'bol-scene-apercu-menu',
  exportAs: 'apercuMenu',
  imports: [MatIconModule, MatMenuModule, ScenePreviewComponent],
  template: `
    <mat-menu class="thr-apercu-menu">
      <ng-template matMenuContent let-acte="acte">
        <bol-scene-preview [scene]="acte.scene" [statut]="acte.statut" [regionNom]="store.regionNom(acte.scene)" />
        <button mat-menu-item type="button" (click)="load(acte.scene, 'replace')">
          <mat-icon svgIcon="gi-masks" /> Charger la scène
        </button>
        @if (acte.scene.distribution.length) {
          <button mat-menu-item type="button" (click)="load(acte.scene, 'add')">
            <mat-icon svgIcon="gi-group" /> Ajouter ses personnages
          </button>
        }
        <button mat-menu-item type="button" (click)="store.prepare(acte.scene)">
          <mat-icon svgIcon="gi-quill" /> Préparer la scène
        </button>
      </ng-template>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneApercuMenuComponent {
  protected readonly store = inject(SceneStageStore);
  private readonly snackBar = inject(MatSnackBar);

  /** Le menu, pour `[matMenuTriggerFor]`. */
  readonly menu = viewChild.required(MatMenu);
  /** Une scène vient d'être chargée sur la table, avec la session à jour : la page la pose. */
  readonly sceneChanged = output<BolSceneLoadResult>();

  protected load(scene: BolSceneModel, mode: SceneLoadMode): void {
    this.store.load(scene, mode).subscribe({
      next: (result) => {
        if (result) {
          this.sceneChanged.emit(result);
        }
      },
      error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger la scène.'), 'Fermer', {duration: 5000}),
    });
  }
}
