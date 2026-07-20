import {ChangeDetectionStrategy, Component, computed, inject, signal, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {DiceBoxHostComponent} from '../../../shared/dice-3d/dice-box-host';
import {InitiativeResultat} from '../../models/bol-fight-session.model';
import {INITIATIVE_RESULT_OPTIONS} from '../initiative.util';

export interface InitiativeRollDialogData {
  readonly heroNom: string;
  /** Esprit + initiative + modificateurs (embuscade/initiative adverse) — le X de "2d6 + X". */
  readonly modifierSum: number;
}

const RESULT_LABELS: Record<InitiativeResultat, string> = Object.fromEntries(
  INITIATIVE_RESULT_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<InitiativeResultat, string>;

/** Lance 2d6 (dice-box 3D) pour le jet de réaction et propose le résultat BoL correspondant (02-actions-combat.md). */
@Component({
  selector: 'bol-initiative-roll-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, DiceBoxHostComponent],
  templateUrl: './initiative-roll-dialog.html',
  styleUrl: './initiative-roll-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitiativeRollDialogComponent {
  protected readonly data = inject<InitiativeRollDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<InitiativeRollDialogComponent, InitiativeResultat | undefined>);

  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

  protected readonly rolling = signal(false);
  protected readonly dice = signal<readonly [number, number] | null>(null);
  protected readonly critiqueChosen = signal(false);
  protected readonly legendaryChosen = signal(false);

  /** Formule prête à annoncer : "2d6 + X" (ou "− X") — corrige l'affichage "2d6 + -1" quand le modificateur est négatif. */
  protected readonly formula = computed(() => {
    const sum = this.data.modifierSum;
    return sum >= 0 ? `2d6 + ${sum} > 9` : `2d6 − ${Math.abs(sum)} > 9`;
  });

  protected readonly diceSum = computed(() => {
    const d = this.dice();
    return d ? d[0] + d[1] : null;
  });

  protected readonly total = computed(() => {
    const sum = this.diceSum();
    return sum === null ? null : sum + this.data.modifierSum;
  });

  protected readonly isNatural2 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 1 && d[1] === 1;
  });

  protected readonly isNatural12 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 6 && d[1] === 6;
  });

  /** Résultat suggéré : 2/12 naturels priment sur le seuil (règles absolues), sinon seuil à 9+. */
  protected readonly suggestedResult = computed<InitiativeResultat | null>(() => {
    if (!this.dice()) {
      return null;
    }

    if (this.isNatural2()) {
      return this.critiqueChosen() ? 'echec_critique' : 'echec';
    }

    if (this.isNatural12()) {
      return this.legendaryChosen() ? 'legendaire' : 'heroique';
    }

    return this.total()! >= 9 ? 'reussite' : 'echec';
  });

  /** Teinte du bandeau de verdict : reprend les couleurs de palier déjà utilisées ailleurs (rouge/vert/ambre). */
  protected readonly bannerTone = computed<'echec' | 'reussite' | 'heroique' | null>(() => {
    const result = this.suggestedResult();
    if (!result) {
      return null;
    }

    if (result === 'reussite') {
      return 'reussite';
    }

    return result === 'heroique' || result === 'legendaire' ? 'heroique' : 'echec';
  });

  protected resultLabel(result: InitiativeResultat | null): string {
    return result ? RESULT_LABELS[result] : '';
  }

  protected async roll(): Promise<void> {
    this.rolling.set(true);
    this.critiqueChosen.set(false);
    this.legendaryChosen.set(false);

    try {
      await this.diceBox().clear();
      const results = await this.diceBox().rollNotation('2d6');
      const [a, b] = results.map((r) => r.value);
      this.dice.set([a, b]);
    } finally {
      this.rolling.set(false);
    }
  }

  protected validate(): void {
    const result = this.suggestedResult();
    if (result) {
      this.ref.close(result);
    }
  }

  protected cancel(): void {
    this.ref.close(undefined);
  }
}
