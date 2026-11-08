import {ChangeDetectionStrategy, Component, inject, output, viewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenu, MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolSceneLoadResult, BolSceneModel} from '../../../models/bol-scene.model';
import {ScenePreviewComponent} from './scene-preview';
import {SceneStageStore} from './scene-stage.store';

/** Le menu d'aperçu d'une scène, partagé par la frise des actes et les pistes de la lecture : l'aperçu, puis « Charger
 * la scène », un élément du menu, donc atteignable au clavier. La scène se prépare depuis les notes de la scène. Le déclencheur passe l'acte en données : `[matMenuTriggerFor]="apercu.menu()"`,
 * `[matMenuTriggerData]="{acte}"`. Signale chaque scène chargée (`sceneChanged`), avec la session à jour. */
@Component({
  selector: 'bol-scene-apercu-menu',
  exportAs: 'apercuMenu',
  imports: [MatIconModule, MatMenuModule, ScenePreviewComponent],
  template: `
    <mat-menu class="thr-apercu-menu">
      <ng-template matMenuContent let-acte="acte">
        <bol-scene-preview [scene]="acte.scene" [statut]="acte.statut" [regionNom]="store.regionNom(acte.scene)" />
        <button mat-menu-item type="button" (click)="load(acte.scene)">
          <mat-icon>theater_comedy</mat-icon> Charger la scène
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

  protected load(scene: BolSceneModel): void {
    this.store.load(scene).subscribe({
      next: (result) => {
        if (result) {
          this.sceneChanged.emit(result);
        }
      },
      error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger la scène.'), 'Fermer', {duration: 5000}),
    });
  }
}
