import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {Field, FieldTree, FormField} from '@angular/forms/signals';
import {DwValueStepperComponent} from '../../../shared/value-stepper/value-stepper';
import {StatGroup} from './stats-grid.component';

export type {StatCell, StatGroup} from './stats-grid.component';

/**
 * Variante Signal Forms de {@link StatsGridComponent}, pour les entités déjà migrées
 * (créature, démon). À fusionner avec l'original une fois héros/PNJ migrés à leur tour.
 */
@Component({
  selector: 'bol-stats-grid-field',
  imports: [FormField, DwValueStepperComponent],
  templateUrl: './stats-grid-field.component.html',
  styleUrl: './stats-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsGridFieldComponent {
  readonly form = input.required<FieldTree<Record<string, number>>>();
  readonly groups = input.required<readonly StatGroup[]>();

  // Largeur de chaque bloc proportionnelle à son nombre de colonnes de cellules
  // (un bloc Ressources à 1 colonne prend moins de place qu'un à 3).
  protected readonly blocksTemplate = computed(() =>
    this.groups().map((group) => `${group.columns}fr`).join(' '),
  );

  protected fieldFor(control: string): Field<number> {
    return (this.form() as unknown as Record<string, Field<number>>)[control];
  }
}
