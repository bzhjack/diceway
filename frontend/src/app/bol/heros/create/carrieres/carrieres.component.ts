import {Component, computed, effect, forwardRef, inject, OnDestroy, signal} from '@angular/core';
import {BolMessageComponent} from "../../../message/message.component";
import {Button, ButtonDirective} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {FieldsetModule} from "primeng/fieldset";
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator
} from "@angular/forms";
import {InputNumberModule} from "primeng/inputnumber";
import {JsonPipe, NgForOf, NgIf, NgTemplateOutlet} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {ConfirmationService, PrimeTemplate} from "primeng/api";
import {Ripple} from "primeng/ripple";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {BolHerosService} from "../../../services/bol-heros.service";
import {NgxSpinnerService} from "ngx-spinner";
import {BolCarriereModel, BolHerosCarriereModel} from "../../../models/bol-carriere.model";
import {toSignal} from "@angular/core/rxjs-interop";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {carrieresFormValidator, carriereValidator} from "../create.validators";
import {BolHeroCreateTools} from "../create.tools";
import {Subscription} from "rxjs";
import {TrashComponent} from "../../../../shared/trash/trash.component";
import {TooltipModule} from "primeng/tooltip";
import {BolAvantageModel} from "../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../models/bol-desavantage.model";
import {BolHerosTraitsModel} from "../../../models/bol-trait.model";


@Component({
  selector: 'bol-heros-carrieres',
  standalone: true,
  imports: [
    BolMessageComponent,
    Button,
    ButtonDirective,
    DropdownModule,
    FieldsetModule,
    FormsModule,
    InputNumberModule,
    NgForOf,
    NgIf,
    NgTemplateOutlet,
    OverlayPanelModule,
    PrimeTemplate,
    ReactiveFormsModule,
    Ripple,
    TrashComponent,
    JsonPipe,
    TooltipModule
  ],
  templateUrl: './carrieres.component.html',
  styleUrl: './carrieres.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosCarrieresComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BolHerosCarrieresComponent),
      multi: true,
    }
  ]
})
export class BolHerosCarrieresComponent implements ControlValueAccessor, Validator , OnDestroy {
  private subs?: Subscription;
  readonly #fb = inject(FormBuilder);
  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);
  readonly #cs = inject(ConfirmationService);

  carriereErrors: { control: string, error: string }[] = [];
  carriereWarns: { step: string, warn: string }[] = [];

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  carrieresForm = this.#fb.group({
    carrieres: this.#fb.array([])
  }, { validators: carrieresFormValidator });
  get carrieres() {
    return this.carrieresForm.controls["carrieres"] as FormArray;
  }
  protected selectedCarriere = signal<BolCarriereModel|null>(null);
  protected heroId = computed(() => this.#bhss.currentHeros()?.id);
  protected carrieresList = this.#bhss.carriereList;
  protected availableCarrieres = computed(() => {
    const carrieres: BolHerosCarriereModel[] = <BolHerosCarriereModel[]>this.formChange()?.carrieres;
    const carriereIdsInArray = carrieres.map(carriere => carriere.carriere_id);
    return this.carrieresList()?.filter((carriere: BolCarriereModel) => !carriereIdsInArray.includes(carriere.id));
  });
  protected formChange = toSignal(this.carrieresForm!.valueChanges);
  protected carriereDesavangeCount = this.#bhss.carriereDesavangeCount;
  protected desavantagesList = this.#bhss.desavantagesList;
  public selectedTrait = signal<BolDesavantageModel | null>(null);
  constructor() {
    effect(() => {
      if (this.formChange()) {
        this.updateErrors();
        this.updateWarnings();
        this.onChange(this.carrieresForm.get('carrieres')?.value);
        this.onTouched();
      }
    });
  }
  private updateErrors() {
    this.carriereErrors = [];
    // Check des carrières
    this.carrieres.controls.forEach((control, index) => {
      const errors = control.get('value')?.errors;
      if (errors) {
        const idCarriere = this.carrieres.at(index).get('carriere_id')?.value;
        const carriere = this.carriereFromId(idCarriere)?.carriere;
        Object.keys(errors).forEach(keyError => {
          this.carriereErrors.push({
            control:  carriere ? carriere : '',
            error: BolHeroCreateTools.translate(keyError),
          });
        });
      }
    });

    // Obtenir les erreurs globales du formulaire
    const formErrors: ValidationErrors | null = this.carrieresForm.errors;
    // Si des erreurs globales sont présentes, les traiter
    if (formErrors != null) {
      // Itérer sur chaque erreur globale
      Object.keys(formErrors).forEach(keyError => {
        // Afficher dans la console le type d'erreur globale et la valeur de l'erreur
        if (keyError === 'carrSumExceeded') {
          this.carriereErrors.push({error: 'La somme des carrières ne doit pas dépasser 4', control: ''});
        }
      });
    }
  }

  private updateWarnings() {
    this.carriereWarns = [];
    // Controle sur les carrières
    if (this.carriereErrors.length === 0) {
      if (this.carrieres.length != 4) {
        this.carriereWarns.push({
          step: 'Carrières',
          warn: 'Vous devez choisir 4 carrières.'
        });
      }
      let sumCarriere = 0;
      for (const c of this.carrieres.controls) {
        sumCarriere += c.get('value')?.value;
      }
      if (sumCarriere < 4) {
        this.carriereWarns.push({
          step: 'Aptitudes',
          warn: 'il manque ' + (4 - sumCarriere) + ' pts dans les carrières.'
        });
      }
      // Gestion des désavantages pour les carrières
      if (this.carriereDesavangeCount()) {
        this.carriereWarns.push({
          step: 'Traits',
          warn: `<strong>Carrière dangereuse :</strong> <br> Vous devez choisir ${this.carriereDesavangeCount()} désavantage(s) supplémentaire.`
        });
      }
    }
  }

  carriereFromId(id: number) {
    const carriere = this.carrieresList()?.find((itemCar: BolCarriereModel) => itemCar.id === id);
    return carriere ?? {carriere: null, description: null};
  }
  removeCarriere(carriereId: number) {
    const index = this.carrieres.value.findIndex((car: BolHerosCarriereModel) => car.carriere_id === carriereId)
    if (index !== -1) this.carrieres.removeAt(index)
  }
  addCarriere(carriere: BolHerosCarriereModel) {
    const carriereForm = this.#fb.group({
      carriere_id: [carriere.carriere_id],
      value: [carriere.value, carriereValidator]
    });
    this.carrieres.push(carriereForm);
  }


  deleteCarriere(carriereId: number, event: any) {
    this.#cs.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cette carrière ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.#spinner.show();
        this.subs?.unsubscribe();
        this.subs = this.#bhs.deleteCarriere(this.heroId() as string, carriereId).subscribe({
          next: _ => {
            this.#spinner.hide();
            this.removeCarriere(carriereId);
          },
          error: () => {
            this.#spinner.hide();
          }
        });
      },
    });
  }

  createCarriere(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    if (this.selectedCarriere === null) {
      return;
    }
    const carriere: BolHerosCarriereModel = {
      carriere_id: this.selectedCarriere()?.id,
      value: 0
    }
    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createCarriere(this.heroId() as string, carriere).subscribe({
      next: _ => {
        this.#spinner.hide();
        this.addCarriere(carriere);
      },
      error: () => {
        this.#spinner.hide();
      }
    });
  }


  addTraits(panel: OverlayPanel, event: any): void {
    panel.toggle(event);
    if (this.selectedTrait() === null) {
      return;
    }
    const trait: BolHerosTraitsModel = {
      traitable_id: this.selectedTrait()?.id as number,
      type: 'D',
      detail: this.selectedTrait()?.pivot?.detail ?? null,
      region_id: this.selectedTrait()?.pivot?.region_id ?? null,
      carriere: true
    }

    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createTrait(this.heroId(), trait).subscribe({
      next: (newTrait) => {
        this.#spinner.hide();
      },
      error: () => {
        this.#spinner.hide();
      }
    });
  }



  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(carrieres: BolHerosCarriereModel[]): void {
      if (carrieres) {
        this.carrieres.clear();
        for (const carriere of carrieres) {
          const carriereForm = this.#fb.group({
            carriere_id: [carriere.carriere_id],
            value: [carriere.value, carriereValidator]
          });
          this.carrieres.push(carriereForm);
        }
      }
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.carrieresForm.disable();
    } else {
      this.carrieresForm.enable();
    }
  }
  validate(control: AbstractControl): ValidationErrors | null {
    return this.carrieresForm.valid ? null : { invalidForm: { valid: false, message: "Carrieres form is invalid" } };
  }
  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
