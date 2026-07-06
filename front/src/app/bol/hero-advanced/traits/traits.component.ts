import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, signal} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {toSignal} from '@angular/core/rxjs-interop';
import {take} from 'rxjs';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {BolHerosTraitsModel} from '../../models/bol-trait.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {HeroAdvancedCreateTools} from '../create.tools';
import {HeroAdvancedTraitComponent} from './trait/trait.component';

@Component({
  selector: 'bol-hero-advanced-traits',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, HeroAdvancedTraitComponent],
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
  private readonly dialog = inject(MatDialog);

  protected readonly contextTypeCtrl = new FormControl<'A' | 'D'>('A', {nonNullable: true});
  protected readonly contextType = toSignal(this.contextTypeCtrl.valueChanges, {initialValue: 'A' as const});
  protected readonly selectedTraitId = new FormControl<number | null>(null);
  private readonly selectedTraitIdValue = toSignal(this.selectedTraitId.valueChanges, {initialValue: null});
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
  protected readonly herosGeneralDesavantages = computed(() =>
    this.herosDesavantages().filter((trait) => Number(trait.region_id) <= 0),
  );
  protected readonly canAddAdvantage = computed(() => this.herosAvantages().length < 3);
  protected readonly specialAvantageRequired = this.herosStateService.specialAvantageDesavantageRequired;
  protected readonly traitList = computed(() => {
    const allTraits = this.contextType() === 'A' ? this.mergedAvantages() : this.mergedDesavantages();
    const selectedIds = this.herosTraits()
      .filter((trait) => trait.type === this.contextType())
      .map((trait) => Number(trait.traitable_id));
    return allTraits.filter((trait) => !selectedIds.includes(Number(trait.id)));
  });
  protected readonly selectedTrait = computed(
    () => this.traitList().find((trait) => Number(trait.id) === Number(this.selectedTraitIdValue())) ?? null,
  );

  private onChange: (value: BolHerosTraitsModel[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.checkWarnings();
      this.onChange(this.traits.getRawValue() as BolHerosTraitsModel[]);
      this.onTouched();
    });
  }

  protected get traits(): FormArray {
    return this.traitsForm.controls.traits as FormArray;
  }

  protected onContextTypeChange(): void {
    this.selectedTraitId.setValue(null);
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
        this.selectedTraitId.setValue(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteTrait(traitId: number): void {
    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Supprimer le trait',
        message: 'Voulez-vous supprimer ce trait ?',
        confirmLabel: 'Oui',
        cancelLabel: 'Non',
      },
    });

    ref.afterClosed().pipe(take(1)).subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) {
        return;
      }

      this.pending.set(true);
      this.herosService.deleteTrait(this.heroId(), traitId).subscribe({
        next: () => {
          this.removeTrait(traitId);
          this.pending.set(false);
        },
        error: () => this.pending.set(false),
      });
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

    if (this.herosAvantages().length >= 2 && this.herosRegionalDesavantages().length === 0) {
      warnings.push({
        step: 'Traits',
        warn: "Le 2e avantage exige un désavantage régional ou coûte 1 point d'héroïsme.",
      });
    }

    if (this.herosAvantages().length >= 3 && this.herosGeneralDesavantages().length === 0) {
      warnings.push({
        step: 'Traits',
        warn: "Le 3e avantage exige un désavantage général ou coûte 1 point d'héroïsme.",
      });
    }

    // E12: avantages spéciaux exigeant un désavantage supplémentaire chacun
    const avantageIds = this.herosAvantages().map((t) => Number(t.traitable_id));
    const specialNames: string[] = [];
    if (avantageIds.includes(30)) specialNames.push('Magie des Rois-Sorciers');
    if (avantageIds.includes(44)) specialNames.push('Pouvoir du Néant');
    const extraRequired = this.specialAvantageRequired();
    const extraActual = this.herosGeneralDesavantages().length;
    if (extraRequired > 0 && extraActual < extraRequired) {
      const solde = extraRequired - extraActual;
      warnings.push({
        step: 'Traits',
        warn: `${specialNames.join(', ')} exige(nt) encore ${solde} désavantage(s) général(aux) supplémentaire(s).`,
      });
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
