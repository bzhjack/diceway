import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';

type StatGroup = 'attr' | 'combat' | 'res';

interface StatCell {
  readonly control: string;
  readonly label: string;
  readonly group: StatGroup;
}

const STAT_CELLS: readonly StatCell[] = [
  {control: 'vigueur', label: 'Vigueur', group: 'attr'},
  {control: 'agilite', label: 'Agilité', group: 'attr'},
  {control: 'esprit', label: 'Esprit', group: 'attr'},
  {control: 'aura', label: 'Aura', group: 'attr'},
  {control: 'initiative', label: 'Initiative', group: 'combat'},
  {control: 'melee', label: 'Mêlée', group: 'combat'},
  {control: 'tir', label: 'Tir', group: 'combat'},
  {control: 'defense', label: 'Défense', group: 'combat'},
  {control: 'vitalite', label: 'Vitalité', group: 'res'},
  {control: 'heroisme', label: 'Héroïsme', group: 'res'},
  {control: 'experience', label: 'Expérience', group: 'res'},
  {control: 'pouvoir', label: 'Pouvoir', group: 'res'},
  {control: 'foi', label: 'Foi', group: 'res'},
  {control: 'creation', label: 'Création', group: 'res'},
];

@Component({
  selector: 'bol-hero-stats',
  imports: [ReactiveFormsModule, DwValueStepperComponent],
  templateUrl: './hero-stats.component.html',
  styleUrl: './hero-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroStatsComponent {
  readonly form = input.required<FormGroup>();

  protected readonly cells = STAT_CELLS;
}
