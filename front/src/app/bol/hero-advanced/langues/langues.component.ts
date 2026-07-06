import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, signal} from '@angular/core';
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
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {toSignal} from '@angular/core/rxjs-interop';
import {take} from 'rxjs';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolHerosLangueModel, BolLangueModel} from '../../models/bol-langue.model';
import {automaticLanguageIdsForRegion, selectedLanguageTarget} from '../create.rules';

@Component({
  selector: 'bol-hero-advanced-langues',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, MatTooltipModule],
  templateUrl: './langues.component.html',
  styleUrl: './langues.component.scss',
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
  private readonly dialog = inject(MatDialog);

  protected readonly selectedLangueId = new FormControl<number | null>(null);
  private readonly selectedLangueIdValue = toSignal(this.selectedLangueId.valueChanges, {initialValue: null});
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
  protected readonly selectedLangue = computed(
    () =>
      (this.langueList() ?? []).find(
        (langue: BolLangueModel) => Number(langue.id) === Number(this.selectedLangueIdValue()),
      ) ?? null,
  );
  protected readonly heroId = computed(() => this.herosStateService.currentHeros()?.id);
  protected readonly currentRegion = this.herosStateService.currentHerosRegion;
  protected readonly selectedLangueIds = computed(() =>
    (this.formChange()?.langues ?? []).map((langueId) => Number(langueId)),
  );
  protected readonly automaticLanguageIds = computed(() =>
    automaticLanguageIdsForRegion(this.currentRegion(), this.langueList()),
  );
  protected readonly automaticLanguageLabels = computed(() =>
    this.automaticLanguageIds()
      .map((languageId) =>
        (this.langueList() ?? []).find((langue: BolLangueModel) => Number(langue.id) === Number(languageId))?.langue,
      )
      .filter((label): label is string => Boolean(label)),
  );
  protected readonly selectedLanguageTarget = computed(() =>
    selectedLanguageTarget(
      this.currentRegion(),
      Number(this.herosStateService.currentHeros()?.attributs.esprit ?? 0),
      this.herosStateService.currentHeros()?.carrieres ?? [],
      this.langueList(),
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
    });
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
        this.selectedLangueId.setValue(null);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }

  protected deleteLangue(langueId: number): void {
    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Supprimer la langue',
        message: 'Voulez-vous supprimer cette langue ?',
        confirmLabel: 'Oui',
        cancelLabel: 'Non',
      },
    });

    ref.afterClosed().pipe(take(1)).subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) {
        return;
      }

      this.pending.set(true);
      this.herosService.deleteLangue(this.heroId(), langueId).subscribe({
        next: () => {
          this.removeLangue(langueId);
          this.pending.set(false);
        },
        error: () => this.pending.set(false),
      });
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
    if (this.currentRegion() && this.selectedLanguageTarget() === 0) {
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
