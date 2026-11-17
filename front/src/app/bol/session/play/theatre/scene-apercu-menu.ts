import {ChangeDetectionStrategy, Component, inject, output, viewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenu, MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolSceneLoadResult, BolSceneModel} from '../../../models/bol-scene.model';
import {ScenePreviewComponent} from './scene-preview';
import {PisteAffichee} from '../../models/theatre.model';
import {SceneStageStore} from './scene-stage.store';
import {pistesAffichees} from './theatre.util';

/** Le menu d'aperçu d'une scène, partagé par la frise des actes et les pistes de la lecture : l'aperçu, puis, sur une ligne à
 * droite, « Modifier la scène » et « Charger la scène » (doré, au bout) ; « Modifier la scène » qui ouvre « Préparer la scène » et revient à la table ; deux éléments du
 * menu, donc atteignables au clavier. C'est le seul endroit de la table d'où une scène se modifie. Le déclencheur passe l'acte en
 * données : `[matMenuTriggerFor]="apercu.menu()"`, `[matMenuTriggerData]="{acte}"`. Signale chaque scène chargée (`sceneChanged`), avec la session à jour. */
@Component({
  selector: 'bol-scene-apercu-menu',
  exportAs: 'apercuMenu',
  imports: [MatIconModule, MatMenuModule, ScenePreviewComponent],
  template: `
    <mat-menu class="thr-apercu-menu">
      <ng-template matMenuContent let-acte="acte">
        <bol-scene-preview
          [scene]="acte.scene"
          [statut]="acte.statut"
          [regionNom]="store.regionNom(acte.scene)"
          [numero]="acte.numero"
          [total]="store.acts().length"
          [suites]="suites(acte.scene)"
        />
        <!-- Les deux actions sur une ligne, à droite : « Charger la scène » au bout (le premier au clavier), « Modifier » avant lui. -->
        <div class="thr-apercu-actions">
          <button mat-menu-item type="button" class="thr-apercu-charger" (click)="load(acte.scene)">
            <mat-icon>theater_comedy</mat-icon> Charger la scène
          </button>
          <button mat-menu-item type="button" class="thr-apercu-modifier" (click)="store.prepare(acte.scene)">
            <mat-icon>edit</mat-icon> Modifier la scène
          </button>
        </div>
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

  /** Les pistes d'une scène, chacune avec l'acte de la frise où elle mène. */
  protected suites(scene: BolSceneModel): PisteAffichee[] {
    return pistesAffichees(scene, this.store.acts());
  }

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
