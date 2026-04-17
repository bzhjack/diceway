import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, signal} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
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
import {SelectModule} from 'primeng/select';
import {TooltipModule} from 'primeng/tooltip';
import {toSignal} from '@angular/core/rxjs-interop';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolHerosLangueModel, BolLangueModel} from '../../models/bol-langue.model';
import {automaticLanguageIdsForRegion, selectedLanguageTarget} from '../create.rules';

@Component({
  selector: 'bol-hero-advanced-langues',
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, FloatLabelModule, SelectModule, TooltipModule],
  templateUrl: './langues.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedLanguesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HeroAdvancedLanguesComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedLanguesComponent implements ControlValueAccessor, Validator {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly herosService = inject(BolHerosService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly selectedLangue = signal<BolLangueModel | null>(null);
  protected readonly pending = signal(false);
  protected readonly langueErrors = signal<{control: string; error: string}[]>([]);
  protected readonly langueWarns = signal<{step: string; warn: string}[]>([]);

  protected readonly languesForm = this.formBuilder.group({
    langues: this.formBuilder.array<FormControl<number>>([]),
  });
  protected readonly formChange = toSignal(this.languesForm.valueChanges, {
    initialValue: this.languesForm.getRawValue(),
  });
  protected readonly langueList = this.herosStateService.langueList;
  protected readonly regionId = computed(() => this.herosStateService.currentHeros()?.origines.region_id ?? null);
  protected readonly heroId = computed(() => this.herosStateService.currentHeros()?.id);
  protected readonly selectedLangueIds = computed(() =>
    (this.formChange()?.langues ?? []).map((langueId) => Number(langueId)),
  );
  protected readonly automaticLanguageIds = computed(() => automaticLanguageIdsForRegion(this.regionId()));
  protected readonly automaticLanguageLabels = computed(() =>
    this.automaticLanguageIds()
      .map((languageId) =>
        (this.langueList() ?? []).find((langue: BolLangueModel) => Number(langue.id) === Number(languageId))?.langue,
      )
      .filter((label): label is string => Boolean(label)),
  );
  protected readonly selectedLanguageTarget = computed(() =>
    selectedLanguageTarget(
      this.regionId(),
      Number(this.herosStateService.currentHeros()?.attributs.esprit ?? 0),
      this.herosStateService.currentHeros()?.carrieres ?? [],
    ),
  );
  protected readonly filteredLangueList = computed(() =>
    (this.langueList() ?? []).filter(
      (langue: BolLangueModel) =>
        !this.selectedLangueIds().includes(Number(langue.id)) &&
        !this.automaticLanguageIds().includes(Number(langue.id)),
    ),
  );
  protected readonly availableLang = computed(() => {
    return this.selectedLanguageTarget() - this.selectedLangueIds().length;
  });

  private onChange: (value: number[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.updateErrors();
      this.updateWarnings();
      this.onChange(this.langues.getRawValue());
      this.onTouched();
    }, {allowSignalWrites: true});
  }

  protected get langues(): FormArray<FormControl<number>> {
    return this.languesForm.controls.langues as FormArray<FormControl<number>>;
  }

  protected addLangue(): void {
    if (this.pending() || !this.selectedLangue() || !this.heroId()) {
      return;
    }

    const langue: BolHerosLangueModel = {langue_id: this.selectedLangue()!.id as number};
    this.pending.set(true);
    this.herosService.createLangue(this.heroId(), langue).subscribe({
      next: () => {
        this.langues.push(this.formBuilder.control(langue.langue_id, {nonNullable: true}));
        this.selectedLangue.set(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteLangue(langueId: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous supprimer cette langue ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.pending.set(true);
        this.herosService.deleteLangue(this.heroId(), langueId).subscribe({
          next: () => {
            this.removeLangue(langueId);
            this.pending.set(false);
          },
          error: () => this.pending.set(false),
        });
      },
    });
  }

  protected langueFromId(id: number): string | null {
    return (
      (this.langueList() ?? []).find((langue: BolLangueModel) => Number(langue.id) === Number(id))?.langue ??
      null
    );
  }

  writeValue(value: number[] | null): void {
    this.langues.clear();
    for (const langueId of value ?? []) {
      this.langues.push(this.formBuilder.control(Number(langueId), {nonNullable: true}));
    }
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.languesForm.valid ? null : {invalidForm: true};
  }

  private updateErrors(): void {
    const errors: {control: string; error: string}[] = [];
    if (this.regionId() && this.selectedLanguageTarget() === 0) {
      this.langueErrors.set(errors);
      this.languesForm.setErrors(null);
      return;
    }
    if (this.availableLang() < 0) {
      errors.push({
        control: 'Langues',
        error: `Vous avez ${Math.abs(this.availableLang())} langue(s) en trop.`,
      });
    }

    this.langueErrors.set(errors);
    this.languesForm.setErrors(errors.length ? {langCount: this.availableLang()} : null);
  }

  private updateWarnings(): void {
    const warnings: {step: string; warn: string}[] = [];
    if (!this.langueErrors().length && this.availableLang() > 0) {
      warnings.push({
        step: 'Langues',
        warn: `Vous devez encore choisir ${this.availableLang()} langue(s).`,
      });
    }

    this.langueWarns.set(warnings);
    this.herosStateService.setWarnLangues(warnings);
  }

  private removeLangue(langueId: number): void {
    const index = this.langues.controls.findIndex((control) => Number(control.value) === Number(langueId));
    if (index >= 0) {
      this.langues.removeAt(index);
    }
  }
}
