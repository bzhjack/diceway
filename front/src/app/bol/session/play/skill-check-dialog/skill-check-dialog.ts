import {ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation, viewChild} from '@angular/core';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';

export interface SkillCheckDialogData {
  readonly heroNom: string;
  readonly agilite: number;
  readonly vigueur: number;
  readonly esprit: number;
}

export type SkillAttribute = 'agilite' | 'vigueur' | 'esprit';

export const SKILL_ATTRIBUTE_LABELS: Record<SkillAttribute, string> = {
  agilite: 'Agilité',
  vigueur: 'Vigueur',
  esprit: 'Esprit',
};

export interface SkillDifficulty {
  readonly label: string;
  readonly modifier: number;
}

/** Seuil fixe de réussite d'un jet de compétence BoL (02-actions-combat.md) — la difficulté agit en modificateur, jamais sur le seuil. */
export const SKILL_CHECK_THRESHOLD = 9;

/** Échelle de difficulté officielle BoL (02-actions-combat.md), appliquée en modificateur au jet. */
export const SKILL_DIFFICULTIES: readonly SkillDifficulty[] = [
  {label: 'Très facile', modifier: 2},
  {label: 'Facile', modifier: 1},
  {label: 'Moyenne', modifier: 0},
  {label: 'Ardue', modifier: -1},
  {label: 'Difficile', modifier: -2},
  {label: 'Très difficile', modifier: -4},
  {label: 'Impossible', modifier: -6},
  {label: 'Héroïque', modifier: -8},
];

/** Résultat suggéré d'un jet de compétence : 2/12 naturels priment sur le seuil (même règle absolue que l'initiative). */
export function suggestedSkillResult(
  dice: readonly [number, number],
  modifierSum: number,
  threshold: number,
): InitiativeResultat {
  const [a, b] = dice;
  if (a === 1 && b === 1) {
    return 'echec';
  }
  if (a === 6 && b === 6) {
    return 'heroique';
  }
  return a + b + modifierSum >= threshold ? 'reussite' : 'echec';
}

export type SkillRollInputMode = 'virtuel' | 'manuel';

/** Reconstruit une paire de dés valide à partir d'un total 2d6 saisi à la main — un total de 2 ou 12
 * n'est atteignable que par (1,1) ou (6,6), donc la règle absolue (2/12 naturel) reste correcte sans
 * demander les deux faces séparément ; les autres totaux n'ont pas besoin d'une paire fidèle au jet réel. */
export function diceFromTotal(total: number): readonly [number, number] {
  const a = Math.max(1, Math.min(6, total - 6));
  return [a, total - a];
}

const RESULT_LABELS: Record<InitiativeResultat, string> = {
  echec_critique: 'Échec critique',
  echec: 'Échec',
  reussite: 'Réussite',
  heroique: 'Héroïque',
  legendaire: 'Légendaire',
};

/** Jet de compétence générique (hors combat) : 2d6 + attribut + modificateur libre, comparé à un seuil choisi. */
@Component({
  selector: 'bol-skill-check-dialog',
  imports: [MatButtonToggleModule, MatDialogModule, MatIconModule, DiceBoxHostComponent],
  templateUrl: './skill-check-dialog.html',
  styleUrl: './skill-check-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SkillCheckDialogComponent {
  protected readonly data = inject<SkillCheckDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<SkillCheckDialogComponent>);

  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

  protected readonly attributes: readonly SkillAttribute[] = ['agilite', 'vigueur', 'esprit'];
  protected readonly attributeLabels = SKILL_ATTRIBUTE_LABELS;
  protected readonly difficulties = SKILL_DIFFICULTIES;
  // 8 paliers ne tiennent pas sur une seule barre segmentée à la largeur du dialog — deux barres
  // complètes de 4 (facile → difficile) plutôt qu'une grille qui reviendrait à la ligne, pour garder
  // le rail segmenté d'un seul tenant sur chaque ligne (cf. piste B).
  protected readonly difficultiesRow1 = SKILL_DIFFICULTIES.slice(0, 4);
  protected readonly difficultiesRow2 = SKILL_DIFFICULTIES.slice(4);

  protected readonly attribute = signal<SkillAttribute>('agilite');
  protected readonly difficulty = signal<SkillDifficulty>(SKILL_DIFFICULTIES[2]); // Moyenne, par défaut
  protected readonly modifier = signal(0);

  protected readonly rolling = signal(false);
  protected readonly dice = signal<readonly [number, number] | null>(null);

  /** Dés virtuels (boîte 3D) ou résultat saisi à la main (dés physiques lancés à table). */
  protected readonly inputMode = signal<SkillRollInputMode>('virtuel');
  protected readonly manualTotal = signal<number | null>(null);
  protected readonly manualTotalValid = computed(() => {
    const t = this.manualTotal();
    return t !== null && Number.isInteger(t) && t >= 2 && t <= 12;
  });

  protected readonly modifierSum = computed(
    () => this.data[this.attribute()] + this.difficulty().modifier + this.modifier(),
  );

  protected readonly formula = computed(() => {
    const sum = this.modifierSum();
    const base = sum >= 0 ? `2d6 + ${sum}` : `2d6 − ${Math.abs(sum)}`;
    return `${base} > ${SKILL_CHECK_THRESHOLD}`;
  });

  protected readonly diceSum = computed(() => {
    const d = this.dice();
    return d ? d[0] + d[1] : null;
  });

  protected readonly total = computed(() => {
    const sum = this.diceSum();
    return sum === null ? null : sum + this.modifierSum();
  });

  protected readonly suggestedResult = computed<InitiativeResultat | null>(() => {
    const d = this.dice();
    return d ? suggestedSkillResult(d, this.modifierSum(), SKILL_CHECK_THRESHOLD) : null;
  });

  protected readonly resultLabel = computed(() => {
    const result = this.suggestedResult();
    return result ? RESULT_LABELS[result] : '';
  });

  protected readonly bannerTone = computed<'echec' | 'reussite' | 'heroique' | null>(() => {
    const result = this.suggestedResult();
    if (!result) {
      return null;
    }
    return result === 'reussite' ? 'reussite' : result === 'heroique' ? 'heroique' : 'echec';
  });

  protected setAttribute(change: MatButtonToggleChange): void {
    this.attribute.set(change.value as SkillAttribute);
  }

  protected setDifficulty(change: MatButtonToggleChange): void {
    const difficulty = this.difficulties.find((d) => d.label === change.value);
    if (difficulty) {
      this.difficulty.set(difficulty);
    }
  }

  protected incrementModifier(delta: number): void {
    this.modifier.update((m) => m + delta);
  }

  protected async roll(): Promise<void> {
    this.rolling.set(true);
    try {
      await this.diceBox().clear();
      const results = await this.diceBox().rollNotation('2d6');
      const [a, b] = results.map((r) => r.value);
      this.dice.set([a, b]);
    } finally {
      this.rolling.set(false);
    }
  }

  protected setInputMode(change: MatButtonToggleChange): void {
    const mode = change.value as SkillRollInputMode;
    if (mode === this.inputMode()) {
      return;
    }
    this.inputMode.set(mode);
    this.dice.set(null);
    this.manualTotal.set(null);
  }

  protected onManualTotalInput(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.manualTotal.set(parsed === null || Number.isNaN(parsed) ? null : parsed);
  }

  protected submitManualTotal(): void {
    const total = this.manualTotal();
    if (total === null || !this.manualTotalValid()) {
      return;
    }
    this.dice.set(diceFromTotal(total));
  }

  protected close(): void {
    this.ref.close();
  }
}
