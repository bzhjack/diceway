import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {BolSceneLoadResult} from '../../../models/bol-scene.model';
import {SceneLectureComponent} from './scene-lecture';
import {SceneStageStore} from './scene-stage.store';

/** Les notes de la scène courante en grand, pour lire à distance : la même lecture que la colonne de droite du plateau, dans une
 * fenêtre au texte plus gros. Une scène chargée depuis une piste ferme la fenêtre et rend son résultat à la page. */
@Component({
  selector: 'bol-scene-lecture-dialog',
  imports: [SceneLectureComponent],
  template: `
    @if (store.displayedScene(); as scene) {
      <bol-scene-lecture [scene]="scene" [acts]="store.acts()" [grand]="true" (grandToggled)="dialogRef.close()" (sceneChanged)="dialogRef.close($event)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneLectureDialogComponent {
  protected readonly store = inject(SceneStageStore);
  protected readonly dialogRef = inject<MatDialogRef<SceneLectureDialogComponent, BolSceneLoadResult>>(MatDialogRef);
}
