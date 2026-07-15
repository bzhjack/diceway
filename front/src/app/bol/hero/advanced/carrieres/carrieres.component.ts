import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, output, signal} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {toSignal} from '@angular/core/rxjs-interop';
import {confirmDialog} from '../../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolCarriereModel, BolHerosCarriereModel} from '../../../models/bol-carriere.model';
import {BolDesavantageModel} from '../../../models/bol-desavantage.model';
import {BolHerosTraitsModel} from '../../../models/bol-trait.model';
import {BolHerosStateService} from '../../../services/bol-heros-state.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {HeroAdvancedCreateTools} from '../create.tools';
import {carrieresFormValidatorFn, carriereValidator} from '../create.validators';

@Component({
  selector: 'bol-hero-advanced-carrieres',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './carrieres.component.html',
  styleUrl: './carrieres.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedCarrieresComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HeroAdvancedCarrieresComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedCarrieresComponent implements ControlValueAccessor, Validator {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);

  readonly desavantageCreated = output<BolHerosTraitsModel | null>();

  protected readonly selectedCarriereId = new FormControl<number | null>(null);
  private readonly selectedCarriereIdValue = toSignal(this.selectedCarriereId.valueChanges, {initialValue: null});
  protected readonly selectedTraitId = new FormControl<number | null>(null);
  private readonly selectedTraitIdValue = toSignal(this.selectedTraitId.valueChanges, {initialValue: null});
  protected readonly pending = signal(false);
  protected readonly carriereErrors = signal<{control: string; error: string}[]>([]);
  protected readonly carriereWarns = signal<{step: string; warn: string}[]>([]);

  protected readonly carrieresForm = this.formBuilder.group(
    {
      carrieres: this.formBuilder.array([]),
    },
    {validators: carrieresFormValidatorFn(4)},
  );
  protected readonly formChange = toSignal(this.carrieresForm.valueChanges, {
    initialValue: this.carrieresForm.getRawValue(),
  });
  protected readonly heroId = computed(() => this.herosStateService.currentHeros()?.id);
  protected readonly currentRegion = this.herosStateService.currentHerosRegion;
  protected readonly carrieresList = this.herosStateService.carriereList;
  protected readonly carriereDesavantageCount = this.herosStateService.carriereDesavantageCount;
  protected readonly carriereBudget = this.herosStateService.carriereBudget;
  protected readonly desavantagesList = this.herosStateService.desavantagesList;
  protected readonly availableCarrieres = computed(() => {
    const selectedIds = this.carrieres.controls.map((control) => Number(control.get('carriere_id')?.value ?? 0));
    return (this.carrieresList() ?? []).filter(
      (carriere: BolCarriereModel) => !selectedIds.includes(Number(carriere.id)),
    );
  });
  protected readonly availableDesavantages = computed(() => {
    const takenIds = this.herosStateService.allHerosDesavantages().map((trait) => trait.traitable_id);
    return (this.desavantagesList() ?? []).filter((desavantage) => !takenIds.includes(Number(desavantage.id)));
  });
  protected readonly selectedCarriere = computed(
    () =>
      this.availableCarrieres().find(
        (carriere: BolCarriereModel) => carriere.id === this.selectedCarriereIdValue(),
      ) ?? null,
  );
  protected readonly selectedTrait = computed(
    () =>
      this.availableDesavantages().find(
        (desavantage: BolDesavantageModel) => desavantage.id === this.selectedTraitIdValue(),
      ) ?? null,
  );

  private onChange: (value: BolHerosCarriereModel[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.updateErrors();
      this.updateWarnings();
      this.onChange(this.carrieres.getRawValue() as BolHerosCarriereModel[]);
      this.onTouched();
    });

    // E11: update validator when Non-combattant changes
    effect(() => {
      const budget = this.carriereBudget();
      this.carrieresForm.setValidators(carrieresFormValidatorFn(budget));
      this.carrieresForm.updateValueAndValidity();
    });
  }

  protected get carrieres(): FormArray {
    return this.carrieresForm.controls.carrieres as FormArray;
  }

  protected addCarriere(): void {
    if (this.pending() || !this.selectedCarriere() || !this.heroId()) {
      return;
    }

    const carriere: BolHerosCarriereModel = {
      carriere_id: this.selectedCarriere()!.id,
      value: 0,
    };
    this.pending.set(true);
    this.herosService.createCarriere(this.heroId() as string, carriere).subscribe({
      next: () => {
        this.carrieres.push(
          this.formBuilder.group({
            carriere_id: [carriere.carriere_id],
            value: [0, carriereValidator],
          }),
        );
        this.selectedCarriereId.setValue(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteCarriere(carriereId: number): void {
    confirmDialog(this.dialog, {
      title: 'Supprimer la carrière',
      message: 'Voulez-vous supprimer cette carrière ?',
      confirmLabel: 'Oui',
      cancelLabel: 'Non',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.pending.set(true);
      this.herosService.deleteCarriere(this.heroId() as string, carriereId).subscribe({
        next: () => {
          this.removeCarriere(carriereId);
          this.pending.set(false);
        },
        error: () => this.pending.set(false),
      });
    });
  }

  protected addCareerDisadvantage(): void {
    if (this.pending() || !this.selectedTrait() || !this.heroId()) {
      return;
    }

    const trait: BolHerosTraitsModel = {
      traitable_id: this.selectedTrait()!.id as number,
      type: 'D',
      detail: this.selectedTrait()!.pivot?.detail ?? null,
      region_id: this.selectedTrait()!.pivot?.region_id ?? null,
      carriere: true,
    };

    this.pending.set(true);
    this.herosService.createTrait(this.heroId(), trait).subscribe({
      next: (newTrait) => {
        this.selectedTraitId.setValue(null);
        this.pending.set(false);
        this.desavantageCreated.emit(newTrait);
      },
      error: () => this.pending.set(false),
    });
  }

  protected carriereFromId(id: number): BolCarriereModel | null {
    return (
      (this.carrieresList() ?? []).find((carriere: BolCarriereModel) => carriere.id === id) ??
      null
    );
  }

  writeValue(value: BolHerosCarriereModel[] | null): void {
    this.carrieres.clear();
    for (const carriere of value ?? []) {
      this.carrieres.push(
        this.formBuilder.group({
          carriere_id: [Number(carriere.carriere_id)],
          value: [Number(carriere.value), carriereValidator],
        }),
      );
    }
  }

  registerOnChange(fn: (value: BolHerosCarriereModel[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.carrieresForm.valid ? null : {invalidForm: true};
  }

  private updateErrors(): void {
    const errors: {control: string; error: string}[] = [];

    this.carrieres.controls.forEach((control) => {
      const carriereId = Number(control.get('carriere_id')?.value ?? 0);
      const currentCarriere = this.carriereFromId(carriereId);
      const currentErrors = control.get('value')?.errors ?? {};
      for (const errorKey of Object.keys(currentErrors)) {
        errors.push({
          control: currentCarriere?.carriere ?? '',
          error: HeroAdvancedCreateTools.translate(errorKey),
        });
      }
    });

    if (this.carrieresForm.errors?.['carrSumExceeded']) {
      errors.push({control: '', error: `La somme des carrières ne doit pas dépasser ${this.carriereBudget()}.`});
    }

    this.carriereErrors.set(errors);
  }

  private updateWarnings(): void {
    const warnings: {step: string; warn: string}[] = [];

    if (!this.carriereErrors().length) {
      if (this.carrieres.length !== 4) {
        warnings.push({step: 'Carrières', warn: 'Vous devez choisir 4 carrières.'});
      }

      const budget = this.carriereBudget();
      const sum = this.carrieres.controls.reduce(
        (total, current) => total + Number(current.get('value')?.value ?? 0),
        0,
      );
      if (sum < budget) {
        warnings.push({step: 'Carrières', warn: `Il manque ${budget - sum} point(s) dans les carrières (budget : ${budget}).`});
      }

      if (this.carriereDesavantageCount()) {
        warnings.push({
          step: 'Traits',
          warn: `Carrière dangereuse : il faut encore ${this.carriereDesavantageCount()} désavantage(s) supplémentaire(s).`,
        });
      }

      const region = this.currentRegion();
      const selectedCareerIds = this.carrieres.controls.map((control) => Number(control.get('carriere_id')?.value ?? 0));
      if (region?.premiere_carriere_id && selectedCareerIds.length > 0 && selectedCareerIds[0] !== region.premiere_carriere_id) {
        warnings.push({
          step: 'Carrières',
          warn: `Pour cette origine, la première carrière doit être ${region.premiere_carriere?.carriere ?? this.carriereFromId(region.premiere_carriere_id)?.carriere ?? 'requise'}.`,
        });
      }
      for (const requiredId of region?.carrieres_requises ?? []) {
        if (!selectedCareerIds.includes(requiredId)) {
          warnings.push({
            step: 'Carrières',
            warn: `Pour cette origine, la carrière ${this.carriereFromId(requiredId)?.carriere ?? 'requise'} doit être choisie.`,
          });
        }
      }
      for (const forbiddenId of region?.carrieres_interdites ?? []) {
        if (selectedCareerIds.includes(forbiddenId)) {
          warnings.push({
            step: 'Carrières',
            warn: `Pour cette origine, la carrière ${this.carriereFromId(forbiddenId)?.carriere ?? 'interdite'} n'est pas autorisée.`,
          });
        }
      }
    }

    this.carriereWarns.set(warnings);
    this.herosStateService.setWarnCarrieres(warnings);
  }

  private removeCarriere(carriereId: number): void {
    const index = this.carrieres.controls.findIndex(
      (control) => Number(control.get('carriere_id')?.value ?? 0) === Number(carriereId),
    );
    if (index >= 0) {
      this.carrieres.removeAt(index);
    }
  }
}
