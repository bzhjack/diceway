import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {SceneLoadMode} from '../../../models/bol-scene.model';
import {SceneLoadDialogData} from '../../models/scene-load-dialog.model';

/** Chargement d'une scène sur une table qui porte déjà d'autres personnages que les héros : remplacer
 * ceux-ci, ou ajouter la scène par-dessus. Se ferme avec le mode choisi, ou `undefined` si annulé. */
@Component({
  selector: 'bol-scene-load-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Charger « {{ data.titre }} »</h2>
    <mat-dialog-content>
      {{ data.nonHeroCount }} personnage{{ data.nonHeroCount > 1 ? 's sont' : ' est' }} déjà sur la table, en plus des
      héros. Remplacer les retire ; les héros restent dans les deux cas.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Annuler</button>
      <button mat-stroked-button type="button" [mat-dialog-close]="add">Ajouter</button>
      <button mat-flat-button type="button" [mat-dialog-close]="replace" cdkFocusInitial>Remplacer</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneLoadDialogComponent {
  protected readonly data = inject<SceneLoadDialogData>(MAT_DIALOG_DATA);
  protected readonly add: SceneLoadMode = 'add';
  protected readonly replace: SceneLoadMode = 'replace';
}
