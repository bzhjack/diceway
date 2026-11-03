import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolHerosService} from '../../../services/bol-heros.service';
import {ACTION_ROLL_THRESHOLD, actionDiceTarget, actionDiceTargetLabel, actionSuccessChance, diceFromTotal, keepBestOrWorstTwo, parseDiceTotal, signedModifier, suggestedActionResult} from '../../action-roll.util';
import {ActionRollCarriere} from '../../models/action-roll.model';
import {RescueDialogData, RescueResult} from '../../models/rescue-dialog.model';
import {bestHealingCareer, rescueDifficulty} from '../../rescue.util';

/** « Secourir un mourant » (02-actions-combat.md) : le héros actif tente de stabiliser un allié mourant, à la place de son attaque.
 * Jet d'action d'esprit + carrière de soins, difficulté Moyenne aggravée d'un niveau par point de vitalité négatif. Les dés se tapent
 * (lancés à table) ou se lancent ici ; un échec peut être relancé par la faveur divine (1 point d'héroïsme). */
@Component({
  selector: 'bol-rescue-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './rescue-dialog.html',
  styleUrl: './rescue-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueDialogComponent {
  protected readonly data = inject<RescueDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<RescueDialogComponent, RescueResult>);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly signed = signedModifier;

  protected readonly patientKey = signal(this.data.patients[0]?.key ?? '');
  protected readonly patient = computed(() => this.data.patients.find((p) => p.key === this.patientKey()) ?? this.data.patients[0]);
  /** La carrière de soins du secouriste est proposée d'office ; le MJ peut en retenir une autre, ou aucune. */
  protected readonly carriere = signal<ActionRollCarriere | null>(bestHealingCareer(this.data.carrieres));
  protected readonly difficulty = computed(() => rescueDifficulty(this.patient().vitalite));
  private readonly modifierSum = computed(() => this.data.esprit + (this.carriere()?.value ?? 0) + this.difficulty().modifier);
  protected readonly target = computed(() => actionDiceTargetLabel(actionDiceTarget(this.modifierSum(), ACTION_ROLL_THRESHOLD)));
  /** Le dé du MJ, selon les circonstances (un abri, l'obscurité, des mains qui tremblent…) : 3d6, on garde les deux meilleurs ou les deux
   * moins bons. */
  protected readonly gmDie = signal<'bonus' | 'malus' | null>(null);
  private readonly net = computed(() => (this.gmDie() === 'bonus' ? 1 : this.gmDie() === 'malus' ? -1 : 0));
  protected readonly chance = computed(() => Math.round(actionSuccessChance(this.net(), this.modifierSum(), ACTION_ROLL_THRESHOLD) * 100));
  /** Tous les dés lancés à l'écran (trois avec le dé du MJ) ; `null` pour un total tapé. */
  protected readonly rolled = signal<readonly number[] | null>(null);

  /** Les deux dés : lancés ici, ou reconstruits depuis le total tapé (2 et 12 restent des doubles). */
  protected readonly dice = signal<readonly [number, number] | null>(null);
  protected readonly typed = signal('');
  protected readonly heroisme = signal(this.data.heroisme);
  protected readonly success = computed(() => {
    const dice = this.dice();
    return dice === null ? null : suggestedActionResult(dice, this.modifierSum(), ACTION_ROLL_THRESHOLD) !== 'echec';
  });

  protected selectPatient(key: string): void {
    this.patientKey.set(key);
  }

  protected selectCarriere(carriere: ActionRollCarriere | null): void {
    this.carriere.set(carriere);
  }

  /** Accorde ou impose le dé du MJ, ou le retire : le jet déjà fait s'efface. */
  protected toggleGmDie(die: 'bonus' | 'malus'): void {
    this.gmDie.update((current) => (current === die ? null : die));
    this.dice.set(null);
    this.rolled.set(null);
    this.typed.set('');
  }

  protected onTyped(raw: string): void {
    this.typed.set(raw);
    this.rolled.set(null);
    const total = parseDiceTotal(raw);
    this.dice.set(total === null ? null : diceFromTotal(total));
  }

  protected roll(): void {
    const die = (): number => 1 + Math.floor(Math.random() * 6);
    const all = Array.from({length: 2 + Math.abs(this.net())}, die);
    const dice = keepBestOrWorstTwo(all, this.net());
    this.rolled.set(all.length > 2 ? all : null);
    this.dice.set(dice);
    this.typed.set(String(dice[0] + dice[1]));
  }

  /** Faveur divine : 1 point d'héroïsme pour relancer les dés d'un secours raté. */
  protected divineFavor(): void {
    this.herosService.adjustHeroisme(this.data.herosId, -1).subscribe({
      next: () => {
        this.heroisme.update((h) => h - 1);
        this.dice.set(null);
        this.rolled.set(null);
        this.typed.set('');
      },
      error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, "Impossible de dépenser l'héroïsme."), 'Fermer', {duration: 5000}),
    });
  }

  protected validate(): void {
    const success = this.success();
    if (success !== null) {
      this.ref.close({key: this.patient().key, success});
    }
  }
}
