import {Component, computed, forwardRef, inject} from '@angular/core';
import {FieldsetModule} from "primeng/fieldset";
import {PrimeTemplate} from "primeng/api";
import {ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {NgIf} from "@angular/common";
import {BolMessageComponent} from "../../../message/message.component";
import {OverlayPanelModule} from "primeng/overlaypanel";

@Component({
  selector: 'bol-heros-ressources',
  standalone: true,
  imports: [
    FieldsetModule,
    PrimeTemplate,
    ReactiveFormsModule,
    InputTextModule,
    NgIf,
    BolMessageComponent,
    OverlayPanelModule
  ],
  templateUrl: './ressources.component.html',
  styleUrl: './ressources.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosRessourcesComponent),
      multi: true,
    }
  ]
})
export class BolHerosRessourcesComponent implements ControlValueAccessor {

  readonly #fb = inject(FormBuilder);
  readonly #herosStateService = inject(BolHerosStateService);

  public vitaliteCtrl = new FormControl<number | null>(0);
  public heroismeCtrl = new FormControl<number | null>(0);
  public foiCtrl = new FormControl<number | null>(0);
  public pouvoirCtrl = new FormControl<number | null>(0);

  ressourcesForm = this.#fb.group({
    vitalite: this.vitaliteCtrl,
    heroisme: this.heroismeCtrl,
    foi: this.foiCtrl,
    pouvoir: this.pouvoirCtrl
  });

  protected heroismCost = computed<number>(() => this.#herosStateService.heroismCost());

  constructor() {
  }

  private onChange: (value: any) => void = () => {
  };
  private onTouched: () => void = () => {
  };

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (value) {
      this.ressourcesForm.patchValue({
        heroisme: value.heroisme,
        vitalite: value.vitalite
      });
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.ressourcesForm.disable();
    } else {
      this.ressourcesForm.enable();
    }
  }
}
