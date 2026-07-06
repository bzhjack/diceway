import {ChangeDetectionStrategy, Component, effect, forwardRef, inject, input, signal} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {toSignal} from '@angular/core/rxjs-interop';
import {startWith} from 'rxjs';
import {BolHerosLangueModel} from '../../models/bol-langue.model';
import {BolHerosOrigines} from '../../models/bol-heros.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {PictureComponent} from '../../../shared/picture/picture';
import {HeroAdvancedLanguesComponent} from '../langues/langues.component';
import {HeroAdvancedRegionComponent, HeroAdvancedRegionDialogResult} from './region/region.component';

@Component({
  selector: 'bol-hero-advanced-origines',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    HeroAdvancedLanguesComponent,
  ],
  templateUrl: './origines.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HeroAdvancedOriginesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HeroAdvancedOriginesComponent),
      multi: true,
    },
  ],
})
export class HeroAdvancedOriginesComponent implements ControlValueAccessor, Validator {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly herosService = inject(BolHerosService);

  readonly heroId = input<string | null | undefined>(null);

  protected readonly joueurCtrl = new FormControl('', {nonNullable: true, validators: [Validators.required]});
  protected readonly nomCtrl = new FormControl('', {nonNullable: true, validators: [Validators.required]});
  protected readonly avatarCtrl = new FormControl<string | null>(null);
  protected readonly regionIdCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1)],
  });
  protected readonly languesCtrl = new FormControl<number[]>([], {nonNullable: true});
  protected readonly commentaireCtrl = new FormControl<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly originesErrors = signal<{control: string; error: string}[]>([]);
  protected readonly originesWarns = signal<{step: string; warn: string}[]>([]);

  protected readonly originesForm = this.formBuilder.group({
    joueur: this.joueurCtrl,
    nom: this.nomCtrl,
    avatar: this.avatarCtrl,
    region_id: this.regionIdCtrl,
    langues: this.languesCtrl,
    commentaire: this.commentaireCtrl,
  });
  protected readonly formChange = toSignal(this.originesForm.valueChanges, {
    initialValue: this.originesForm.getRawValue(),
  });
  protected readonly currentRegion = this.herosStateService.currentHerosRegion;
  protected readonly avatarPreview = toSignal(
    this.avatarCtrl.valueChanges.pipe(startWith(this.avatarCtrl.value)),
    {initialValue: this.avatarCtrl.value},
  );

  private onChange: (value: BolHerosOrigines) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.formChange();
      this.updateErrors();
      this.updateWarnings();
      this.onChange(this.originesForm.getRawValue() as BolHerosOrigines);
      this.onTouched();
    });
  }

  protected pickAvatar(): void {
    const ref = this.dialog.open(PictureComponent, {
      data: {title: 'Avatar du héros'},
      width: 'min(960px, 92vw)',
      disableClose: true,
    });

    ref.afterClosed().subscribe((avatar: string | null) => {
      if (avatar) {
        this.avatarCtrl.setValue(avatar);
        this.updateOrigines();
      }
    });
  }

  protected openRegionPicker(): void {
    const ref = this.dialog.open(HeroAdvancedRegionComponent, {
      width: 'min(1280px, 96vw)',
      data: {
        id_region: this.regionIdCtrl.value,
        nom: this.nomCtrl.value,
      },
    });

    ref.afterClosed().subscribe((data: HeroAdvancedRegionDialogResult | null | undefined) => {
      if (!data?.region) {
        return;
      }

      this.regionIdCtrl.setValue(Number(data.region.id));
      if (data.nom) {
        this.nomCtrl.setValue(data.nom);
      }
      this.updateOrigines();
    });
  }

  protected clearRegion(): void {
    this.regionIdCtrl.setValue(null);
  }

  writeValue(value: BolHerosOrigines | null): void {
    if (!value) {
      return;
    }

    this.originesForm.patchValue({
      avatar: value.avatar,
      nom: value.nom ?? '',
      commentaire: value.commentaire ?? null,
      joueur: value.joueur ?? '',
      region_id: value.region_id ? Number(value.region_id) : null,
      langues: (value.langues ?? []).map((item) =>
        typeof item === 'number' ? item : (item as BolHerosLangueModel).langue_id,
      ),
    });
  }

  registerOnChange(fn: (value: BolHerosOrigines) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.originesForm.valid ? null : {invalidForm: true};
  }

  private updateErrors(): void {
    const errors: {control: string; error: string}[] = [];

    if (this.joueurCtrl.invalid) {
      errors.push({control: 'Joueur', error: 'Le nom du joueur est requis.'});
    }
    if (this.nomCtrl.invalid) {
      errors.push({control: 'Nom', error: 'Le nom du héros est requis.'});
    }
    if (this.regionIdCtrl.invalid) {
      errors.push({control: 'Région', error: 'Une région doit être choisie.'});
    }

    this.originesErrors.set(errors);
  }

  private updateWarnings(): void {
    const warnings: {step: string; warn: string}[] = [];
    if (!this.originesErrors().length && !this.regionIdCtrl.value) {
      warnings.push({step: 'Région', warn: 'Vous devez choisir une région.'});
    }

    this.originesWarns.set(warnings);
    this.herosStateService.setWarnOrigines(warnings);
  }

  private updateOrigines(): void {
    if (!this.heroId()) {
      return;
    }

    this.pending.set(true);
    this.herosService
      .updateOriginesHeros(this.heroId() as string, this.originesForm.getRawValue() as BolHerosOrigines)
      .subscribe({
        next: () => this.pending.set(false),
        error: () => this.pending.set(false),
      });
  }
}
