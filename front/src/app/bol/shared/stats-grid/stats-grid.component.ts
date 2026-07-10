import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {DwValueStepperComponent} from '../../../shared/value-stepper/value-stepper';

export interface StatCell {
  readonly control: string;
  readonly label: string;
  readonly highlight?: boolean;
}

export interface StatGroup {
  readonly key: 'attr' | 'combat' | 'res';
  readonly label: string;
  readonly columns: 1 | 2 | 3 | 4;
  readonly cells: readonly StatCell[];
}

@Component({
  selector: 'bol-stats-grid',
  imports: [ReactiveFormsModule, DwValueStepperComponent],
  templateUrl: './stats-grid.component.html',
  styleUrl: './stats-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsGridComponent {
  readonly form = input.required<FormGroup>();
  readonly groups = input.required<readonly StatGroup[]>();

  // Largeur de chaque bloc proportionnelle à son nombre de colonnes de cellules
  // (un bloc Ressources à 1 colonne prend moins de place qu'un à 3).
  protected readonly blocksTemplate = computed(() =>
    this.groups().map((group) => `${group.columns}fr`).join(' '),
  );
}
