import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, output, signal} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {ConfirmationService} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {FloatLabelModule} from 'primeng/floatlabel';
import {InputNumberModule} from 'primeng/inputnumber';
import {SelectModule} from 'primeng/select';
import {TooltipModule} from 'primeng/tooltip';
import {toSignal} from '@angular/core/rxjs-interop';
import {BolCarriereModel, BolHerosCarriereModel} from '../../models/bol-carriere.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {BolHerosTraitsModel} from '../../models/bol-trait.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {HeroAdvancedCreateTools} from '../create.tools';
import {carriereValidator, carrieresFormValidator} from '../create.validators';
import {REGION_CAREER_RULES} from '../create.rules';

@Component({
  selector: 'bol-hero-advanced-carrieres',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    FloatLabelModule,
    InputNumberModule,
    SelectModule,
    TooltipModule,
  ],
  templateUrl: './carrieres.component.html',
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
  private readonly confirmationService = inject(ConfirmationService);

  readonly desavantageCreated = output<BolHerosTraitsModel | null>();

  protected readonly selectedCarriere = signal<BolCarriereModel | null>(null);
  protected readonly selectedTrait = signal<BolDesavantageModel | null>(null);
  protected readonly pending = signal(false);
  protected readonly carriereErrors = signal<{control: string; error: string}[]>([]);
  protected readonly carriereWarns = signal<{step: string; warn: string}[]>([]);

  protected readonly carrieresForm = this.formBuilder.group(
    {
      carrieres: this.formBuilder.array([]),
    },
    {validators: carrieresFormValidator},
  );
  protected readonly formChange = toSignal(this.carrieresForm.valueChanges, {
    initialValue: this.carrieresForm.getRawValue(),
  });
  protected readonly heroId = computed(() => this.herosStateService.currentHeros()?.id);
  protected readonly regionId = computed(() => this.herosStateService.currentHeros()?.origines.region_id ?? null);
  protected readonly carrieresList = this.herosStateService.carriereList;
  protected readonly carriereDesavangeCount = this.herosStateService.carriereDesavangeCount;
  protected readonly desavantagesList = this.herosStateService.desavantagesList;
  protected readonly availableCarrieres = computed(() => {
    const selectedIds = this.carrieres.controls.map((control) => Number(control.get('carriere_id')?.value ?? 0));
    return (this.carrieresList() ?? []).filter(
      (carriere: BolCarriereModel) => !selectedIds.includes(Number(carriere.id)),
    );
  });
  protected readonly availableDesavantages = computed(() => {
    const takenIds = this.herosStateService.allHerosDesavantages().map((trait) => Number(trait.traitable_id));
    return (this.desavantagesList() ?? []).filter((desavantage) => !takenIds.includes(Number(desavantage.id)));
  });

  private onChange: (value: BolHerosCarriereModel[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.updateErrors();
      this.updateWarnings();
      this.onChange(this.carrieres.getRawValue() as BolHerosCarriereModel[]);
      this.onTouched();
    }, {allowSignalWrites: true});
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
        this.selectedCarriere.set(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteCarriere(carriereId: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous supprimer cette carrière ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.pending.set(true);
        this.herosService.deleteCarriere(this.heroId() as string, carriereId).subscribe({
          next: () => {
            this.removeCarriere(carriereId);
            this.pending.set(false);
          },
          error: () => this.pending.set(false),
        });
      },
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
        this.selectedTrait.set(null);
        this.pending.set(false);
        this.desavantageCreated.emit(newTrait);
      },
      error: () => this.pending.set(false),
    });
  }

  protected carriereFromId(id: number): BolCarriereModel | null {
    return (
      (this.carrieresList() ?? []).find((carriere: BolCarriereModel) => Number(carriere.id) === Number(id)) ??
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
      errors.push({control: '', error: 'La somme des carrières ne doit pas dépasser 4.'});
    }

    this.carriereErrors.set(errors);
  }

  private updateWarnings(): void {
    const warnings: {step: string; warn: string}[] = [];

    if (!this.carriereErrors().length) {
      if (this.carrieres.length !== 4) {
        warnings.push({step: 'Carrières', warn: 'Vous devez choisir 4 carrières.'});
      }

      const sum = this.carrieres.controls.reduce(
        (total, current) => total + Number(current.get('value')?.value ?? 0),
        0,
      );
      if (sum < 4) {
        warnings.push({step: 'Carrières', warn: `Il manque ${4 - sum} point(s) dans les carrières.`});
      }

      if (this.carriereDesavangeCount()) {
        warnings.push({
          step: 'Traits',
          warn: `Carrière dangereuse : il faut encore ${this.carriereDesavangeCount()} désavantage(s) supplémentaire(s).`,
        });
      }

      const regionRule = this.regionId() ? REGION_CAREER_RULES[Number(this.regionId())] : undefined;
      const selectedCareerIds = this.carrieres.controls.map((control) => Number(control.get('carriere_id')?.value ?? 0));
      if (regionRule?.firstCareerId && selectedCareerIds.length > 0 && selectedCareerIds[0] !== regionRule.firstCareerId) {
        warnings.push({
          step: 'Carrières',
          warn: `Pour cette origine, la première carrière doit être ${this.carriereFromId(regionRule.firstCareerId)?.carriere ?? 'requise'}.`,
        });
      }
      if (regionRule?.requiredCareerIds) {
        for (const requiredCareerId of regionRule.requiredCareerIds) {
          if (!selectedCareerIds.includes(requiredCareerId)) {
            warnings.push({
              step: 'Carrières',
              warn: `Pour cette origine, une carrière ${this.carriereFromId(requiredCareerId)?.carriere ?? 'requise'} doit être choisie.`,
            });
          }
        }
      }
      if (regionRule?.forbiddenCareerIds) {
        for (const forbiddenCareerId of regionRule.forbiddenCareerIds) {
          if (selectedCareerIds.includes(forbiddenCareerId)) {
            warnings.push({
              step: 'Carrières',
              warn: `Pour cette origine, la carrière ${this.carriereFromId(forbiddenCareerId)?.carriere ?? 'interdite'} n'est pas autorisée.`,
            });
          }
        }
      }
    }

    this.carriereWarns.set(warnings);
    this.herosStateService.setwarnCarrieres(warnings);
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
