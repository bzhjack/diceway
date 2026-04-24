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
import {BolArmeModel, BolHerosArmeModel} from '../../models/bol-arme.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';

@Component({
  selector: 'bol-hero-advanced-armes',
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, IftaLabelModule, SelectModule, TooltipModule],
  templateUrl: './armes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedArmesComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedArmesComponent implements ControlValueAccessor {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly herosService = inject(BolHerosService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly selectedArme = signal<BolArmeModel | null>(null);
  protected readonly pending = signal(false);
  protected readonly armesForm = this.formBuilder.group({
    armes: this.formBuilder.array<FormControl<number>>([]),
  });
  protected readonly formChange = toSignal(this.armesForm.valueChanges, {
    initialValue: this.armesForm.getRawValue(),
  });
  protected readonly armeList = this.herosStateService.armeList;
  protected readonly selectedArmeIds = computed(() => (this.formChange().armes ?? []).map(Number));
  protected readonly filteredArmeList = computed(() =>
    (this.armeList() ?? []).filter((arme: BolArmeModel) => !this.selectedArmeIds().includes(Number(arme.id))),
  );
  protected readonly selectedArmeDetail = computed(() =>
    (this.armeList() ?? []).filter((arme: BolArmeModel) => this.selectedArmeIds().includes(Number(arme.id))),
  );
  protected readonly heroId = computed(() => this.herosStateService.currentHeros()?.id);

  private onChange: (value: number[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.onChange(this.armes.getRawValue());
      this.onTouched();
    });
  }

  protected get armes(): FormArray<FormControl<number>> {
    return this.armesForm.controls.armes as FormArray<FormControl<number>>;
  }

  protected addArme(): void {
    if (this.pending() || !this.selectedArme() || !this.heroId()) {
      return;
    }

    const arme: BolHerosArmeModel = {arme_id: this.selectedArme()!.id as number};
    this.pending.set(true);
    this.herosService.createArme(this.heroId(), arme).subscribe({
      next: () => {
        this.armes.push(this.formBuilder.control(arme.arme_id, {nonNullable: true}));
        this.selectedArme.set(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteArme(armeId: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous supprimer cette arme ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.pending.set(true);
        this.herosService.deleteArme(this.heroId(), armeId).subscribe({
          next: () => {
            this.removeArme(armeId);
            this.pending.set(false);
          },
          error: () => this.pending.set(false),
        });
      },
    });
  }

  writeValue(value: number[] | null): void {
    this.armes.clear();
    for (const armeId of value ?? []) {
      this.armes.push(this.formBuilder.control(Number(armeId), {nonNullable: true}));
    }
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private removeArme(armeId: number): void {
    const index = this.armes.controls.findIndex((control) => Number(control.value) === Number(armeId));
    if (index >= 0) {
      this.armes.removeAt(index);
    }
  }
}
