import {ChangeDetectionStrategy, Component, computed, input, model, output} from '@angular/core';
import {FormValueControl} from '@angular/forms/signals';

/** Un nombre à régler : `[formField]` dans un formulaire, `[value]` et `(valueChange)` pour un chiffre seul. Dans un formulaire, les bornes
 * viennent du schéma (`min()`, `max()`). */
@Component({
  selector: 'dw-value-stepper',
  templateUrl: './value-stepper.html',
  styleUrl: './value-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwValueStepperComponent implements FormValueControl<number> {
  readonly value = model(0);
  readonly disabled = input(false);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input(1);
  readonly ariaLabel = input<string | null>(null);
  /** Pose un cœur derrière la valeur (vitalité). */
  readonly heart = input(false);
  readonly touch = output();

  protected readonly isMin = computed(() => {
    const min = this.min();
    return min !== undefined && this.value() <= min;
  });
  protected readonly isMax = computed(() => {
    const max = this.max();
    return max !== undefined && this.value() >= max;
  });

  protected decrement(): void {
    this.setValue(this.value() - this.step());
  }

  protected increment(): void {
    this.setValue(this.value() + this.step());
  }

  // Entrée valide la saisie sans déclencher la soumission implicite du <form> parent
  protected onEnterKey(event: Event): void {
    event.preventDefault();
    (event.target as HTMLInputElement).blur();
  }

  protected onInput(event: Event): void {
    const parsed = Number((event.target as HTMLInputElement).value);
    this.setValue(Number.isFinite(parsed) ? parsed : 0);
  }

  private setValue(next: number): void {
    const min = this.min();
    const max = this.max();
    let clamped = next;
    if (min !== undefined) {
      clamped = Math.max(min, clamped);
    }
    if (max !== undefined) {
      clamped = Math.min(max, clamped);
    }

    this.value.set(clamped);
    this.touch.emit();
  }
}
