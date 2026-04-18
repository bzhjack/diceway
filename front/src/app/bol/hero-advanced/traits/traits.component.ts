import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, signal} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {IftaLabelModule} from 'primeng/iftalabel';
import {SelectModule} from 'primeng/select';
import {toSignal} from '@angular/core/rxjs-interop';
import {ConfirmationService} from 'primeng/api';
import {BolAvantageModel} from '../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {BolHerosTraitsModel} from '../../models/bol-trait.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {HeroAdvancedCreateTools} from '../create.tools';
import {HeroAdvancedTraitComponent} from './trait/trait.component';

@Component({
  selector: 'bol-hero-advanced-traits',
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, IftaLabelModule, SelectModule, HeroAdvancedTraitComponent],
  templateUrl: './traits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedTraitsComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedTraitsComponent implements ControlValueAccessor {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly herosService = inject(BolHerosService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly contextType = signal<'A' | 'D'>('A');
  protected readonly selectedTrait = signal<BolAvantageModel | BolDesavantageModel | null>(null);
  protected readonly pending = signal(false);
  protected readonly traitsWarns = signal<{step: string; warn: string}[]>([]);

  protected readonly traitsForm = this.formBuilder.group({
    traits: this.formBuilder.array([]),
  });
  protected readonly formChange = toSignal(this.traitsForm.valueChanges, {
    initialValue: this.traitsForm.getRawValue(),
  });
  protected readonly heroId = computed(() => this.herosStateService.currentHeros()?.id);
  protected readonly mergedAvantages = computed(() => {
    const object = {
      ...HeroAdvancedCreateTools.toObject(this.herosStateService.avantagesList()),
      ...HeroAdvancedCreateTools.toObject(this.herosStateService.regionalAvantages()),
    };
    return Object.values(object);
  });
  protected readonly mergedDesavantages = computed(() => {
    const object = {
      ...HeroAdvancedCreateTools.toObject(this.herosStateService.desavantagesList()),
      ...HeroAdvancedCreateTools.toObject(this.herosStateService.regionalDesavantages()),
    };
    return Object.values(object);
  });
  protected readonly herosTraits = computed(() => (this.formChange()?.traits ?? []) as BolHerosTraitsModel[]);
  protected readonly herosAvantages = computed(() =>
    this.herosTraits().filter((trait) => trait.type === 'A'),
  );
  protected readonly herosRegionalAvantages = computed(() =>
    this.herosAvantages().filter((trait) => Number(trait.region_id) > 0),
  );
  protected readonly herosDesavantages = computed(() =>
    this.herosTraits().filter((trait) => trait.type === 'D' && trait.carriere === false),
  );
  protected readonly herosRegionalDesavantages = computed(() =>
    this.herosDesavantages().filter((trait) => Number(trait.region_id) > 0),
  );
  protected readonly canAddAdvantage = computed(() => this.herosAvantages().length < 3);
  protected readonly traitList = computed(() => {
    const allTraits = this.contextType() === 'A' ? this.mergedAvantages() : this.mergedDesavantages();
    const selectedIds = this.herosTraits()
      .filter((trait) => trait.type === this.contextType())
      .map((trait) => Number(trait.traitable_id));
    return allTraits.filter((trait) => !selectedIds.includes(Number(trait.id)));
  });

  private onChange: (value: BolHerosTraitsModel[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.checkWarnings();
      this.onChange(this.traits.getRawValue() as BolHerosTraitsModel[]);
      this.onTouched();
    }, {allowSignalWrites: true});
  }

  protected get traits(): FormArray {
    return this.traitsForm.controls.traits as FormArray;
  }

  protected addTrait(): void {
    if (this.pending() || !this.selectedTrait() || !this.heroId()) {
      return;
    }
    if (this.contextType() === 'A' && !this.canAddAdvantage()) {
      return;
    }

    const current = this.selectedTrait()!;
    const trait: BolHerosTraitsModel = {
      traitable_id: current.id as number,
      type: this.contextType(),
      detail: current.pivot?.detail ?? null,
      region_id: current.pivot?.region_id ?? null,
      carriere: false,
    };

    this.pending.set(true);
    this.herosService.createTrait(this.heroId(), trait).subscribe({
      next: (newTrait) => {
        this.addTraitToForm(newTrait);
        this.selectedTrait.set(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteTrait(traitId: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous supprimer ce trait ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.pending.set(true);
        this.herosService.deleteTrait(this.heroId(), traitId).subscribe({
          next: () => {
            this.removeTrait(traitId);
            this.pending.set(false);
          },
          error: () => this.pending.set(false),
        });
      },
    });
  }

  writeValue(value: BolHerosTraitsModel[] | null): void {
    this.traits.clear();
    for (const trait of value ?? []) {
      this.addTraitToForm(trait);
    }
    if (!(value ?? []).length) {
      this.checkWarnings();
    }
  }

  registerOnChange(fn: (value: BolHerosTraitsModel[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private addTraitToForm(trait: BolHerosTraitsModel): void {
    this.traits.push(
      this.formBuilder.group({
        id: [Number(trait.id)],
        traitable_id: [Number(trait.traitable_id)],
        type: [trait.type],
        detail: [trait.detail],
        region_id: [trait.region_id ? Number(trait.region_id) : null],
        carriere: [trait.carriere],
      }),
    );
  }

  private checkWarnings(): void {
    const warnings: {step: string; warn: string}[] = [];
    if (!this.herosAvantages().length) {
      warnings.push({step: 'Traits', warn: 'Vous devez choisir au moins un avantage.'});
    }

    if (this.herosAvantages().length > 3) {
      warnings.push({step: 'Traits', warn: 'Un héros ne peut pas avoir plus de trois avantages à la création.'});
    }

    const regionalAvantageCount = this.herosStateService.regionalAvantages().length;
    if (regionalAvantageCount && !this.herosRegionalAvantages().length) {
      warnings.push({step: 'Traits', warn: 'Vous devez choisir au moins un avantage régional.'});
    }

    this.traitsWarns.set(warnings);
    this.herosStateService.setWarnTraits(warnings);
  }

  private removeTrait(traitId: number): void {
    const index = this.traits.controls.findIndex((control) => Number(control.get('id')?.value) === Number(traitId));
    if (index >= 0) {
      this.traits.removeAt(index);
    }
  }
}
