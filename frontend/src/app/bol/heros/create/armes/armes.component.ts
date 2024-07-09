import {Component, computed, forwardRef, inject, input} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {FieldsetModule} from "primeng/fieldset";
import {ConfirmationService, PrimeTemplate} from "primeng/api";
import {DropdownModule} from "primeng/dropdown";
import {NgForOf, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {Ripple} from "primeng/ripple";
import {FormArray, FormBuilder, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {Subscription} from "rxjs";
import {BolHerosStateService} from "../../../services/bol-heros-state.service";
import {BolHerosService} from "../../../services/bol-heros.service";
import {NgxSpinnerService} from "ngx-spinner";
import {toSignal} from "@angular/core/rxjs-interop";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {BolArmeModel, BolHerosArmeModel} from "../../../models/bol-arme.model";

@Component({
  selector: 'app-armes',
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
  templateUrl: './armes.component.html',
  styleUrl: './armes.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolArmesComponent),
      multi: true,
    }
  ]
})
export class BolArmesComponent {
  private subs?: Subscription;
  public selectedArme: BolArmeModel | null = null;

  readonly #fb = inject(FormBuilder);
  readonly #bhss = inject(BolHerosStateService);
  readonly #bhs = inject(BolHerosService);
  readonly #spinner = inject(NgxSpinnerService);
  readonly #ds = inject(ConfirmationService);

  armesForm = this.#fb.group({
    armes: this.#fb.array([])
  });

  get armes() {
    return this.armesForm.get('armes') as FormArray;
  }

  protected armeList = this.#bhss.armeList;
  protected selectedArmeIds = toSignal(this.armesForm.get('armes')!.valueChanges);
  protected filteredArmeList = computed(() => {
    return this.armeList()?.filter((arme: BolArmeModel) => !this.selectedArmeIds()?.includes(arme.id));
  });
  protected selectedArmeDetail = computed(() => {
    return this.armeList()?.filter((arme: BolArmeModel) => this.selectedArmeIds()?.includes(arme.id))
  });
  public heroId = input<string | null | undefined>(null)

  addArme(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    if (this.selectedArme === null) {
      return;
    }
    const arme: BolHerosArmeModel = {
      arme_id: this.selectedArme?.id as number
    }
    this.#spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.#bhs.createArme(this.heroId(), arme).subscribe({
      next: _ => {
        this.#spinner.hide();
        this.armes.push(new FormControl(arme.arme_id));
      },
      error: () => {
        this.#spinner.hide();
      }
    });
  }

  deleteArme(armeId: number, event: any) {
    this.#ds.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cette arme ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.#spinner.show();
        this.subs?.unsubscribe();
        this.subs = this.#bhs.deleteArme(this.heroId(), armeId).subscribe({
          next: _ => {
            this.#spinner.hide();
            this.removeArme(armeId);
          },
          error: () => {
            this.#spinner.hide();
          }
        });
      },
    });
  }
  removeArme(armeId: number) {
    const index = this.armes.value.findIndex((car: number) => car === armeId)
    if (index !== -1) this.armes.removeAt(index)
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
      this.armes.clear();
      for (const val of value) {
        this.armes.push(new FormControl(val));
      }
    }
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

}
