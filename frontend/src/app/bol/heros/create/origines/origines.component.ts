import {Component, effect, forwardRef, inject, input} from '@angular/core';
import {FieldsetModule} from "primeng/fieldset";
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule, ValidationErrors,
  Validators
} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {TooltipModule} from "primeng/tooltip";
import {PictureComponent} from "../../../../shared/picture/picture.component";
import {DialogService} from "primeng/dynamicdialog";
import {Subscription} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-origines',
  standalone: true,
  imports: [
    FieldsetModule,
    ReactiveFormsModule,
    InputTextModule,
    TooltipModule
  ],
  templateUrl: './origines.component.html',
  styleUrl: './origines.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolOriginesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BolOriginesComponent),
      multi: true,
    }
  ]
})
export class BolOriginesComponent implements ControlValueAccessor {
  readonly #fb = inject(FormBuilder);
  readonly #ds = inject(DialogService);
  private subs?: Subscription;

  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);
  public regionIdCtrl = new FormControl<number | null>(null);
  originesForm = this.#fb.group({
    nom: this.nomCtrl,
    avatar: this.avatarCtrl,
    region_id: this.regionIdCtrl
  });

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};
  protected formChange = toSignal(this.originesForm!.valueChanges);
  public heroId = input<string | null | undefined>(null);

  constructor() {
    effect(() => {
      if (this.formChange()) {
        this.onChange(this.originesForm.value);
        this.onTouched();
      }
    });
  }


  picture() {
    const ref = this.#ds.open(PictureComponent, {header: 'Photo du héros'});
    this.subs?.unsubscribe();
    this.subs = ref.onClose.subscribe((avatar: any) => {
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
        //this.submit();
      }
    });
  }
  region() {}
  clearRegion(ev: MouseEvent) {
    ev.stopPropagation();
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (value) {
      console.log(value);
      this.originesForm.patchValue(value);
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.originesForm.disable();
    } else {
      this.originesForm.enable();
    }
  }
  validate(control: AbstractControl): ValidationErrors | null {
    return this.originesForm.valid ? null : { invalidForm: { valid: false, message: "Origines form is invalid" } };
  }
}
