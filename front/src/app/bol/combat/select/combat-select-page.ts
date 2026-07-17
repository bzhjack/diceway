import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {InitiativeResultat} from '../../models/bol-fight-session.model';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {buildInitiativeOrderFromSelection} from '../initiative.util';
import {CombatantCardComponent} from './combatant-card/combatant-card';
import {CombatantPickerDialogComponent} from './combatant-picker-dialog/combatant-picker-dialog';

/** Écran de préparation d'un combat : une seule zone de combattants, alimentée depuis un dialog de sélection. */
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

  protected readonly order = computed(() =>
    buildInitiativeOrderFromSelection(
      this.selection.combatants(),
      (catalogId) => this.selection.entryFor(catalogId),
      this.selection.heroInitiative(),
    ),
  );

  constructor() {
    this.selection.loadCatalog();
  }

  protected onInitiativeChange(catalogId: string, value: InitiativeResultat | null): void {
    this.selection.setHeroInitiative(catalogId, value);
  }

  protected openPicker(): void {
    this.dialog.open(CombatantPickerDialogComponent, {
      width: 'min(1024px, 94vw)',
      maxWidth: '94vw',
      position: {top: '5vh'},
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
          this.snackBar.open('Combat lancé.', 'OK', {duration: 4000});
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
