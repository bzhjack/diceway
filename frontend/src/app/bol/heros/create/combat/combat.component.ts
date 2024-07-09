import {Component, forwardRef, inject} from '@angular/core';
import {ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {InputNumberModule} from "primeng/inputnumber";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolMessageComponent} from "../../../message/message.component";
import {FieldsetModule} from "primeng/fieldset";
import {attributValidator} from "../create.validators";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-combat',
  standalone: true,
  imports: [
    InputNumberModule,
    OverlayPanelModule,
    BolMessageComponent,
    ReactiveFormsModule,
    FieldsetModule,
    NgIf
  ],
  templateUrl: './combat.component.html',
  styleUrl: './combat.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolCombatComponent),
      multi: true,
    }
  ]
})
export class BolCombatComponent implements ControlValueAccessor {
  readonly #fb = inject(FormBuilder);
  aptitudeErrors: { control: string, error: string }[] = [];

  public initiativeCtrl = new FormControl<number | null>(0, attributValidator);
  public meleeCtrl = new FormControl<number | null>(0, attributValidator);
  public tirCtrl = new FormControl<number | null>(0, attributValidator);
  public defenseCtrl = new FormControl<number | null>(0, attributValidator);

  aptitudesForm = this.#fb.group({
    initiative: this.initiativeCtrl,
    melee: this.meleeCtrl,
    tir: this.tirCtrl,
    defense: this.defenseCtrl,
  });
  private onChange: (rating: number) => void = () => {
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
  writeValue(value: number[]): void {
    if (value) {
      console.log('combat', value);
    }
  }
}
