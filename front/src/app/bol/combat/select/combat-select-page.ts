import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {CombatCamp} from '../../models/bol-fight-session.model';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {CombatantCardComponent} from './combatant-card/combatant-card';
import {
  CombatantPickerDialogComponent,
  CombatantPickerDialogData,
} from './combatant-picker-dialog/combatant-picker-dialog';

/** Écran de préparation d'un combat : deux camps (héros/adversaires), chacun alimenté depuis un dialog de sélection. */
@Component({
  selector: 'bol-combat-select-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, CombatantCardComponent],
  templateUrl: './combat-select-page.html',
  styleUrl: './combat-select-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatSelectPageComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly selection = inject(CombatSelectionService);

  protected readonly launching = signal(false);

  protected readonly totalCount = computed(() =>
    this.selection.combatants().reduce((sum, c) => sum + c.qty, 0),
  );

  constructor() {
    this.selection.loadCatalog();
  }

  protected openPicker(camp: CombatCamp): void {
    this.dialog.open<CombatantPickerDialogComponent, CombatantPickerDialogData>(CombatantPickerDialogComponent, {
      width: 'min(1024px, 94vw)',
      maxWidth: '94vw',
      position: {top: '5vh'},
      data: {camp},
    });
  }

  protected launchCombat(): void {
    this.launching.set(true);
    this.selection
      .launch()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.launching.set(false);
          this.selection.reset();
          this.snackBar.open(
            'Session de combat créée. Le tracker de combat arrive dans une prochaine étape.',
            'OK',
            {duration: 6000},
          );
        },
        error: (error: unknown) => {
          this.launching.set(false);
          this.snackBar.open(
            extractApiErrorMessage(error, 'Impossible de créer la session de combat.'),
            'OK',
            {duration: 6000},
          );
        },
      });
  }
}
