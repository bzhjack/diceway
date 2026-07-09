import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ControlValueAccessor, NgControl} from '@angular/forms';

@Component({
  selector: 'dw-value-stepper',
  templateUrl: './value-stepper.html',
  styleUrl: './value-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwValueStepperComponent implements ControlValueAccessor, OnInit {
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  readonly ariaLabel = input<string | null>(null);

  protected readonly value = signal(0);
  protected readonly disabled = signal(false);

  protected readonly isMin = computed(() => {
    const min = this.min();
    return min !== null && this.value() <= min;
  });
  protected readonly isMax = computed(() => {
    const max = this.max();
    return max !== null && this.value() >= max;
  });

  // Injecté puis câblé à la main (pas de NG_VALUE_ACCESSOR en provider) pour
  // pouvoir écouter valueChanges : Angular ne resynchronise pas les autres vues
  // liées au même FormControl quand la modification vient d'une vue.
  private readonly ngControl = inject(NgControl, {self: true, optional: true});
  private readonly destroyRef = inject(DestroyRef);

  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.ngControl?.control?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: number | null) => this.value.set(Number(value) || 0));
  }

  writeValue(value: number | null): void {
    this.value.set(Number(value) || 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

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
    if (min !== null) {
      clamped = Math.max(min, clamped);
    }
    if (max !== null) {
      clamped = Math.min(max, clamped);
    }

    this.value.set(clamped);
    this.onChange(clamped);
    this.onTouched();
  }
}
