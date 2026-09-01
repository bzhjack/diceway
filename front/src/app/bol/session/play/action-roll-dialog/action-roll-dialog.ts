import {ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation, viewChild} from '@angular/core';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';

export interface ActionRollCarriere {
  readonly label: string;
  readonly value: number;
}

/** Avantage/désavantage à dé de bonus/malus du héros (`de_bonus`/`de_malus` en base) — ne modifie pas
 * un attribut, change le mécanisme de lancer (cf. `netDiceModifier`/`keepBestOrWorstTwo`). */
export interface ActionRollDiceTrait {
  readonly label: string;
  readonly domaine: string | null;
  readonly kind: 'avantage' | 'desavantage';
}

export interface ActionRollDialogData {
  readonly heroNom: string;
  readonly agilite: number;
  readonly vigueur: number;
  readonly esprit: number;
  readonly aura: number;
  /** Malus d'équipement (armure/casque) sur l'agilité — affiché et appliqué automatiquement quand cet attribut est sélectionné, en plus de la vraie valeur d'agilité. */
  readonly equipementAgilite: number;
  /** Carrières du héros — `2d6 + attribut + carrière appropriée` (02-actions-combat.md), sélection manuelle car seul le joueur/MJ sait laquelle s'applique. */
  readonly carrieres: readonly ActionRollCarriere[];
  /** Avantages/désavantages à dé de bonus/malus — sélection manuelle du/des trait(s) applicable(s) à
   * CETTE action (le domaine est un texte libre, seul le joueur/MJ sait s'il s'applique). Les
   * avantages/désavantages à modificateur fixe d'attribut sont volontairement exclus : ils sont déjà
   * intégrés à la valeur stockée pour les héros créés via la fiche avancée (activation), donc les
   * réappliquer ici les compterait deux fois — cf. décision du 2026-09-01. */
  readonly diceTraits: readonly ActionRollDiceTrait[];
}

export type ActionAttribute = 'agilite' | 'vigueur' | 'esprit' | 'aura';

export const ACTION_ATTRIBUTE_LABELS: Record<ActionAttribute, string> = {
  agilite: 'Agilité',
  vigueur: 'Vigueur',
  esprit: 'Esprit',
  aura: 'Aura',
};

export interface ActionDifficulty {
  readonly label: string;
  readonly modifier: number;
}

/** Seuil fixe de réussite d'un jet d'action BoL (02-actions-combat.md) — la difficulté agit en modificateur, jamais sur le seuil. */
export const ACTION_ROLL_THRESHOLD = 9;

/** Échelle de difficulté officielle BoL (02-actions-combat.md), appliquée en modificateur au jet. */
export const ACTION_DIFFICULTIES: readonly ActionDifficulty[] = [
  {label: 'Très facile', modifier: 2},
  {label: 'Facile', modifier: 1},
  {label: 'Moyenne', modifier: 0},
  {label: 'Ardue', modifier: -1},
  {label: 'Difficile', modifier: -2},
  {label: 'Très difficile', modifier: -4},
  {label: 'Impossible', modifier: -6},
  {label: 'Héroïque', modifier: -8},
];

/** Résultat suggéré d'un jet d'action : 2/12 naturels priment sur le seuil (même règle absolue que l'initiative). */
export function suggestedActionResult(
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

/** Résout un dé de bonus/malus (02-actions-combat.md, p. 16-17 du livre) : `net` positif garde les 2
 * meilleurs des dés lancés (avantage), négatif garde les 2 moins bons (désavantage), 0 = lancer normal
 * (déjà 2 dés, avantage/désavantage contradictoires qui s'annulent y compris). */
export function keepBestOrWorstTwo(values: readonly number[], net: number): readonly [number, number] {
  if (values.length <= 2) {
    return [values[0], values[1]];
  }
  const sorted = [...values].sort((a, b) => a - b);
  return net < 0 ? [sorted[0], sorted[1]] : [sorted[sorted.length - 2], sorted[sorted.length - 1]];
}

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

/** Jet d'action générique (hors combat) : 2d6 + attribut + carrière + modificateur libre, comparé à un seuil choisi. */
@Component({
  selector: 'bol-action-roll-dialog',
  imports: [MatButtonToggleModule, MatDialogModule, MatIconModule, MatTooltipModule, DiceBoxHostComponent],
  templateUrl: './action-roll-dialog.html',
  styleUrl: './action-roll-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ActionRollDialogComponent {
  protected readonly data = inject<ActionRollDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<ActionRollDialogComponent>);

  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

  protected readonly attributes: readonly ActionAttribute[] = ['agilite', 'vigueur', 'esprit', 'aura'];
  protected readonly attributeLabels = ACTION_ATTRIBUTE_LABELS;
  protected readonly difficulties = ACTION_DIFFICULTIES;
  // 8 paliers ne tiennent pas sur une seule barre segmentée à la largeur du dialog — deux barres
  // complètes de 4 (facile → difficile) plutôt qu'une grille qui reviendrait à la ligne, pour garder
  // le rail segmenté d'un seul tenant sur chaque ligne (cf. piste B).
  protected readonly difficultiesRow1 = ACTION_DIFFICULTIES.slice(0, 4);
  protected readonly difficultiesRow2 = ACTION_DIFFICULTIES.slice(4);

  protected readonly attribute = signal<ActionAttribute>('agilite');
  protected readonly difficulty = signal<ActionDifficulty>(ACTION_DIFFICULTIES[2]); // Moyenne, par défaut
  protected readonly carrieres = this.data.carrieres;
  protected readonly carriere = signal<ActionRollCarriere | null>(null);
  protected readonly modifier = signal(0);

  protected readonly avantageTraits = this.data.diceTraits.filter((t) => t.kind === 'avantage');
  protected readonly desavantageTraits = this.data.diceTraits.filter((t) => t.kind === 'desavantage');
  protected readonly selectedDiceTraits = signal<ReadonlySet<string>>(new Set());

  protected readonly selectedDiceTraitCounts = computed(() => {
    let avantages = 0;
    let desavantages = 0;
    for (const trait of this.data.diceTraits) {
      if (!this.selectedDiceTraits().has(trait.label)) {
        continue;
      }
      if (trait.kind === 'avantage') {
        avantages++;
      } else {
        desavantages++;
      }
    }
    return {avantages, desavantages};
  });

  /** Solde net de dés de bonus/malus, plafonné à ±2 (02-actions-combat.md) : au-delà, un avantage et
   * un désavantage contradictoires s'annulent plutôt que de s'accumuler indéfiniment. */
  protected readonly netDiceModifier = computed(() => {
    const {avantages, desavantages} = this.selectedDiceTraitCounts();
    return Math.max(-2, Math.min(2, avantages - desavantages));
  });

  protected readonly diceCountLabel = computed(() => {
    const net = this.netDiceModifier();
    if (net === 0) {
      const {avantages, desavantages} = this.selectedDiceTraitCounts();
      return avantages > 0 && desavantages > 0 ? "S'annulent — 2d6" : '';
    }
    const count = 2 + Math.abs(net);
    return net > 0 ? `${count}d6, garde les 2 meilleurs` : `${count}d6, garde les 2 moins bons`;
  });

  protected readonly rollButtonLabel = computed(() => `Lancer ${2 + Math.abs(this.netDiceModifier())}d6`);

  /** Détail du pool de dés lancé quand un avantage/désavantage à dé s'applique (plus de 2 dés) — pour
   * que le joueur voie lesquels ont été gardés, pas juste le total final. */
  protected readonly diceBreakdown = computed(() => {
    const all = this.rolledDice();
    const kept = this.dice();
    if (!all || !kept || all.length <= 2) {
      return null;
    }
    return `${all.length}d6 : ${all.join(', ')} → gardé ${kept[0]} + ${kept[1]}`;
  });

  protected readonly rolling = signal(false);
  /** Tous les dés physiquement lancés (2 à 4) — `dice` n'en garde que les 2 qui comptent. */
  protected readonly rolledDice = signal<readonly number[] | null>(null);
  protected readonly dice = signal<readonly [number, number] | null>(null);

  /** Saisie manuelle du total (dés physiques lancés à table) — toujours disponible à côté du bouton
   * de lancer virtuel, pas derrière un bascule de mode : le MJ choisit l'un ou l'autre sans clic préalable. */
  protected readonly manualTotal = signal<number | null>(null);
  protected readonly manualTotalValid = computed(() => {
    const t = this.manualTotal();
    return t !== null && Number.isInteger(t) && t >= 2 && t <= 12;
  });

  /** Modificateur calculé (non éditable) pour l'attribut sélectionné — équipement porté, etc. */
  protected readonly equipmentModifier = computed(() =>
    this.attribute() === 'agilite' ? this.data.equipementAgilite : 0,
  );

  protected readonly modifierSum = computed(
    () =>
      this.data[this.attribute()] +
      this.difficulty().modifier +
      this.equipmentModifier() +
      (this.carriere()?.value ?? 0) +
      this.modifier(),
  );

  protected readonly formula = computed(() => {
    const sum = this.modifierSum();
    const base = sum >= 0 ? `2d6 + ${sum}` : `2d6 − ${Math.abs(sum)}`;
    return `${base} > ${ACTION_ROLL_THRESHOLD}`;
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
    return d ? suggestedActionResult(d, this.modifierSum(), ACTION_ROLL_THRESHOLD) : null;
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
    this.attribute.set(change.value as ActionAttribute);
  }

  protected setDifficulty(change: MatButtonToggleChange): void {
    const difficulty = this.difficulties.find((d) => d.label === change.value);
    if (difficulty) {
      this.difficulty.set(difficulty);
    }
  }

  protected setCarriere(change: MatButtonToggleChange): void {
    this.carriere.set(this.carrieres.find((c) => c.label === change.value) ?? null);
  }

  protected toggleDiceTrait(label: string): void {
    this.selectedDiceTraits.update((set) => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected incrementModifier(delta: number): void {
    this.modifier.update((m) => m + delta);
  }

  protected async roll(): Promise<void> {
    this.rolling.set(true);
    try {
      const net = this.netDiceModifier();
      const count = 2 + Math.abs(net);
      await this.diceBox().clear();
      const results = await this.diceBox().rollNotation(`${count}d6`);
      const values = results.map((r) => r.value);
      this.rolledDice.set(values);
      this.dice.set(keepBestOrWorstTwo(values, net));
    } finally {
      this.rolling.set(false);
    }
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
    this.rolledDice.set(null);
    this.dice.set(diceFromTotal(total));
  }

  protected close(): void {
    this.ref.close();
  }
}
