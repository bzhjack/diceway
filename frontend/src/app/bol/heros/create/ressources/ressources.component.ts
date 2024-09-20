import {Component, computed, forwardRef, inject} from '@angular/core';
import {FieldsetModule} from "primeng/fieldset";
import {PrimeTemplate} from "primeng/api";
import {ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {NgForOf, NgIf} from "@angular/common";
import {BolMessageComponent} from "../../../message/message.component";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MessagesModule} from "primeng/messages";

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
        OverlayPanelModule,
        InlineSVGModule,
        MessagesModule,
        NgForOf
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
  public creationCtrl = new FormControl<number | null>(0);

  ressourcesForm = this.#fb.group({
    vitalite: this.vitaliteCtrl,
    heroisme: this.heroismeCtrl,
    foi: this.foiCtrl,
    pouvoir: this.pouvoirCtrl,
    creation: this.creationCtrl,
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
        vitalite: value.vitalite,
        creation: value.creation,
        pouvoir: value.pouvoir,
        foi: value.foi,
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
