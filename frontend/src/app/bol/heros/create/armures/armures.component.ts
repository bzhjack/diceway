import {Component, computed, forwardRef, inject, input, OnDestroy} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {FieldsetModule} from "primeng/fieldset";
import {ConfirmationService, PrimeTemplate} from "primeng/api";
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
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from "@angular/forms";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolHerosService} from "../../../services/bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {tap} from "rxjs/operators";

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
  styleUrl: './armures.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolArmuresComponent),
      multi: true,
    }
  ]
})
export class BolArmuresComponent implements ControlValueAccessor, OnDestroy {
  private subs?: Subscription;
  public selectedArmure: BolArmureModel | null = null;

  readonly #fb = inject(FormBuilder);
  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);
  readonly #ds = inject(ConfirmationService);

  armuresForm = this.#fb.group({
    armures: this.#fb.array([])
  });

  get armures() {
    return this.armuresForm.get('armures') as FormArray;
  }


  protected armureList = this.#bhss.armureList;
  protected selectedArmureIds = toSignal(this.armuresForm.get('armures')!.valueChanges);
  protected filteredArmureList = computed(() => {
    return this.armureList()?.filter((armure: BolArmureModel) => !this.selectedArmureIds()?.includes(armure.id));
  });
  protected selectedArmureDetail = computed(() => {
    return this.armureList()?.filter((armure: BolArmureModel) => this.selectedArmureIds()?.includes(armure.id))
  });
  public heroId = input<string | null | undefined>(null);

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

  deleteArmure(armureId: number, event: any) {
    this.#ds.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cette armure ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.#spinner.show();
        this.subs?.unsubscribe();
        this.subs = this.#bhs.deleteArmure(this.heroId(), armureId).subscribe({
          next: _ => {
            this.#spinner.hide();
            this.removeArmure(armureId);
          },
          error: () => {
            this.#spinner.hide();
          }
        });
      },
    });
  }
  removeArmure(armureId: number) {
    const index = this.armures.value.findIndex((car: number) => car === armureId)
    if (index !== -1) this.armures.removeAt(index)
  }

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
      this.armures.clear();
      for (const val of value) {
        this.armures.push(new FormControl(val));
      }
    }
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
