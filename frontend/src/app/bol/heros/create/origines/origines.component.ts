import {Component, effect, forwardRef, inject, input, OnDestroy} from '@angular/core';
import {FieldsetModule} from "primeng/fieldset";
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl, FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators
} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {TooltipModule} from "primeng/tooltip";
import {PictureComponent} from "../../../../shared/picture/picture.component";
import {DialogService} from "primeng/dynamicdialog";
import {Subscription} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {JsonPipe, NgIf} from "@angular/common";
import {BolHerosService} from "../../../services/bol-heros.service";
import {NgxSpinnerService} from "ngx-spinner";
import {BolHerosRegionComponent} from "./region/region.component";
import {BolMessageComponent} from "../../../message/message.component";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolHeroCreateTools} from "../create.tools";
import {BolHerosOrigines} from "../../../models/bol-heros.model";
import {BolHerosLanguesComponent} from "../langues/langues.component";
import {BolHerosLangueModel} from "../../../models/bol-langue.model";

@Component({
  selector: 'bol-heros-origines',
  standalone: true,
  imports: [
    FieldsetModule,
    ReactiveFormsModule,
    InputTextModule,
    TooltipModule,
    JsonPipe,
    BolMessageComponent,
    NgIf,
    OverlayPanelModule,
    BolHerosLanguesComponent
  ],
  templateUrl: './origines.component.html',
  styleUrl: './origines.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosOriginesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BolHerosOriginesComponent),
      multi: true,
    }
  ]
})
export class BolHerosOriginesComponent implements ControlValueAccessor, Validator, OnDestroy {

  originesErrors: { control: string, error: string }[] = [];
  originesWarns: { step: string, warn: string }[] = [];

  readonly #fb = inject(FormBuilder);
  readonly #ds = inject(DialogService);
  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);

  private subs?: Subscription;
  private subOrig?: Subscription;

  public joueurCtrl = new FormControl('', Validators.required);
  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);
  public regionIdCtrl = new FormControl<number | null>(null);
  public languesCtrl = new FormControl<number[]>([]);

  originesForm = this.#fb.group({
    joueur: this.joueurCtrl,
    nom: this.nomCtrl,
    avatar: this.avatarCtrl,
    region_id: this.regionIdCtrl,
    langues: this.languesCtrl
  });

  private onChange: (value: any) => void = () => {
  };
  private onTouched: () => void = () => {
  };

  protected formChange = toSignal(this.originesForm!.valueChanges);
  protected currentRegion = this.#bhss.currentHerosRegion;

  public heroId = input<string | null | undefined>(null);

  constructor() {
    effect(() => {
      if (this.formChange()) {
        this.updateErrors();
        this.updateWarnings();
        this.onChange(this.originesForm.value);
        this.onTouched();
      }
    });
  }

  private updateErrors() {
    this.originesErrors = [];
    // Gestion des erreurs par aptitudes
    Object.keys(this.originesForm.controls).forEach(key => {
      const controlErrors = this.originesForm.get(key)?.errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          this.originesErrors.push({
            control: BolHeroCreateTools.translate(key),
            error: BolHeroCreateTools.translate(keyError)
          });
        });
      }
    });
  }

  private updateWarnings() {
    this.originesWarns = [];
    if (!this.originesErrors.length) {
      if (!this.regionIdCtrl.value) {
        this.originesWarns.push({
          step: 'Région',
          warn: 'Vous devez choisir une région.'
        });
      }
    }
  }


  picture() {
    const ref = this.#ds.open(PictureComponent, {header: 'Photo du héros'});
    this.subs?.unsubscribe();
    this.subs = ref.onClose.subscribe((avatar: any) => {
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
        this.updateOrigines();
      }
    });
  }

  /**
   * Maj des origines
   */
  updateOrigines() {
    this.#spinner.show();
    this.subOrig?.unsubscribe();
    this.subOrig = this.#bhs.updateOriginesHeros(this.heroId() as string, this.formChange() as BolHerosOrigines).subscribe(
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

  /**
   * Sélection de la région
   */
  region() {
    const currentRegionId = this.regionIdCtrl.value;
    const ref = this.#ds.open(BolHerosRegionComponent, {
      header: 'Choix de la région',
      //width: '1200px',
      width: '80vw',
      height: '90vh',
      data: {
        id_region: currentRegionId,
        nom: this.nomCtrl.value
      },
    });
    this.subs?.unsubscribe();
    this.subs = ref?.onClose.subscribe((data: any) => {
      if (data) {
        this.regionIdCtrl.setValue(data.region.id);
        if (data.nom) {
          this.nomCtrl.setValue(data.nom);
        }
        this.updateOrigines();
      }
    });
  }

  clearRegion(ev: MouseEvent) {
    ev.stopPropagation();
    this.regionIdCtrl.setValue(null);
  }


  ngOnDestroy() {
    this.subs?.unsubscribe();
    this.subOrig?.unsubscribe();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (value) {
      this.originesForm.patchValue({
        avatar: value.avatar,
        nom: value.nom,
        joueur: value.joueur,
        region_id: Number(value.region_id),
        langues: value.langues.map((item: BolHerosLangueModel) => (item as BolHerosLangueModel).langue_id)
      });
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
