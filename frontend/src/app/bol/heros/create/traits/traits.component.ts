import {Component, computed, effect, forwardRef, inject, OnDestroy, signal} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from "@angular/forms";
import {Button, ButtonDirective} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {ConfirmationService, PrimeTemplate} from "primeng/api";
import {Ripple} from "primeng/ripple";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {BolAvantageModel} from "../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../models/bol-desavantage.model";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {FieldsetModule} from "primeng/fieldset";
import {BolHerosTraitsModel} from "../../../models/bol-trait.model";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolHerosService} from "../../../services/bol-heros.service";
import {toSignal} from '@angular/core/rxjs-interop';
import {BolHerosTraitRowComponent} from "./trait-row/trait-row.component";
import {BolHerosTraitComponent} from "./trait/trait.component";
import {TrashComponent} from "../../../../shared/trash/trash.component";
import {BolMessageComponent} from "../../../message/message.component";

@Component({
  selector: 'bol-heros-traits',
  standalone: true,
  imports: [
    ButtonDirective,
    DropdownModule,
    NgIf,
    OverlayPanelModule,
    PrimeTemplate,
    Ripple,
    FormsModule,
    Button,
    FieldsetModule,
    NgForOf,
    ReactiveFormsModule,
    BolHerosTraitRowComponent,
    BolHerosTraitComponent,
    JsonPipe,
    TrashComponent,
    BolMessageComponent
  ],
  templateUrl: './traits.component.html',
  styleUrl: './traits.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosTraitsComponent),
      multi: true,
    }
  ]
})
export class BolHerosTraitsComponent implements ControlValueAccessor, OnDestroy {
  readonly #fb = inject(FormBuilder);
  readonly #bhss = inject(BolHerosStateService);
  readonly #spinner = inject(NgxSpinnerService);
  readonly #bhs = inject(BolHerosService);
  readonly #ds = inject(ConfirmationService);

  private subs?: Subscription;

  public selectedTrait = signal<BolAvantageModel | BolDesavantageModel | null>(null);

  protected contextType = signal<'A' | 'D'>('A')
  protected avantagesList = this.#bhss.avantagesList;
  protected desavantageList = this.#bhss.desavantagesList;
  protected regionalAvantages = this.#bhss.regionalAvantages;
  protected regionalDesavantages = this.#bhss.regionalDesavantages;

  protected traitList = computed(() => {
    const traitsByType = this.contextType() === "A" ? this.avantagesList() : this.desavantageList();
    const regionalTraitsByType =this.contextType() === "A" ? this.regionalAvantages() : this.regionalDesavantages();

    console.log(regionalTraitsByType);

    const traits: BolHerosTraitsModel[] = <BolHerosTraitsModel[]>this.formChange()?.traits;
    const filteringSelectedByType =
      traits?.filter((item: BolHerosTraitsModel) => item.type === this.contextType())
        .map((item: BolHerosTraitsModel) => item.traitable_id);
    return traitsByType?.filter((trait: BolAvantageModel | BolDesavantageModel) => !filteringSelectedByType?.includes(trait.id as number));
  });
  protected heroId = computed(() => this.#bhss.currentHeros()?.id);

  traitsForm = this.#fb.group({
    traits: this.#fb.array([])
  });

  get traits() {
    return this.traitsForm.controls["traits"] as FormArray;
  }

  protected formChange = toSignal(this.traitsForm!.valueChanges);

  constructor() {
    effect(() => {
      if (this.formChange()) {
        console.log('TRAIT:', this.formChange());
        this.onChange(this.traitsForm.get('traits')?.value);
        this.onTouched();
      }
    });
  }

  addTraitToForm(trait: BolHerosTraitsModel) {
    const traitForm = this.#fb.group({
      traitable_id: [trait.traitable_id],
      type: [trait.type],
      detail: [trait.detail],
      id: [trait.id]
    });
    this.traits.push(traitForm);
  }

  addTraits(panel: OverlayPanel, event: any): void {
    panel.toggle(event);
    if (this.selectedTrait() === null) {
      return;
    }
    const trait: BolHerosTraitsModel = {
      traitable_id: this.selectedTrait()?.id as number,
      type: this.contextType(),
      detail: this.selectedTrait()?.pivot?.detail ?? null
    }

    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createTrait(this.heroId(), trait).subscribe({
      next: (newTrait) => {
        this.#spinner.hide();
        console.log('ici', newTrait);
        this.addTraitToForm(newTrait);

      },
      error: () => {
        this.#spinner.hide();
      }
    });
  }

  deleteTraits(traitId: number, event: any) {
    this.#ds.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer ce trait ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.#spinner.show();
        this.subs?.unsubscribe();
        this.subs = this.#bhs.deleteTrait(this.heroId(), traitId).subscribe({
          next: _ => {
            this.#spinner.hide();
            this.removeTrait(traitId);
          },
          error: () => {
            this.#spinner.hide();
          }
        });
      },
    });
  }

  removeTrait(traitId: number) {
    const index = this.traits.value.findIndex((trt: BolHerosTraitsModel) => trt.id === traitId)
    if (index !== -1) this.traits.removeAt(index)
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

  private onChange: (traits: any) => void = () => {
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

  writeValue(traits: BolHerosTraitsModel[]): void {
    if (traits) {
      this.traits.clear();
      for (const trait of traits) {
        const traitForm = this.#fb.group({
          id: [trait.id],
          traitable_id: [trait.traitable_id],
          type: [trait.type],
          detail: [trait.detail]
        });
        this.traits.push(traitForm);
      }
    }
  }
}
