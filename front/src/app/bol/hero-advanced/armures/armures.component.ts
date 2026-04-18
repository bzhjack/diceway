import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, signal} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {ConfirmationService} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {IftaLabelModule} from 'primeng/iftalabel';
import {SelectModule} from 'primeng/select';
import {TooltipModule} from 'primeng/tooltip';
import {toSignal} from '@angular/core/rxjs-interop';
import {BolArmureModel, BolHerosArmureModel} from '../../models/bol-armure.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';

@Component({
  selector: 'bol-hero-advanced-armures',
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, IftaLabelModule, SelectModule, TooltipModule],
  templateUrl: './armures.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedArmuresComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedArmuresComponent implements ControlValueAccessor {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly herosService = inject(BolHerosService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly selectedArmure = signal<BolArmureModel | null>(null);
  protected readonly pending = signal(false);
  protected readonly armuresForm = this.formBuilder.group({
    armures: this.formBuilder.array<FormControl<number>>([]),
  });
  protected readonly formChange = toSignal(this.armuresForm.valueChanges, {
    initialValue: this.armuresForm.getRawValue(),
  });
  protected readonly armureList = this.herosStateService.armureList;
  protected readonly selectedArmureIds = computed(() => this.armures.controls.map((control) => Number(control.value)));
  protected readonly filteredArmureList = computed(() =>
    (this.armureList() ?? []).filter(
      (armure: BolArmureModel) => !this.selectedArmureIds().includes(Number(armure.id)),
    ),
  );
  protected readonly selectedArmureDetail = computed(() =>
    (this.armureList() ?? []).filter(
      (armure: BolArmureModel) => this.selectedArmureIds().includes(Number(armure.id)),
    ),
  );
  protected readonly heroId = computed(() => this.herosStateService.currentHeros()?.id);

  private onChange: (value: number[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.onChange(this.armures.getRawValue());
      this.onTouched();
    });
  }

  protected get armures(): FormArray<FormControl<number>> {
    return this.armuresForm.controls.armures as FormArray<FormControl<number>>;
  }

  protected addArmure(): void {
    if (this.pending() || !this.selectedArmure() || !this.heroId()) {
      return;
    }

    const armure: BolHerosArmureModel = {armure_id: this.selectedArmure()!.id as number};
    this.pending.set(true);
    this.herosService.createArmure(this.heroId(), armure).subscribe({
      next: () => {
        this.armures.push(this.formBuilder.control(armure.armure_id, {nonNullable: true}));
        this.selectedArmure.set(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteArmure(armureId: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous supprimer cette armure ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.pending.set(true);
        this.herosService.deleteArmure(this.heroId(), armureId).subscribe({
          next: () => {
            this.removeArmure(armureId);
            this.pending.set(false);
          },
          error: () => this.pending.set(false),
        });
      },
    });
  }

  writeValue(value: number[] | null): void {
    this.armures.clear();
    for (const armureId of value ?? []) {
      this.armures.push(this.formBuilder.control(Number(armureId), {nonNullable: true}));
    }
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private removeArmure(armureId: number): void {
    const index = this.armures.controls.findIndex((control) => Number(control.value) === Number(armureId));
    if (index >= 0) {
      this.armures.removeAt(index);
    }
  }
}
