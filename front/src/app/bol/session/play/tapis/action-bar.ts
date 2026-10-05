import {ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';
import {
  ARME_IMPROVISEE,
  AttackChoice,
  DUAL_WIELD_SLUGS,
  filterAttackMenuCombatOptions,
  filterVisiblePostures,
  MAINS_NUES,
} from '../../attack-options.util';
import {dualStrikeDegats, isDualWieldEligible} from '../../combat-attack.util';
import {TapisCard} from './tapis.util';

/** Barre d'action de la carte active, entre les deux rangs du tapis en combat : arme, posture, arme
 * secondaire, « Défense totale » et « Fin du tour ». Elle ne lance pas l'attaque — c'est le clic sur
 * une carte adverse qui la lance — mais dit à la page avec quoi attaquer (`choiceChanged`). */
@Component({
  selector: 'bol-action-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './action-bar.html',
  styleUrl: './action-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionBarComponent {
  readonly card = input.required<TapisCard>();
  /** Armes du héros actif — vide pour un PNJ, une créature ou un démon, ou tant qu'elles chargent. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);

  readonly choiceChanged = output<AttackChoice | null>();
  readonly totalDefenseRequested = output<void>();
  readonly endTurnRequested = output<void>();

  protected readonly isHero = computed(() => this.card().kind === 'hero');

  /** Armes proposées : celles du héros, puis mains nues et arme improvisée. Un non-héros attaque
   * avec les dégâts de sa carte : pas de choix. */
  protected readonly displayArmes = computed(() => (this.isHero() ? [...this.armes(), MAINS_NUES, ARME_IMPROVISEE] : []));

  // Les choix repartent de zéro à chaque nouvelle carte active.
  private readonly selectedArmeId = linkedSignal<string, number | null>({source: () => this.card().key, computation: () => null});
  private readonly selectedOptionSlug = linkedSignal<string, string | null>({source: () => this.card().key, computation: () => null});
  private readonly selectedOffHandId = linkedSignal<string, number | null>({source: () => this.card().key, computation: () => null});

  protected readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    return list.find((a) => a.id === this.selectedArmeId()) ?? list[0] ?? null;
  });

  /** Armes éligibles en second (légères ou moyennes, hors l'arme principale). */
  protected readonly eligibleOffHandArmes = computed(() => {
    const mainId = this.effectiveArme()?.id;
    return this.displayArmes().filter((a) => a.id !== mainId && isDualWieldEligible(a.arme?.degats));
  });

  protected readonly visibleOptions = computed(() => {
    const options = filterAttackMenuCombatOptions(this.combatOptions());
    if (!this.isHero()) {
      return options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
    }
    const otherDegats = this.eligibleOffHandArmes().map((a) => a.arme?.degats ?? null);
    return filterVisiblePostures(options, this.effectiveArme()?.arme?.degats ?? null, otherDegats);
  });

  protected readonly effectiveOption = computed(() => {
    const list = this.visibleOptions();
    return list.find((o) => o.slug === this.selectedOptionSlug()) ?? list[0] ?? null;
  });

  protected readonly isDualWieldSelected = computed(() => DUAL_WIELD_SLUGS.has(this.effectiveOption()?.slug ?? ''));

  protected readonly effectiveOffHand = computed(() => {
    const list = this.eligibleOffHandArmes();
    return list.find((a) => a.id === this.selectedOffHandId()) ?? list[0] ?? null;
  });

  /** Ce avec quoi la carte attaque — `null` si une posture à deux armes est choisie sans arme
   * secondaire jouable. */
  private readonly choice = computed<AttackChoice | null>(() => {
    if (this.isDualWieldSelected() && !this.effectiveOffHand()) {
      return null;
    }

    const option = this.effectiveOption();
    const mainDegats = this.isHero() ? (this.effectiveArme()?.arme?.degats ?? null) : null;
    const offHand = this.effectiveOffHand();
    const degats = option?.slug === 'dual-strike' && offHand ? dualStrikeDegats(mainDegats, offHand.arme?.degats) : mainDegats;

    return {degats, posture: option && option.slug !== 'none' ? option : null};
  });

  constructor() {
    effect(() => this.choiceChanged.emit(this.choice()));
  }

  protected selectArme(id: number | undefined): void {
    this.selectedArmeId.set(id ?? null);
  }

  protected selectOption(slug: string): void {
    this.selectedOptionSlug.set(slug);
    if (!DUAL_WIELD_SLUGS.has(slug)) {
      this.selectedOffHandId.set(null);
    }
  }

  protected selectOffHand(id: number | undefined): void {
    this.selectedOffHandId.set(id ?? null);
  }
}
