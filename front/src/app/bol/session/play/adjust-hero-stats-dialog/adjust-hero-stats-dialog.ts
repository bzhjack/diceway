import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';

export interface AdjustHeroStatsDialogData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
  readonly heroisme: number;
}

/** Ajustement rapide de la vitalité (scoped à la session) et de l'héroïsme (ressource globale du héros). */
@Component({
  selector: 'bol-adjust-hero-stats-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, DwValueStepperComponent],
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

  constructor() {
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

  protected close(): void {
    this.ref.close(this.changed());
  }
}
