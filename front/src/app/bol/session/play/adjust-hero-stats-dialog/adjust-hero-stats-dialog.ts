import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {BolArmureModel, BolHerosArmureModel} from '../../../models/bol-armure.model';
import {applyArmureEquipToggle} from '../../../shared/form/form-selection';
import {ArmureEntry, ArmureListComponent} from '../../../shared/armure/list/armure-list.component';

export interface AdjustHeroStatsDialogData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
  readonly heroisme: number;
  readonly armures: readonly BolHerosArmureModel[];
}

/** Armure de héros dont le catalogue (`armure`) est garanti chargé — pour l'équipement en séance. */
interface EquippableArmure {
  readonly id: number;
  readonly equipee: boolean;
  readonly armure: BolArmureModel;
}

/** Ajustement rapide de la vitalité (scoped à la session), de l'héroïsme et de l'équipement porté (héros global). */
@Component({
  selector: 'bol-adjust-hero-stats-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, DwValueStepperComponent, ArmureListComponent],
  templateUrl: './adjust-hero-stats-dialog.html',
  styleUrl: './adjust-hero-stats-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdjustHeroStatsDialogComponent {
  protected readonly data = inject<AdjustHeroStatsDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<AdjustHeroStatsDialogComponent, boolean>);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly vitaliteControl = new FormControl(this.data.vitaliteCourante, {nonNullable: true});
  protected readonly heroismeControl = new FormControl(this.data.heroisme, {nonNullable: true});

  private lastVitalite = this.data.vitaliteCourante;
  private lastHeroisme = this.data.heroisme;
  protected readonly changed = signal(false);

  protected readonly armures = signal<readonly EquippableArmure[]>(
    this.data.armures
      .filter((entry): entry is BolHerosArmureModel & {armure: BolArmureModel} => Boolean(entry.armure))
      .map((entry) => ({id: entry.armure_id, equipee: entry.equipee, armure: entry.armure})),
  );

  protected readonly armureEntries = computed<readonly ArmureEntry[]>(() =>
    this.armures().map((entry) => ({
      id: entry.id,
      label: entry.armure.armure,
      protection: entry.armure.protection,
      malus: entry.armure.malus,
      ptsDePouvoir: entry.armure.pts_de_pouvoir,
      categorie: entry.armure.categorie,
      equipee: entry.equipee,
      malusAgilite: entry.armure.malus_agilite,
      malusInitiative: entry.armure.malus_initiative,
    })),
  );

  constructor() {
    this.ref.disableClose = true;
    this.ref.backdropClick().subscribe(() => this.close());
    this.ref.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    this.vitaliteControl.valueChanges.subscribe((value) => this.onVitaliteChange(value));
    this.heroismeControl.valueChanges.subscribe((value) => this.onHeroismeChange(value));
  }

  private onVitaliteChange(value: number): void {
    const delta = value - this.lastVitalite;
    if (delta === 0) {
      return;
    }

    this.fightSessionService.applyDamage(this.data.sessionId, 'hero', this.data.pivotId, delta).subscribe({
      next: () => {
        this.lastVitalite = value;
        this.changed.set(true);
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
          duration: 5000,
        });
        this.vitaliteControl.setValue(this.lastVitalite, {emitEvent: false});
      },
    });
  }

  private onHeroismeChange(value: number): void {
    const delta = value - this.lastHeroisme;
    if (delta === 0) {
      return;
    }

    this.herosService.adjustHeroisme(this.data.herosId, delta).subscribe({
      next: () => {
        this.lastHeroisme = value;
        this.changed.set(true);
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'héroïsme."), 'Fermer', {
          duration: 5000,
        });
        this.heroismeControl.setValue(this.lastHeroisme, {emitEvent: false});
      },
    });
  }

  /** Bascule locale immédiate (exclusivité par catégorie) puis persistance ; reverte en cas d'échec. */
  protected toggleArmureEquipped(index: number): void {
    const previous = this.armures();
    const target = previous[index];
    if (!target) {
      return;
    }

    this.armures.set(
      applyArmureEquipToggle(previous, index, (id) => previous.find((a) => a.id === id)?.armure.categorie ?? null),
    );

    this.herosService.equipArmure(this.data.herosId, target.id).subscribe({
      next: () => this.changed.set(true),
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'équipement."), 'Fermer', {
          duration: 5000,
        });
        this.armures.set(previous);
      },
    });
  }

  protected close(): void {
    this.ref.close(this.changed());
  }
}
