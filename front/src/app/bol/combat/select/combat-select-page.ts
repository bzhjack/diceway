import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {BolHerosModel} from '../../models/bol-heros.model';
import {InitiativeResultat} from '../../models/bol-fight-session.model';
import {AmbushState, CombatSelectionService} from '../../services/combat-selection.service';
import {buildInitiativeOrderFromSelection} from '../initiative.util';
import {combatantRankKey} from './combat-statblock.util';
import {CombatantCardComponent} from './combatant-card/combatant-card';
import {CombatantPickerDialogComponent} from './combatant-picker-dialog/combatant-picker-dialog';

interface AdverseInitiative {
  readonly value: number;
  readonly source: string;
}

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

  /** Plus haute valeur d'initiative parmi les PNJ rivaux/coriaces adverses (02-actions-combat.md) — s'applique en malus aux héros. */
  protected readonly adverseInitiative = computed<AdverseInitiative | null>(() => {
    let best: AdverseInitiative | null = null;

    for (const combatant of this.selection.combatants()) {
      const entry = this.selection.entryFor(combatant.catalogId);
      if (!entry || entry.kind !== 'pnj') {
        continue;
      }

      const rank = combatantRankKey(entry);
      if (rank !== 'rival' && rank !== 'coriace') {
        continue;
      }

      const value = (entry.raw as BolHerosModel).combat.initiative;
      if (value > 0 && (!best || value > best.value)) {
        best = {value, source: entry.nom};
      }
    }

    return best;
  });

  protected readonly modifierTotal = computed(() => {
    let total = 0;
    if (this.selection.ambushState() === 'heroes_ambush') {
      total += 2;
    } else if (this.selection.ambushState() === 'heroes_ambushed') {
      total -= 1;
    }

    const adverse = this.adverseInitiative();
    if (adverse) {
      total -= adverse.value;
    }

    return total;
  });

  constructor() {
    this.selection.loadCatalog();
  }

  protected onInitiativeChange(catalogId: string, value: InitiativeResultat | null): void {
    this.selection.setHeroInitiative(catalogId, value);
  }

  protected onAmbushToggle(state: Exclude<AmbushState, null>, checked: boolean): void {
    this.selection.setAmbushState(checked ? state : null);
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
