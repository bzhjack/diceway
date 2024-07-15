import {Component, computed, effect, forwardRef, inject, input, OnDestroy, signal} from '@angular/core';
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
import {NgForOf, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {PrimeTemplate} from "primeng/api";
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
import { toSignal } from '@angular/core/rxjs-interop';

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
    ReactiveFormsModule
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
  private subs?: Subscription;

  public selectedAvantage = signal<BolAvantageModel | null>(null);
  public selectedDesavantage = signal<BolDesavantageModel | null>(null);
  
  protected avantagesList = this.#bhss.avantagesList;
  protected desavantageList = this.#bhss.desavantagesList;
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
        this.onChange(this.traitsForm.get('traits')?.value);
        this.onTouched();
      }
    });
  }

  addTraitToForm(trait: BolHerosTraitsModel) {
    const traitForm = this.#fb.group({
      traitable_id: [trait.traitable_id],
      type: [trait.type],
      detail: [trait.detail]
    });
    this.traits.push(traitForm);
  }
  addTraits(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    if (this.selectedAvantage()=== null) {
      return;
    }
    const trait: BolHerosTraitsModel = {
      traitable_id: this.selectedAvantage()?.id as number,
      type: 'A',
      detail: this.selectedAvantage()?.pivot?.detail ?? null
    }

    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createTrait(this.heroId(), trait).subscribe({
      next: _ => {
        this.#spinner.hide();
        this.addTraitToForm(trait);

      },
      error: () => {
        this.#spinner.hide();
      }
    });
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
    console.log(traits);
    if (traits) {
      this.traits.clear();
      for (const trait of traits) {
        const traitForm = this.#fb.group({
          traitable_id: [trait.traitable_id],
          type: [trait.type],
          detail: [trait.detail]
        });
        this.traits.push(traitForm);
      }
    }
  }
}
