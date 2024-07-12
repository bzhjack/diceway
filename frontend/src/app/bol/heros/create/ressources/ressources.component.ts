import {Component, forwardRef, inject} from '@angular/core';
import {FieldsetModule} from "primeng/fieldset";
import {PrimeTemplate} from "primeng/api";
import {
  AbstractControl,
  ControlValueAccessor, FormBuilder, FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule, ValidationErrors,
  Validator
} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";

@Component({
  selector: 'bol-heros-ressources',
  standalone: true,
  imports: [
    FieldsetModule,
    PrimeTemplate,
    ReactiveFormsModule,
    InputTextModule
  ],
  templateUrl: './ressources.component.html',
  styleUrl: './ressources.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolRessourcesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BolRessourcesComponent),
      multi: true,
    }
  ]
})
export class BolRessourcesComponent implements ControlValueAccessor , Validator{

  readonly #fb = inject(FormBuilder);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};
  public vitaliteCtrl = new FormControl<number | null>(0);
  public heroismeCtrl = new FormControl<number | null>(5);
  ressourcesForm = this.#fb.group({
    vitalite: this.vitaliteCtrl,
    heroisme: this.heroismeCtrl
  });


  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (value) {
      this.ressourcesForm.patchValue(value);
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.ressourcesForm.disable();
    } else {
      this.ressourcesForm.enable();
    }
  }
  validate(control: AbstractControl): ValidationErrors | null {
    return this.ressourcesForm.valid ? null : { invalidForm: { valid: false, message: "Aptitudes form is invalid" } };
  }
}
