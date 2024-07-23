import {Component, effect, forwardRef, inject} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator
} from "@angular/forms";
import {InputNumberModule} from "primeng/inputnumber";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolMessageComponent} from "../../../message/message.component";
import {FieldsetModule} from "primeng/fieldset";
import {attributValidator, combatFormValidator} from "../create.validators";
import {NgIf} from "@angular/common";
import {toSignal} from '@angular/core/rxjs-interop';
import {BolHeroCreateTools} from '../create.tools';

@Component({
  selector: 'bol-heros-combat',
  standalone: true,
  imports: [
    InputNumberModule,
    OverlayPanelModule,
    BolMessageComponent,
    ReactiveFormsModule,
    FieldsetModule,
    NgIf
  ],
  templateUrl: './combat.component.html',
  styleUrl: './combat.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosCombatComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BolHerosCombatComponent),
      multi: true,
    }
  ]
})
export class BolHerosCombatComponent implements ControlValueAccessor, Validator {
  readonly #fb = inject(FormBuilder);
  aptitudeErrors: { control: string, error: string }[] = [];
  aptitudeWarns: { step: string, warn: string }[] = [];

  public initiativeCtrl = new FormControl<number | null>(0, attributValidator);
  public meleeCtrl = new FormControl<number | null>(0, attributValidator);
  public tirCtrl = new FormControl<number | null>(0, attributValidator);
  public defenseCtrl = new FormControl<number | null>(0, attributValidator);

  aptitudesForm = this.#fb.group({
    initiative: this.initiativeCtrl,
    melee: this.meleeCtrl,
    tir: this.tirCtrl,
    defense: this.defenseCtrl,
  }, { validators: combatFormValidator });

  protected formChange = toSignal(this.aptitudesForm!.valueChanges);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      if (this.formChange()) {
        this.updateErrors();
        this.updateWarnings();
        this.onChange(this.aptitudesForm.value);
        this.onTouched();
      }
    });
  }

  private updateErrors() {
    this.aptitudeErrors = [];
    // Gestion des erreurs par aptitudes
    Object.keys(this.aptitudesForm.controls).forEach(key => {
      const controlErrors = this.aptitudesForm.get(key)?.errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          if (['melee', 'tir', 'defense', 'initiative'].includes(key)) {
            this.aptitudeErrors.push({
              control: BolHeroCreateTools.translate(key),
              error: BolHeroCreateTools.translate(keyError)
            });
          }
        });
      }
    });

    // Obtenir les erreurs globales du formulaire
    const formErrors: ValidationErrors | null = this.aptitudesForm.errors;
    // Si des erreurs globales sont présentes, les traiter
    if (formErrors != null) {
      Object.keys(formErrors).forEach(keyError => {
        if (keyError === 'aptTooManyNegative') {
          this.aptitudeErrors.push({ error: 'Tu as le droit de diminuer une seule fois une aptitude à -1', control: '' });
        }
        if (keyError === 'aptSumExceeded') {
          this.aptitudeErrors.push({ error: 'La somme des aptitudes ne doit pas dépasser 4', control: '' });
        }
      });
    }
  }

  private updateWarnings() {
    this.aptitudeWarns = [];
    if (this.aptitudeErrors.length === 0) {
      const controlsAptIds = ['tir', 'melee', 'defense', 'initiative'];
      const controlsAptArray = controlsAptIds.map(id => this.aptitudesForm.get(id));
      const apts = controlsAptArray.map(ctrl => ctrl?.value);
      const sumApt = apts.reduce((acc, val) => acc + val, 0);
      if (sumApt < 4) {
        this.aptitudeWarns.push({
          step: 'Aptitudes',
          warn: 'il manque ' + (4 - sumApt) + ' pts dans les aptitudes de combat'
        });
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (value) {
      this.aptitudesForm.patchValue(
        {
          defense: Number(value.defense),
          initiative: Number(value.initiative),
          melee: Number(value.melee),
          tir: Number(value.tir)
        }
      );
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.aptitudesForm.disable();
    } else {
      this.aptitudesForm.enable();
    }
  }
  validate(control: AbstractControl): ValidationErrors | null {
    return this.aptitudesForm.valid ? null : { invalidForm: { valid: false, message: "Aptitudes form is invalid" } };
  }
}
