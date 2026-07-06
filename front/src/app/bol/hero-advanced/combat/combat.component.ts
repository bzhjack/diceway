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
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {toSignal} from '@angular/core/rxjs-interop';
import {BolHerosCombat} from '../../models/bol-heros.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {HeroAdvancedCreateTools} from '../create.tools';
import {attributValidator, combatFormValidatorFn} from '../create.validators';

@Component({
  selector: 'bol-hero-advanced-combat',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './combat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedCombatComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HeroAdvancedCombatComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedCombatComponent implements ControlValueAccessor, Validator {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosStateService = inject(BolHerosStateService);

  protected readonly initiativeCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly meleeCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly tirCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly defenseCtrl = new FormControl<number | null>(0, attributValidator);
  protected readonly aptitudeErrors = signal<{control: string; error: string}[]>([]);
  protected readonly aptitudeWarns = signal<{step: string; warn: string}[]>([]);

  protected readonly combatBudget = this.herosStateService.combatBudget;

  protected readonly combatForm = this.formBuilder.group(
    {
      initiative: this.initiativeCtrl,
      melee: this.meleeCtrl,
      tir: this.tirCtrl,
      defense: this.defenseCtrl,
    },
    {validators: combatFormValidatorFn(4)},
  );
  protected readonly formChange = toSignal(this.combatForm.valueChanges, {
    initialValue: this.combatForm.getRawValue(),
  });

  private onChange: (value: BolHerosCombat) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.updateErrors();
      this.updateWarnings();
      this.onChange(this.combatForm.getRawValue() as BolHerosCombat);
      this.onTouched();
    });

    // E11: update validator when Non-combattant changes
    effect(() => {
      const budget = this.combatBudget();
      this.combatForm.setValidators(combatFormValidatorFn(budget));
      this.combatForm.updateValueAndValidity();
    });
  }

  writeValue(value: BolHerosCombat | null): void {
    if (!value) {
      return;
    }

    this.combatForm.patchValue({
      initiative: Number(value.initiative),
      melee: Number(value.melee),
      tir: Number(value.tir),
      defense: Number(value.defense),
    });
  }

  registerOnChange(fn: (value: BolHerosCombat) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.combatForm.valid ? null : {invalidForm: true};
  }

  private updateErrors(): void {
    const errors: {control: string; error: string}[] = [];
    for (const key of Object.keys(this.combatForm.controls)) {
      const controlErrors = this.combatForm.get(key)?.errors;
      if (controlErrors) {
        for (const errorKey of Object.keys(controlErrors)) {
          errors.push({
            control: HeroAdvancedCreateTools.translate(key),
            error: HeroAdvancedCreateTools.translate(errorKey),
          });
        }
      }
    }

    const formErrors = this.combatForm.errors;
    if (formErrors?.['aptTooManyNegative']) {
      errors.push({control: '', error: 'Une seule aptitude de combat peut descendre a -1.'});
    }
    if (formErrors?.['aptSumExceeded']) {
      errors.push({control: '', error: `La somme des aptitudes de combat ne doit pas dépasser ${this.combatBudget()}.`});
    }

    this.aptitudeErrors.set(errors);
  }

  private updateWarnings(): void {
    const warnings: {step: string; warn: string}[] = [];
    if (!this.aptitudeErrors().length) {
      const values = ['initiative', 'melee', 'tir', 'defense'].map((key) =>
        Number(this.combatForm.get(key)?.value ?? 0),
      );
      const budget = this.combatBudget();
      const sum = values.reduce((total, value) => total + value, 0);
      if (sum < budget) {
        const prefix = this.herosStateService.isNonCombattant() ? '⚔ Non-combattant — ' : '';
        warnings.push({step: 'Combat', warn: `${prefix}Il manque ${budget - sum} point(s) dans le combat (budget : ${budget}).`});
      }
    }

    this.aptitudeWarns.set(warnings);
    this.herosStateService.setWarnCombat(warnings);
  }
}
