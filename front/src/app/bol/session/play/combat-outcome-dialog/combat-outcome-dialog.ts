import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {CombatOutcomeDialogData} from '../../models/combat-outcome-dialog.model';

/** Fin du combat : un camp n'a plus personne debout, plus personne à viser en face. « Terminer le combat » (résultat `true`) ouvre
 * « Après combat » ; « Continuer » laisse le combat ouvert, pour secourir un mourant ou soigner avant de le terminer. */
@Component({
  selector: 'bol-combat-outcome-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="cod-title" [class.cod-title--lost]="data.outcome === 'defaite'">
      <mat-icon aria-hidden="true">{{ data.outcome === 'victoire' ? 'emoji_events' : 'heart_broken' }}</mat-icon>
      {{ data.outcome === 'victoire' ? 'Victoire' : 'Défaite' }}
    </h2>
    <mat-dialog-content class="cod-content">
      <p>{{ data.outcome === 'victoire' ? 'Plus aucun adversaire ne tient debout.' : 'Plus aucun héros ni allié ne tient debout.' }}</p>
      @if (data.mourants.length > 0) {
        <p class="cod-warn">
          {{ data.mourants.length > 1 ? 'Encore mourants' : 'Encore mourant' }} : {{ data.mourants.join(', ') }}. On peut encore les secourir avant
          de terminer.
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Continuer</button>
      <button mat-flat-button type="button" cdkFocusInitial [mat-dialog-close]="true">Terminer le combat</button>
    </mat-dialog-actions>
  `,
  styles: `
    .cod-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Muse Display Harmony', 'Muse Sans', serif;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--dw-color-reussite);
    }

    .cod-title--lost {
      color: var(--dw-color-echec);
    }

    .cod-content p {
      margin: 0 0 0.5rem;
    }

    .cod-warn {
      color: var(--dw-color-legendary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatOutcomeDialogComponent {
  protected readonly data = inject<CombatOutcomeDialogData>(MAT_DIALOG_DATA);
}
