import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';

/** Pense-bête du jet de réaction BoL (02-actions-combat.md) — résultats possibles et modificateurs. */
@Component({
  selector: 'bol-initiative-help-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './initiative-help-dialog.html',
  styleUrl: './initiative-help-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitiativeHelpDialogComponent {
  protected readonly ref = inject(MatDialogRef<InitiativeHelpDialogComponent>);

  protected close(): void {
    this.ref.close();
  }
}
