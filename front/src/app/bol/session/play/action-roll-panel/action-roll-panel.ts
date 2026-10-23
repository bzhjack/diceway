import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
  ViewEncapsulation,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {DwDieFaceComponent} from '../../../../shared/die-face/die-face';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolHerosService} from '../../../services/bol-heros.service';
import {ACTION_ATTRIBUTE_LABELS, ACTION_ATTRIBUTE_SHORT, ACTION_ATTRIBUTES, ACTION_DIFFICULTIES, ACTION_ROLL_THRESHOLD, actionDiceTarget, actionDiceTargetLabel, actionModifierSum, actionResultTone, actionSuccessChance, actionVerdict, chanceRingDash, DEFAULT_ACTION_DIFFICULTY, diceFromTotal, keptDiceIndexes, netDiceModifier, signedModifier, suggestedActionResult} from '../../action-roll.util';
import {ActionAttribute, ActionDifficulty, ActionRollCarriere, ActionRollData, ActionRollParts, RollSumTerm} from '../../models/action-roll.model';
import {applyHeroismeDelta} from '../../heroisme-spend.util';

/** Icône de chaque attribut sur son médaillon. */
const ATTRIBUTE_ICONS: Record<ActionAttribute, string> = {agilite: 'bolt', vigueur: 'fitness_center', esprit: 'visibility', aura: 'star'};

/** Un dé lancé, tel qu'il s'affiche sur le plateau : sa face, et s'il est gardé (un dé de bonus ou de malus en écarte). */
interface RolledDie {
  readonly value: number;
  readonly kept: boolean;
}

/** Jet d'action d'un héros (fiche du jeton, `bol-expanded-card`), comme une table de jeu : à gauche avec quoi on agit
 * (attribut en médaillon, métier), au centre le plateau (ce qu'il faut obtenir, les chances, les dés, le verdict, l'héroïsme),
 * à droite la difficulté sur son échelle et les coups de pouce (dés de bonus/malus, modificateur). Le calcul est dans
 * `action-roll.util.ts`. */
@Component({
  selector: 'bol-action-roll-panel',
  imports: [MatIconModule, MatTooltipModule, DiceBoxHostComponent, DwDieFaceComponent],
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
  private readonly manualInput = viewChild<ElementRef<HTMLInputElement>>('manualInput');
  private readonly injector = inject(Injector);

  protected readonly attributes = ACTION_ATTRIBUTES;
  protected readonly attributeLabels = ACTION_ATTRIBUTE_LABELS;
  protected readonly attributeIcons = ATTRIBUTE_ICONS;
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
  /** Dé de bonus ou de malus accordé par le MJ selon les circonstances (agir ivre, dans le noir, avec un outil de fortune…) : il compte
   * comme un avantage ou un désavantage de plus. L'un exclut l'autre. */
  protected readonly gmDie = signal<'bonus' | 'malus' | null>(null);

  /** Avantages et désavantages retenus pour ce jet : les traits cochés du héros, plus le dé du MJ. */
  private readonly selectedDiceTraitCounts = computed(() => {
    let avantages = this.gmDie() === 'bonus' ? 1 : 0;
    let desavantages = this.gmDie() === 'malus' ? 1 : 0;
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

  /** Nombre de dés lancés : deux, plus un par dé de bonus ou de malus retenu. */
  protected readonly diceCount = computed(() => 2 + Math.abs(this.netDice()));
  /** Emplacements vides du plateau avant le lancer, un par dé. */
  protected readonly ghosts = computed(() => Array.from({length: this.diceCount()}, (_, index) => index));

  protected readonly rolling = signal(false);
  protected readonly dice = signal<readonly [number, number] | null>(null);
  /** Tous les dés du dernier lancer virtuel, gardés ou écartés ; `null` avant le lancer ou après une saisie à table. */
  protected readonly rolled = signal<readonly RolledDie[] | null>(null);
  protected readonly diceSum = computed(() => {
    const d = this.dice();
    return d ? d[0] + d[1] : null;
  });

  /** Saisie manuelle du total (dés physiques lancés à table) — toujours disponible à côté du lancer virtuel. */
  protected readonly manualTotal = signal<number | null>(null);
  protected readonly manualTotalValid = computed(() => {
    const t = this.manualTotal();
    return t !== null && Number.isInteger(t) && t >= 2 && t <= 12;
  });
  /** true quand le résultat vient d'un total saisi à la main — les deux valeurs de `dice()` sont
   * alors reconstruites (`diceFromTotal`), pas les vraies faces lancées. */
  protected readonly manualEntry = signal(false);
  /** Faveur divine dépensée sur des dés lancés à table : ils sont à relancer, et le nouveau total à saisir. */
  protected readonly favorPending = signal(false);

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

  /** Ce qu'il faut obtenir aux dés, en gros et en petit : « 7+ aux dés », « Tout sauf le double 1 », « 6·6 seul le double 6 ». */
  protected readonly target = computed(() => actionDiceTargetLabel(actionDiceTarget(this.modifierSum(), ACTION_ROLL_THRESHOLD)));

  /** Chances de réussir, en pourcentage entier, avec les dés de bonus ou de malus retenus. */
  protected readonly chancePercent = computed(() => Math.round(actionSuccessChance(this.netDice(), this.modifierSum(), ACTION_ROLL_THRESHOLD) * 100));
  /** Longueur de l'arc doré de l'anneau des chances. */
  protected readonly ringDash = computed(() => chanceRingDash(this.chancePercent()));

  /** L'addition du jet, sur une ligne : un nombre par terme, son nom dessous. Les termes nuls sont omis. Avant le jet, le premier terme
   * est le nombre de dés à lancer et le dernier le seuil ; après, le total des dés gardés et le total du jet. */
  protected readonly sumTerms = computed<readonly RollSumTerm[]>(() => {
    const parts = this.parts();
    const net = this.netDice();
    const sum = this.diceSum();
    const names: Record<'attribute' | 'carriere' | 'equipment' | 'difficulty' | 'modifier', string> = {
      attribute: ACTION_ATTRIBUTE_SHORT[this.attribute()],
      carriere: this.carriere()?.label.toLowerCase() ?? 'carrière',
      equipment: 'équipement',
      difficulty: this.difficulty().label.toLowerCase(),
      modifier: 'modif.',
    };
    const kept = net > 0 ? '2 meilleurs' : net < 0 ? '2 moins bons' : 'dés';
    const terms: RollSumTerm[] = [{value: sum === null ? `${this.diceCount()}d6` : `${sum}`, caption: kept, tone: 'dice'}];
    for (const key of ['attribute', 'carriere', 'equipment', 'difficulty', 'modifier'] as const) {
      const value = parts[key];
      if (value !== 0) {
        terms.push({value: `${value > 0 ? '+' : '−'}${Math.abs(value)}`, caption: names[key], tone: value > 0 ? 'plus' : 'minus'});
      }
    }
    const total = this.total();
    terms.push(total === null ? {value: `≥ ${ACTION_ROLL_THRESHOLD}`, caption: 'seuil', tone: 'total'} : {value: `= ${total}`, caption: `pour ${ACTION_ROLL_THRESHOLD}`, tone: 'total'});
    return terms;
  });


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

  /** Résultat des dés avant tout choix d'héroïsme. */
  private readonly baseResult = computed(() => {
    const d = this.dice();
    return d ? suggestedActionResult(d, this.modifierSum(), ACTION_ROLL_THRESHOLD) : null;
  });

  /** Double 6 qui vaut succès héroïque — pas celui d'une action qui ne pouvait réussir qu'avec lui, simple réussite. Seul ce cas ouvre
   * le succès légendaire. */
  protected readonly isHeroic12 = computed(() => this.isNatural12() && this.baseResult() === 'heroique');

  /** Réussite normale — seul ce cas peut être converti en succès héroïque par dépense de PH (02-actions-combat.md). */
  protected readonly canUpgradeToHeroique = computed(() => this.baseResult() === 'reussite');

  /** Échec critique (2 naturel) — un choix volontaire qui OCTROIE 1 PH. */
  protected readonly critiqueChosen = signal(false);
  /** Succès légendaire (2e dépense sur un 12 naturel) — dépense 1 PH. */
  protected readonly legendaryChosen = signal(false);
  /** Conversion d'une réussite normale en succès héroïque — dépense 1 PH. */
  protected readonly heroicUpgradeChosen = signal(false);

  protected readonly suggestedResult = computed<InitiativeResultat | null>(() => {
    const base = this.baseResult();
    if (base === null) {
      return null;
    }
    if (this.isNatural2()) {
      return this.critiqueChosen() ? 'echec_critique' : 'echec';
    }
    if (this.isHeroic12()) {
      return this.legendaryChosen() ? 'legendaire' : 'heroique';
    }
    return base === 'reussite' && this.heroicUpgradeChosen() ? 'heroique' : base;
  });

  /** Faveur divine n'a de sens que pour retenter un échec — plus une fois l'échec critique accepté (son point d'héroïsme est gagné). */
  protected readonly isFailure = computed(() => this.suggestedResult() === 'echec');

  /** Le verdict en clair : son titre et de combien c'est réussi ou raté. */
  protected readonly verdict = computed(() => {
    const result = this.suggestedResult();
    const d = this.dice();
    const total = this.total();
    return result && d && total !== null ? actionVerdict(result, d, total, ACTION_ROLL_THRESHOLD) : null;
  });

  protected readonly tone = computed(() => {
    const result = this.suggestedResult();
    return result ? actionResultTone(result) : null;
  });

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

  /** Accorde le dé de bonus ou de malus du MJ ; un second clic sur le même le retire. */
  protected toggleGmDie(kind: 'bonus' | 'malus'): void {
    this.gmDie.update((current) => (current === kind ? null : kind));
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
      const kept = keptDiceIndexes(values, net);
      this.resetTierChoices();
      this.favorPending.set(false);
      this.manualEntry.set(false);
      this.manualTotal.set(null);
      this.rolled.set(values.map((value, index) => ({value, kept: kept.includes(index)})));
      this.dice.set([values[kept[0]], values[kept[1]]]);
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
    this.favorPending.set(false);
    this.manualEntry.set(true);
    this.rolled.set(null);
    this.dice.set(diceFromTotal(total));
  }

  /** Faveur divine (02-actions-combat.md) : dépense 1 PH, relance tous les dés, conserve le second jet. Le jet s'efface et la case
   * attend le second : le joueur relance à table et saisit le total, ou lance à l'écran — même si le premier jet avait été lancé à
   * l'écran, c'est à lui de choisir. */
  protected rollWithDivineFavor(): void {
    if (this.heroisme() <= 0) {
      return;
    }

    applyHeroismeDelta(this.herosService, this.snackBar, this.data().herosId, this.heroisme, -1);
    this.resetTierChoices();
    this.favorPending.set(true);
    this.rolled.set(null);
    this.dice.set(null);
    this.manualTotal.set(null);
    afterNextRender(() => this.manualInput()?.nativeElement.focus(), {injector: this.injector});
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
