import {Component, computed, effect, forwardRef, inject, input, OnDestroy} from '@angular/core';
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
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {BolArmureModel} from "../../../models/bol-armure.model";
import {JsonPipe} from "@angular/common";
import {BolRegionModel} from "../../../models/bol-region.model";
import {BolHerosService} from "../../../services/bol-heros.service";
import {NgxSpinnerService} from "ngx-spinner";
import {BolRegionComponent} from "./region/region.component";

@Component({
  selector: 'app-origines',
  standalone: true,
  imports: [
    FieldsetModule,
    ReactiveFormsModule,
    InputTextModule,
    TooltipModule,
    JsonPipe
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
export class BolOriginesComponent implements ControlValueAccessor, OnDestroy {
  readonly #fb = inject(FormBuilder);
  readonly #ds = inject(DialogService);
  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);

  private subs?: Subscription;
  private subsAvatar?: Subscription;

  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);
  public regionIdCtrl = new FormControl<number | null>(null);

  originesForm = this.#fb.group({
    nom: this.nomCtrl,
    avatar: this.avatarCtrl,
    region_id: this.regionIdCtrl
  });

  private onChange: (value: any) => void = () => {
  };
  private onTouched: () => void = () => {
  };
  protected regionList = this.#bhss.regionList;
  protected selectedRegion = computed(() => {
    return this.regionList()?.find((region: BolRegionModel) => region.id === this.formChange()?.region_id)
  });
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
      this.#spinner.show();
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
        this.subsAvatar?.unsubscribe();
        this.subsAvatar = this.#bhs.updateAvatarHeros(this.heroId() as string, avatar).subscribe(
          {
            next: _ => {
              this.#spinner.hide();
            },
            error: () => {
              this.#spinner.hide();
            }
          }
        );
      }
    });
  }

  /**
   * Sélection de la région
   */
  region() {
    const currentRegionId = this.regionIdCtrl.value;
    const ref = this.#ds.open(BolRegionComponent, {
      header: 'Choix de la région',
      width: '1200px',
      height: '90vh',
      data: {
        id_region: currentRegionId
      },
    });
    this.subs?.unsubscribe();
    this.subs = ref?.onClose.subscribe((data: any) => {
      if (data) {
        this.regionIdCtrl.setValue(data.region.id);
        if (data.nom) {
          this.nomCtrl.setValue(data.nom);
        }
      }
    });
  }

  clearRegion(ev: MouseEvent) {
    ev.stopPropagation();
    this.regionIdCtrl.setValue(null);
  }


  ngOnDestroy() {
    this.subs?.unsubscribe();
    this.subsAvatar?.unsubscribe();
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
    return this.originesForm.valid ? null : {invalidForm: {valid: false, message: "Origines form is invalid"}};
  }
}
