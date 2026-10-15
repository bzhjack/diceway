import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {EndTurnChoice, EndTurnDialogData} from '../../models/end-turn-dialog.model';

/** « Fin du tour » alors que le coup qui a touché n'est pas appliqué : ses dégâts et les effets de ses options héroïques seraient
 * perdus. Le MJ l'applique et finit, finit sans l'appliquer, ou reste sur le tour. */
@Component({
  selector: 'bol-end-turn-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Le coup n'est pas appliqué</h2>
    <mat-dialog-content>
      <p>
        {{ data.attackerNom }} a touché {{ data.targetNom }}, mais le coup n'est pas appliqué : finir le tour maintenant perd ses dégâts
        et les effets de ses options héroïques.
      </p>
      @if (!data.canApply) {
        <p>Les dégâts ne sont pas encore saisis.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Annuler</button>
      <button mat-stroked-button type="button" [mat-dialog-close]="skip">Finir sans appliquer</button>
      @if (data.canApply) {
        <button mat-flat-button type="button" [mat-dialog-close]="apply" cdkFocusInitial>
          {{ data.damage === null ? 'Conclure et finir' : 'Appliquer ' + data.damage + ' et finir' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndTurnDialogComponent {
  protected readonly data = inject<EndTurnDialogData>(MAT_DIALOG_DATA);
  protected readonly apply: EndTurnChoice = 'apply';
  protected readonly skip: EndTurnChoice = 'skip';
}
