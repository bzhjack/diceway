import {Component, computed, effect, forwardRef, inject, OnDestroy, signal} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from "@angular/forms";
import {ButtonDirective} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {NgForOf, NgIf} from "@angular/common";
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
import {BolHerosTraitComponent} from "./trait/trait.component";
import {BolMessageComponent} from "../../../message/message.component";
import {BolHeroCreateTools} from "../create.tools";
import {DividerModule} from "primeng/divider";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {TooltipModule} from "primeng/tooltip";
import {BtnComponent} from "../../../../shared/btn/btn.component";

@Component({
    selector: 'bol-heros-traits',
  imports: [
    ButtonDirective,
    DropdownModule,
    NgIf,
    OverlayPanelModule,
    PrimeTemplate,
    Ripple,
    FormsModule,
    FieldsetModule,
    NgForOf,
    ReactiveFormsModule,
    BolHerosTraitComponent,
    BtnComponent,
    BolMessageComponent,
    DividerModule,
    ScrollPanelModule,
    TooltipModule
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
  protected hasRenderedDivider = false;
  traitsWarns: { step: string, warn: string }[] = [];

  traitsForm = this.#fb.group({
    traits: this.#fb.array([])
  });

  get traits() {
    return this.traitsForm.controls["traits"] as FormArray;
  }

  public selectedTrait = signal<BolAvantageModel | BolDesavantageModel | null>(null);
  protected contextType = signal<'A' | 'D'>('A')

  protected mergedAvantages = computed(() => {
    const obj1 = BolHeroCreateTools.toObject(this.#bhss.avantagesList() as BolAvantageModel[]);
    const obj2 = BolHeroCreateTools.toObject(this.#bhss.regionalAvantages() as BolAvantageModel[]);
    const mergedObj = {...obj1, ...obj2};
    return Object.values(mergedObj);
  });

  protected mergedDesavantages = computed(() => {
    const obj1 = BolHeroCreateTools.toObject(this.#bhss.desavantagesList() as BolDesavantageModel[]);
    const obj2 = BolHeroCreateTools.toObject(this.#bhss.regionalDesavantages() as BolDesavantageModel[]);
    const mergedObj = {...obj1, ...obj2};
    return Object.values(mergedObj);
  });
  protected formChange = toSignal(this.traitsForm!.valueChanges);
  protected herosTraits = computed(() => <BolHerosTraitsModel[]>this.formChange()?.traits ?? []);
  protected herosAvantages = computed(() => <BolHerosTraitsModel[]>this.herosTraits()?.filter((item) => item.type === 'A') ?? []);
  protected herosRegionalAvantages = computed(() => <BolHerosTraitsModel[]>this.herosAvantages()?.filter((item) => Number(item.region_id) > 0) ?? []);

  protected herosDesavantages = computed(() => <BolHerosTraitsModel[]>this.herosTraits()?.filter((item) => item.type === 'D' && item.carriere === false) ?? []);
  protected herosRegionalDesavantages = computed(() => <BolHerosTraitsModel[]>this.herosDesavantages()?.filter((item) => Number(item.region_id) > 0 && item.carriere === false) ?? []);

  protected traitList = computed(() => {
    const traitsByType = (this.contextType() === "A" ? this.mergedAvantages() : this.mergedDesavantages()) ?? [];
    const filteringSelectedByType = this.herosTraits().filter((item: BolHerosTraitsModel) => item.type === this.contextType())
      .map((item: BolHerosTraitsModel) => Number(item.traitable_id));
    return traitsByType.filter((trait: any) => !filteringSelectedByType.includes(Number(trait.id as number)));
  });
  protected heroId = computed(() => this.#bhss.currentHeros()?.id);


  constructor() {

    effect(() => {
      if (this.formChange()) {
        this.checkWarns();
        this.onChange(this.traitsForm.get('traits')?.value);
        this.onTouched();
      }
    },{allowSignalWrites: true});
  }

  checkWarns() {
    this.traitsWarns = [];
    // Il faut au moins 1 avantage
    if (!this.herosAvantages()?.length) {
      this.traitsWarns.push({
        step: 'Traits',
        warn: 'Vous devez choisir 1 avantage.'
      });
    }
    const countherosRegionalAvantages = this.herosRegionalAvantages().length ?? 0;
    const countHerosDesavantages = this.herosDesavantages().length;
    const countherosRegionalDesavantages = this.herosRegionalDesavantages().length ?? 0;
    const countRegionalAvantages = this.#bhss.regionalAvantages().length ?? 0;
    const countRegionalDesavantages = this.#bhss.regionalDesavantages().length ?? 0;
    // il faut au moins un avantage régional si ils existent
    if (countRegionalAvantages && !countherosRegionalAvantages) {
      this.traitsWarns.push({
        step: 'Traits',
        warn: 'Vous devez choisir au moins 1 avantage <strong>regional</strong>.'
      });
    }
    // il faut au moins un désavantage régional si ils existennt et si il y a un avantage regional
    if (countRegionalDesavantages && countHerosDesavantages && !countherosRegionalDesavantages) {
      this.traitsWarns.push({
        step: 'Traits',
        warn: 'Vous devez choisir au moins 1 désavantage <strong>regional</strong>.'
      });
    }
    this.#bhss.setWarnTraits(this.traitsWarns);
  }

  addTraitToForm(trait: BolHerosTraitsModel) {
    const traitForm = this.#fb.group({
      traitable_id: [Number(trait.traitable_id)],
      type: [trait.type],
      detail: [trait.detail],
      region_id: [Number(trait.region_id)],
      id: [Number(trait.id)],
      carriere: [trait.carriere]
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
      detail: this.selectedTrait()?.pivot?.detail ?? null,
      region_id: this.selectedTrait()?.pivot?.region_id ?? null,
      carriere: false
    }

    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createTrait(this.heroId(), trait).subscribe({
      next: (newTrait) => {
        this.#spinner.hide();
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
    const index = this.traits.value.findIndex((trt: BolHerosTraitsModel) => Number(trt.id) === Number(traitId))
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
    if (traits && traits.length) {
      this.traits.clear();
      for (const trait of traits) {
        const traitForm = this.#fb.group({
          id: [Number(trait.id)],
          traitable_id: [Number(trait.traitable_id)],
          type: [trait.type],
          detail: [trait.detail],
          region_id: [Number(trait.region_id)],
          carriere: [trait.carriere]
        });
        this.traits.push(traitForm);
      }
    } else {
      this.checkWarns();
    }
  }
}
