import {Component, computed, effect, forwardRef, inject, OnDestroy, signal} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {FieldsetModule} from "primeng/fieldset";
import {ConfirmationService, PrimeTemplate} from "primeng/api";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {DropdownModule} from "primeng/dropdown";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {Ripple} from "primeng/ripple";

import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator
} from "@angular/forms";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolHerosService} from "../../../services/bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolMessageComponent} from "../../../message/message.component";
import {InputNumberModule} from "primeng/inputnumber";
import {TableModule} from "primeng/table";
import {BolHerosLangueModel, BolLangueModel} from "../../../models/bol-langue.model";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {TooltipModule} from "primeng/tooltip";
import {BtnComponent} from "../../../../shared/btn/btn.component";

@Component({
  selector: 'bol-heros-langues',
  standalone: true,
    imports: [
        Button,
        FieldsetModule,
        PrimeTemplate,
        ButtonDirective,
        DropdownModule,
        NgIf,
        OverlayPanelModule,
        Ripple,
        FormsModule,
        NgForOf,
        ReactiveFormsModule,
        BolMessageComponent,
        InputNumberModule,
        BtnComponent,
        TableModule,
        JsonPipe,
        ScrollPanelModule,
        TooltipModule
    ],
  templateUrl: './langues.component.html',
  styleUrl: './langues.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosLanguesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BolHerosLanguesComponent),
      multi: true,
    }
  ]
})
export class BolHerosLanguesComponent implements ControlValueAccessor, OnDestroy, Validator {
  private subs?: Subscription;
  public selectedLangue = signal<BolLangueModel | null>(null);
  readonly #fb = inject(FormBuilder);
  langueErrors: { control: string, error: string }[] = [];
  langueWarns: { step: string, warn: string }[] = [];


  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);
  readonly #cs = inject(ConfirmationService);

  languesForm = this.#fb.group({
    langues: this.#fb.array([])
  });
  protected formChange = toSignal(this.languesForm!.valueChanges);

  get langues() {
    return this.languesForm.get('langues') as FormArray;
  }

  protected langueList = this.#bhss.langueList;
  protected selectedLangueIds = toSignal(this.languesForm.get('langues')!.valueChanges);
  protected filteredLangueList = computed(() => {
    return this.langueList()?.filter((langue: BolLangueModel) => !this.selectedLangueIds()?.includes(langue.id));
  });

  protected heroId = computed(() => this.#bhss.currentHeros()?.id);
  protected availableLang = computed(() => {
    const hero = this.#bhss.currentHeros();
    const sumCar = hero?.carrieres.filter((car) => [1, 24, 12, 16, 18, 14, 21, 22].includes(car.carriere_id ?? -1)).reduce((sum, car) => sum + (Number(car.value) || 0), 0) ?? 0;
    const esprit = hero?.attributs.esprit ?? 0;
    return esprit + sumCar - this.langues.length;
  });

  constructor() {
    effect(() => {
      if (this.availableLang() !== null) {
        this.updateWarnings();
      }
      if (this.formChange()) {
        this.updateErrors();
        this.updateWarnings();
        this.onChange(this.languesForm.get('langues')?.value);
        this.onTouched();
      }
    });
  }

  private updateWarnings() {
    this.langueWarns = [];
    if (this.langueErrors.length > 0) {
      return;
    }
    if (this.availableLang() > 0) {
      this.langueWarns.push({
        step: 'Langues',
        warn: 'Vous pouvez encore choisir ' + this.availableLang() + ' langue(s)'
      });
    }
  }

  private updateErrors() {
    this.langueErrors = [];
    if (this.availableLang() < 0) {
      this.langueErrors.push({
        control: 'Langues',
        error: 'Vous avez ' + this.availableLang() * -1 + ' langue(s) en trop'
      });
    }
    if (this.langueErrors.length > 0) {
      this.languesForm.setErrors({'langCount': this.availableLang()})
    } else {
      this.languesForm.setErrors(null);
    }
  }

  langueFromId(id: number) {
    const langue = this.langueList()?.find((itemLang: BolLangueModel) => itemLang.id === id)?.langue;
    return langue ?? null;
  }

  addLangue(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    if (this.selectedLangue() === null) {
      return;
    }
    const langue: BolHerosLangueModel = {
      langue_id: this.selectedLangue()?.id as number
    }
    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createLangue(this.heroId(), langue).subscribe({
      next: _ => {
        this.#spinner.hide();
        this.langues.push(new FormControl(langue.langue_id));
      },
      error: () => {
        this.#spinner.hide();
      }
    });
  }

  deleteLangue(langueId: number, event: any) {
    this.#cs.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cette langue ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.#spinner.show();
        this.subs?.unsubscribe();
        this.subs = this.#bhs.deleteLangue(this.heroId() as string, langueId).subscribe({
          next: _ => {
            this.#spinner.hide();
            this.removeLangue(langueId);
          },
          error: () => {
            this.#spinner.hide();
          }
        });
      },
    });
  }

  removeLangue(langueId: number) {
    const index = this.langues.value.findIndex((langue_id: number) => langue_id === langueId)
    if (index !== -1) this.langues.removeAt(index)
  }

  private onChange: (langues: any) => void = () => {
    // do nothing by default
  };
  onTouched: () => void = () => {
    // do nothing by default
  };

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any[]): void {
    if (value) {
      this.langues.clear();
      for (const val of value) {
        this.langues.push(new FormControl(val));
      }
    }
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
  validate(control: AbstractControl): ValidationErrors | null {
    return this.languesForm.valid ? null : { invalidForm: { valid: false, message: "Lang form is invalid" } };
  }
}
