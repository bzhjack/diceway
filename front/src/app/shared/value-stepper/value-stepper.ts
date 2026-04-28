import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';

@Component({
  selector: 'app-value-stepper',
  templateUrl: './value-stepper.html',
  styleUrl: './value-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValueStepperComponent {
  readonly value = input.required<number>();
  readonly min = input(0);
  readonly max = input(9);
  readonly step = input(1);
  readonly prefix = input('');
  readonly ariaLabel = input<string | null>(null);
  readonly decrementAriaLabel = input('Diminuer');
  readonly incrementAriaLabel = input('Augmenter');

  readonly valueChanged = output<number>();

  protected readonly isMin = computed(() => this.value() <= this.min());
  protected readonly isMax = computed(() => this.value() >= this.max());

  protected decrement(): void {
    if (this.isMin()) return;
    this.valueChanged.emit(Math.max(this.min(), this.value() - this.step()));
  }

  protected increment(): void {
    if (this.isMax()) return;
    this.valueChanged.emit(Math.min(this.max(), this.value() + this.step()));
  }
}

