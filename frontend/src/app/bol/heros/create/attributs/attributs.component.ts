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
import {attributsFormValidator, attributValidator} from "../create.validators";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHeroCreateTools} from "../create.tools";
import {FieldsetModule} from "primeng/fieldset";
import {NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolMessageComponent} from "../../../message/message.component";
import {InputNumberModule} from "primeng/inputnumber";

@Component({
  selector: 'bol-heros-attributs',
  standalone: true,
  imports: [
    InputNumberModule,
    OverlayPanelModule,
    BolMessageComponent,
    ReactiveFormsModule,
    FieldsetModule,
    NgIf
  ],
  templateUrl: './attributs.component.html',
  styleUrl: './attributs.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosAttributsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BolHerosAttributsComponent),
      multi: true,
    }
  ]
})
export class BolHerosAttributsComponent implements ControlValueAccessor, Validator {
  readonly #fb = inject(FormBuilder);
  attributErrors: { control: string, error: string }[] = [];
  attributWarns: { step: string, warn: string }[] = [];

  public vigueurCtrl = new FormControl<number | null>(0, attributValidator);
  public agiliteCtrl = new FormControl<number | null>(0, attributValidator);
  public espritCtrl = new FormControl<number | null>(0, attributValidator);
  public auraCtrl = new FormControl<number | null>(0, attributValidator);

  attributsForm = this.#fb.group({
    vigueur: this.vigueurCtrl,
    agilite: this.agiliteCtrl,
    esprit: this.espritCtrl,
    aura: this.auraCtrl,
  }, { validators: attributsFormValidator });

  protected formChange = toSignal(this.attributsForm!.valueChanges);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      if (this.formChange()) {
        this.updateErrors();
        this.updateWarnings();
        this.onChange(this.attributsForm.value);
        this.onTouched();
      }
    });
  }

  private updateErrors() {
    this.attributErrors = [];
    // Gestion des erreurs par aptitudes
    Object.keys(this.attributsForm.controls).forEach(key => {
      const controlErrors = this.attributsForm.get(key)?.errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          if (['vigueur', 'agilite', 'aura', 'esprit'].includes(key)) {
            this.attributErrors.push({
              control: BolHeroCreateTools.translate(key),
              error: BolHeroCreateTools.translate(keyError)
            });
          }
        });
      }
    });

    // Obtenir les erreurs globales du formulaire
    const formErrors: ValidationErrors | null = this.attributsForm.errors;
    if (formErrors != null) {
      Object.keys(formErrors).forEach(keyError => {
        if (keyError === 'attrTooManyNegative') {
          this.attributErrors.push({error: 'Tu as le droit de diminuer une seule fois un attribut à -1', control: ''});
        }
        if (keyError === 'attrSumExceeded') {
          this.attributErrors.push({error: 'La somme des attributs ne doit pas dépasser 4', control: ''});
        }
      });
    }
  }

  private updateWarnings() {
    this.attributWarns = [];
    if (this.attributErrors.length === 0) {
      const controlsAttrIds = ['vigueur', 'agilite', 'aura', 'esprit'];
      const controlsAttrArray = controlsAttrIds.map(id => this.attributsForm.get(id));
      const attrs = controlsAttrArray.map(ctrl => ctrl?.value);
      const sumAttr = attrs.reduce((acc, val) => acc + val, 0);
      if (sumAttr < 4) {
        this.attributWarns.push({step: 'Attributs', warn: 'il manque ' + (4 - sumAttr) + ' pts dans les attributs'});
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
      this.attributsForm.patchValue(value);
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.attributsForm.disable();
    } else {
      this.attributsForm.enable();
    }
  }
  validate(control: AbstractControl): ValidationErrors | null {
    return this.attributsForm.valid ? null : { invalidForm: { valid: false, message: "Attributs form is invalid" } };
  }
}
