import {Component, inject, input, OnDestroy, signal} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {FieldsetModule} from "primeng/fieldset";
import {PrimeTemplate} from "primeng/api";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {DropdownModule} from "primeng/dropdown";
import {NgForOf, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {Ripple} from "primeng/ripple";
import {BolArmureModel, BolHerosArmureModel} from "../../../models/bol-armure.model";
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule
} from "@angular/forms";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolHerosService} from "../../../services/bol-heros.service";

@Component({
  selector: 'app-armures',
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
    ReactiveFormsModule
  ],
  templateUrl: './armures.component.html',
  styleUrl: './armures.component.scss'
})
export class ArmuresComponent implements ControlValueAccessor, OnDestroy {
  private subs?: Subscription;
  public selectedArmure: BolArmureModel | null = null;

  readonly #fb = inject(FormBuilder);
  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);

  armuresForm = this.#fb.group({
    armures: this.#fb.array([])
  });

  get armures() {
    return this.armuresForm.get('armures') as FormArray;
  }


  protected armureList = this.#bhss.armureList;
  public heroId = input<string | null | undefined>(null)

  addArmure(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    if (this.selectedArmure === null) {
      return;
    }
    const armure: BolHerosArmureModel = {
      armure_id: this.selectedArmure?.id as number
    }
    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createArmure(this.heroId(), armure).subscribe({
      next: _ => {
        this.#spinner.hide();
        this.armures.push(new FormControl(armure.armure_id));
      },
      error: () => {
        this.#spinner.hide();
      }
    });
  }

  registerOnChange(fn: any): void {
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(obj: any): void {
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
