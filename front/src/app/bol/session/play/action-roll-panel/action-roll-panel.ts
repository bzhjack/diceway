import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  ViewEncapsulation,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolHerosService} from '../../../services/bol-heros.service';
import {ACTION_ATTRIBUTE_LABELS, ACTION_ATTRIBUTE_SHORT, ACTION_ATTRIBUTES, ACTION_DIFFICULTIES, ACTION_RESULT_LABELS, ACTION_ROLL_THRESHOLD, actionModifierSum, actionResultTone, DEFAULT_ACTION_DIFFICULTY, diceCountLabel, diceFromTotal, formatActionFormula, keepBestOrWorstTwo, netDiceModifier, signedModifier, suggestedActionResult} from '../../action-roll.util';
import {ActionAttribute, ActionDifficulty, ActionRollCarriere, ActionRollData, ActionRollParts} from '../../models/action-roll.model';
import {applyHeroismeDelta} from '../../heroisme-spend.util';

/** Jet d'action d'un héros en une seule surface (fiche du jeton, `bol-expanded-card`) : attribut,
 * carrière, difficulté, dés de bonus/malus et ajustements sur des rangées compactes, puis la formule
 * en clair et le résultat. Le calcul est dans `action-roll.util.ts`. */
@Component({
  selector: 'bol-action-roll-panel',
  imports: [MatButtonToggleModule, MatIconModule, MatTooltipModule, DiceBoxHostComponent],
  templateUrl: './action-roll-panel.html',
  styleUrl: './action-roll-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ActionRollPanelComponent {
  readonly data = input.required<ActionRollData>();
  /** Héroïsme courant du héros, partagé avec `bol-hero-resources` : une dépense ici met à jour le
   * stepper d'à côté, et inversement. */
  readonly heroisme = model.required<number>();

  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

  protected readonly attributes = ACTION_ATTRIBUTES;
  protected readonly attributeLabels = ACTION_ATTRIBUTE_LABELS;
  protected readonly difficulties = ACTION_DIFFICULTIES;
  protected readonly signed = signedModifier;

  protected readonly attribute = signal<ActionAttribute>('agilite');
  protected readonly difficulty = signal<ActionDifficulty>(DEFAULT_ACTION_DIFFICULTY);
  protected readonly carrieres = computed(() => this.data().carrieres);
  protected readonly carriere = signal<ActionRollCarriere | null>(null);
  protected readonly modifier = signal(0);

  protected readonly avantageTraits = computed(() => this.data().diceTraits.filter((t) => t.kind === 'avantage'));
  protected readonly desavantageTraits = computed(() => this.data().diceTraits.filter((t) => t.kind === 'desavantage'));
  protected readonly selectedDiceTraits = signal<ReadonlySet<string>>(new Set());

  private readonly selectedDiceTraitCounts = computed(() => {
    let avantages = 0;
    let desavantages = 0;
    for (const trait of this.data().diceTraits) {
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

  private readonly netDice = computed(() => {
    const {avantages, desavantages} = this.selectedDiceTraitCounts();
    return netDiceModifier(avantages, desavantages);
  });

  protected readonly diceCountLabel = computed(() => {
    const {avantages, desavantages} = this.selectedDiceTraitCounts();
    return diceCountLabel(avantages, desavantages);
  });

  protected readonly rollButtonLabel = computed(() => `Lancer ${2 + Math.abs(this.netDice())}d6`);

  protected readonly rolling = signal(false);
  protected readonly dice = signal<readonly [number, number] | null>(null);

  /** Saisie manuelle du total (dés physiques lancés à table) — toujours disponible à côté du lancer virtuel. */
  protected readonly manualTotal = signal<number | null>(null);
  protected readonly manualTotalValid = computed(() => {
    const t = this.manualTotal();
    return t !== null && Number.isInteger(t) && t >= 2 && t <= 12;
  });
  /** true quand le résultat vient d'un total saisi à la main — les deux valeurs de `dice()` sont
   * alors reconstruites (`diceFromTotal`), pas les vraies faces lancées. */
  protected readonly manualEntry = signal(false);

  /** Malus d'équipement, appliqué automatiquement quand l'agilité est sélectionnée. */
  protected readonly equipmentModifier = computed(() =>
    this.attribute() === 'agilite' ? this.data().equipementAgilite : 0,
  );

  private readonly parts = computed<ActionRollParts>(() => ({
    attribute: this.data()[this.attribute()],
    carriere: this.carriere()?.value ?? 0,
    equipment: this.equipmentModifier(),
    difficulty: this.difficulty().modifier,
    modifier: this.modifier(),
  }));

  private readonly modifierSum = computed(() => actionModifierSum(this.parts()));

  /** Avant le jet : `2d6 + …`. Après un lancer virtuel : les deux dés gardés. Après une saisie
   * manuelle : `2d6 + …` (les faces individuelles ne sont pas connues). */
  protected readonly formula = computed(() =>
    formatActionFormula(this.parts(), this.manualEntry() ? null : this.dice(), {
      attribute: ACTION_ATTRIBUTE_SHORT[this.attribute()],
      carriere: this.carriere()?.label.toLowerCase(),
      equipment: 'équipement',
      difficulty: this.difficulty().label.toLowerCase(),
      modifier: 'modificateur',
    }),
  );

  protected readonly total = computed(() => {
    const d = this.dice();
    return d ? d[0] + d[1] + this.modifierSum() : null;
  });

  protected readonly isNatural2 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 1 && d[1] === 1;
  });

  protected readonly isNatural12 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 6 && d[1] === 6;
  });

  /** Réussite normale (ni 2 ni 12 naturel) — seul ce cas peut être converti en succès héroïque
   * par dépense de PH (02-actions-combat.md). */
  protected readonly canUpgradeToHeroique = computed(() => {
    const d = this.dice();
    if (!d || this.isNatural2() || this.isNatural12()) {
      return false;
    }
    return suggestedActionResult(d, this.modifierSum(), ACTION_ROLL_THRESHOLD) === 'reussite';
  });

  /** Échec critique (2 naturel) — un choix volontaire qui OCTROIE 1 PH. */
  protected readonly critiqueChosen = signal(false);
  /** Succès légendaire (2e dépense sur un 12 naturel) — dépense 1 PH. */
  protected readonly legendaryChosen = signal(false);
  /** Conversion d'une réussite normale en succès héroïque — dépense 1 PH. */
  protected readonly heroicUpgradeChosen = signal(false);

  protected readonly suggestedResult = computed<InitiativeResultat | null>(() => {
    const d = this.dice();
    if (!d) {
      return null;
    }
    if (this.isNatural2()) {
      return this.critiqueChosen() ? 'echec_critique' : 'echec';
    }
    if (this.isNatural12()) {
      return this.legendaryChosen() ? 'legendaire' : 'heroique';
    }
    const base = suggestedActionResult(d, this.modifierSum(), ACTION_ROLL_THRESHOLD);
    return base === 'reussite' && this.heroicUpgradeChosen() ? 'heroique' : base;
  });

  /** Faveur divine n'a de sens que pour retenter un échec. */
  protected readonly isFailure = computed(() => {
    const result = this.suggestedResult();
    return result === 'echec' || result === 'echec_critique';
  });

  protected readonly resultLabel = computed(() => {
    const result = this.suggestedResult();
    return result ? ACTION_RESULT_LABELS[result] : '';
  });

  protected readonly tone = computed(() => {
    const result = this.suggestedResult();
    return result ? actionResultTone(result) : null;
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
    this.carriere.set(this.carrieres().find((c) => c.label === change.value) ?? null);
  }

  protected isTraitSelected(label: string): boolean {
    return this.selectedDiceTraits().has(label);
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
      const net = this.netDice();
      const count = 2 + Math.abs(net);
      await this.diceBox().clear();
      const results = await this.diceBox().rollNotation(`${count}d6`);
      const values = results.map((r) => r.value);
      this.resetTierChoices();
      this.manualEntry.set(false);
      this.manualTotal.set(null);
      this.dice.set(keepBestOrWorstTwo(values, net));
    } finally {
      this.rolling.set(false);
    }
  }

  /** Dégage les dés 3D encore posés (le résultat n'est pas touché). Ignoré pendant un lancer : ce
   * clear() entrerait en course avec celui de `roll()` et corromprait l'état de la librairie de dés. */
  dismissDice(): void {
    if (this.rolling()) {
      return;
    }
    void this.diceBox().clear();
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
    this.resetTierChoices();
    this.manualEntry.set(true);
    this.dice.set(diceFromTotal(total));
  }

  /** Faveur divine (02-actions-combat.md) : dépense 1 PH, relance tous les dés, conserve le second jet. */
  protected async rollWithDivineFavor(): Promise<void> {
    if (this.heroisme() <= 0) {
      return;
    }

    applyHeroismeDelta(this.herosService, this.snackBar, this.data().herosId, this.heroisme, -1);
    await this.roll();
  }

  private resetTierChoices(): void {
    this.critiqueChosen.set(false);
    this.legendaryChosen.set(false);
    this.heroicUpgradeChosen.set(false);
  }

  /** Échec critique (2 naturel) : choisir OCTROIE 1 PH ; revenir en arrière le reprend. */
  protected toggleCritique(): void {
    this.toggleTierChoice(this.critiqueChosen, {spendOnChoose: false});
  }

  /** Succès légendaire (12 naturel) : choisir DÉPENSE 1 PH ; revenir en arrière la rembourse. */
  protected toggleLegendaire(): void {
    this.toggleTierChoice(this.legendaryChosen, {spendOnChoose: true});
  }

  /** Conversion réussite normale → succès héroïque : choisir DÉPENSE 1 PH ; revenir en arrière la rembourse. */
  protected toggleHeroicUpgrade(): void {
    this.toggleTierChoice(this.heroicUpgradeChosen, {spendOnChoose: true});
  }

  private toggleTierChoice(chosen: WritableSignal<boolean>, {spendOnChoose}: {spendOnChoose: boolean}): void {
    const wasChosen = chosen();
    const nextChosen = !wasChosen;
    if (spendOnChoose && nextChosen && this.heroisme() <= 0) {
      return;
    }

    const sign = spendOnChoose ? -1 : 1;
    const delta = nextChosen ? sign : -sign;
    chosen.set(nextChosen);
    applyHeroismeDelta(this.herosService, this.snackBar, this.data().herosId, this.heroisme, delta, () =>
      chosen.set(wasChosen),
    );
  }
}
