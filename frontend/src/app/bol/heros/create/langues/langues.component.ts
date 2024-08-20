import {Component, computed, effect, forwardRef, inject, OnDestroy} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {FieldsetModule} from "primeng/fieldset";
import {ConfirmationService, PrimeTemplate} from "primeng/api";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {DropdownModule} from "primeng/dropdown";
import {NgForOf, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {Ripple} from "primeng/ripple";

import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from "@angular/forms";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolHerosService} from "../../../services/bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolMessageComponent} from "../../../message/message.component";
import {InputNumberModule} from "primeng/inputnumber";
import {BtnComponent} from "../../../../shared/trash/trash.component";
import {TableModule} from "primeng/table";
import {BolLangueModel} from "../../../models/bol-langue.model";

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
    TableModule
  ],
  templateUrl: './langues.component.html',
  styleUrl: './langues.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosLanguesComponent),
      multi: true,
    }
  ]
})
export class BolHerosLanguesComponent implements ControlValueAccessor, OnDestroy {
  private subs?: Subscription;
  public selectedLangue: BolLangueModel | null = null;

  readonly #fb = inject(FormBuilder);
  langueErrors: { control: string, error: string }[] = [];
  langueWarns: { step: string, warn: string }[] = [];


  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);
  readonly #ds = inject(ConfirmationService);

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
  protected selectedLangueDetail = computed(() => {
    return this.langueList()?.filter((langue: BolLangueModel) => this.selectedLangueIds()?.includes(langue.id))
  });
  protected heroId = computed(() => this.#bhss.currentHeros()?.id);

  constructor() {
    effect(() => {
      if (this.formChange()) {
        this.onChange(this.languesForm.get('langues')?.value);
        this.onTouched();
      }
    });
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
    console.log('value');
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
}
