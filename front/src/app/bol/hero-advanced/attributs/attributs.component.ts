import {ChangeDetectionStrategy, Component, effect, forwardRef, inject, signal} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputNumberModule} from 'primeng/inputnumber';
import {toSignal} from '@angular/core/rxjs-interop';
import {BolHerosAttributs} from '../../models/bol-heros.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {HeroAdvancedCreateTools} from '../create.tools';
import {attributValidator, attributsFormValidator} from '../create.validators';

@Component({
  selector: 'bol-hero-advanced-attributs',
  imports: [ReactiveFormsModule, IftaLabelModule, InputNumberModule],
  templateUrl: './attributs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedAttributsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HeroAdvancedAttributsComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedAttributsComponent implements ControlValueAccessor, Validator {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosStateService = inject(BolHerosStateService);

  protected readonly vigueurCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly agiliteCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly espritCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly auraCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly attributErrors = signal<{control: string; error: string}[]>([]);
  protected readonly attributWarns = signal<{step: string; warn: string}[]>([]);

  protected readonly attributsForm = this.formBuilder.group(
    {
      vigueur: this.vigueurCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      aura: this.auraCtrl,
    },
    {validators: attributsFormValidator},
  );
  protected readonly formChange = toSignal(this.attributsForm.valueChanges, {
    initialValue: this.attributsForm.getRawValue(),
  });

  private onChange: (value: BolHerosAttributs) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.updateErrors();
      this.updateWarnings();
      this.onChange(this.attributsForm.getRawValue() as BolHerosAttributs);
      this.onTouched();
    });
  }

  writeValue(value: BolHerosAttributs | null): void {
    if (!value) {
      return;
    }

    this.attributsForm.patchValue({
      vigueur: Number(value.vigueur),
      agilite: Number(value.agilite),
      esprit: Number(value.esprit),
      aura: Number(value.aura),
    });
  }

  registerOnChange(fn: (value: BolHerosAttributs) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.attributsForm.valid ? null : {invalidForm: true};
  }

  private updateErrors(): void {
    const errors: {control: string; error: string}[] = [];
    for (const key of Object.keys(this.attributsForm.controls)) {
      const controlErrors = this.attributsForm.get(key)?.errors;
      if (controlErrors) {
        for (const errorKey of Object.keys(controlErrors)) {
          errors.push({
            control: HeroAdvancedCreateTools.translate(key),
            error: HeroAdvancedCreateTools.translate(errorKey),
          });
        }
      }
    }

    const formErrors = this.attributsForm.errors;
    if (formErrors?.['attrTooManyNegative']) {
      errors.push({control: '', error: 'Un seul attribut peut descendre a -1.'});
    }
    if (formErrors?.['attrSumExceeded']) {
      errors.push({control: '', error: 'La somme des attributs ne doit pas dépasser 4.'});
    }

    this.attributErrors.set(errors);
  }

  private updateWarnings(): void {
    const warnings: {step: string; warn: string}[] = [];
    if (!this.attributErrors().length) {
      const values = ['vigueur', 'agilite', 'aura', 'esprit'].map((key) =>
        Number(this.attributsForm.get(key)?.value ?? 0),
      );
      const sum = values.reduce((total, value) => total + value, 0);
      if (sum < 4) {
        warnings.push({step: 'Attributs', warn: `Il manque ${4 - sum} point(s) dans les attributs.`});
      }
    }

    this.attributWarns.set(warnings);
    this.herosStateService.setWarnAttrs(warnings);
  }
}
