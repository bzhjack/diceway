import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';

interface StatCell {
  readonly control: string;
  readonly label: string;
  readonly highlight?: boolean;
}

interface StatGroup {
  readonly key: 'attr' | 'combat' | 'res';
  readonly label: string;
  readonly columns: 2 | 3;
  readonly cells: readonly StatCell[];
}

const STAT_GROUPS: readonly StatGroup[] = [
  {
    key: 'attr',
    label: 'Attributs',
    columns: 2,
    cells: [
      {control: 'vigueur', label: 'Vigueur'},
      {control: 'agilite', label: 'Agilité'},
      {control: 'esprit', label: 'Esprit'},
      {control: 'aura', label: 'Aura'},
    ],
  },
  {
    key: 'combat',
    label: 'Combat',
    columns: 2,
    cells: [
      {control: 'initiative', label: 'Initiative'},
      {control: 'melee', label: 'Mêlée'},
      {control: 'tir', label: 'Tir'},
      {control: 'defense', label: 'Défense'},
    ],
  },
  {
    key: 'res',
    label: 'Ressources',
    columns: 3,
    cells: [
      {control: 'vitalite', label: 'Vitalité', highlight: true},
      {control: 'heroisme', label: 'Héroïsme', highlight: true},
      {control: 'experience', label: 'Expérience'},
      {control: 'pouvoir', label: 'Pouvoir'},
      {control: 'foi', label: 'Foi'},
      {control: 'creation', label: 'Création'},
    ],
  },
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

  protected readonly groups = STAT_GROUPS;
}
