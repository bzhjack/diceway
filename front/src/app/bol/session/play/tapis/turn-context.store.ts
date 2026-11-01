import {afterNextRender, computed, ElementRef, inject, Injectable, Injector, linkedSignal, signal, WritableSignal} from '@angular/core';
import {perdSonAction} from './combat-effects.util';
import {libellePoints} from '../../combat-attack.util';
import {rollD6} from '../../combat-resolution.util';
import {TapisCard} from '../../models/tapis.model';
import type {TurnAssistantComponent} from './turn-assistant';
import {TurnPopover} from '../../models/turn-assistant.model';
import {sideOf} from './turn-assistant.util';

/** Délai maximal d'un lancer 3D avant de tirer les dés sans animation. */
const DICE_TIMEOUT_MS = 12000;

/**
 * Le tour en cours, tel que la page le donne : les entrées et les sorties de `TurnAssistantComponent`, ce que tous les autres stores lisent et
 * par où ils signalent à la page ce qui doit être enregistré (dégâts, fin de tour, défense totale, héroïsme) ; aucun d'eux ne parle à un service.
 * S'y ajoute ce que les étapes partagent : les dés 3D, les éléments où passe la main, le popover des effets, les cœurs de vitalité.
 */
@Injectable()
export class TurnContextStore {
  private host!: TurnAssistantComponent;

  readonly card = computed(() => this.host.card());

  readonly armes = computed(() => this.host.armes());

  readonly ownedArmes = computed(() => this.host.ownedArmes());

  readonly combatOptions = computed(() => this.host.combatOptions());

  readonly targets = computed(() => this.host.targets());

  readonly target = computed(() => this.host.target());

  readonly attacker = computed(() => this.host.attacker());

  readonly targetStats = computed(() => this.host.targetStats());

  readonly targetsStats = computed(() => this.host.targetsStats());

  readonly legendaryBonus = computed(() => this.host.legendaryBonus());

  readonly effets = computed(() => this.host.effets());

  readonly deMj = computed(() => this.host.deMj());

  private readonly diceBox = computed(() => this.host.diceBox());

  readonly carrieres = computed(() => this.host.carrieres());

  readonly canRescue = computed(() => this.host.canRescue());

  readonly hordeMates = computed(() => this.host.hordeMates());

  /** La vitalité de l'attaquant et celle de la cible, chacune sur son cœur : elles suivent la table, et chaque pas est signalé à la
   * page. */
  readonly vitaliteShown = linkedSignal(() => this.card().vitaliteCourante ?? 0);

  readonly targetVitaliteShown = linkedSignal(() => this.target()?.vitaliteCourante ?? 0);

  /** Un héros peut descendre sous 0 (mourant) ; les autres s'arrêtent à 0. */
  readonly vitaliteMin = computed(() => (this.card().kind === 'hero' ? -20 : 0));

  readonly targetVitaliteMin = computed(() => (this.target()?.kind === 'hero' ? -20 : 0));

  /** De quel côté est la carte qui attaque : l'assistant prend la couleur de son camp (`tas--foe`). */
  readonly side = computed(() => sideOf(this.card()));

  readonly isHero = computed(() => this.card().kind === 'hero');

  /** Les options de succès héroïque (dont « Massacrer la piétaille ») sont celles des héros : leurs alliés y ont droit, pas leurs adversaires. */
  readonly heroicAllowed = computed(() => this.card().camp === 'heros');

  // Les clés, pas les objets : la table rechargée repasse des cartes identiques mais neuves, qui ne doivent pas effacer le jet en cours.
  readonly cardKey = computed(() => this.card().key);

  readonly targetKey = computed(() => this.target()?.key ?? null);

  readonly rolling = signal(false);

  /** La case de saisie de la protection (bloc des dégâts). */
  readonly protectionInput = signal<ElementRef<HTMLInputElement> | undefined>(undefined);

  // Les cases et boutons du plateau, pour passer la main de l'un à l'autre au fil de la saisie.
  // Chaque bloc les tient à jour : elles n'existent parfois qu'après le rendu.
  readonly attackInput = signal<ElementRef<HTMLInputElement> | undefined>(undefined);

  readonly scratchInput = signal<ElementRef<HTMLInputElement> | undefined>(undefined);

  readonly damageInput = signal<ElementRef<HTMLInputElement> | undefined>(undefined);

  readonly applyButton = signal<ElementRef<HTMLButtonElement> | undefined>(undefined);

  readonly endButton = signal<ElementRef<HTMLButtonElement> | undefined>(undefined);

  readonly picksList = signal<ElementRef<HTMLElement> | undefined>(undefined);

  readonly injector = inject(Injector);

  /** Le popover ouvert (les effets en cours), ou aucun ; il se ferme à chaque nouveau tour. */
  readonly openPop = linkedSignal<string, TurnPopover | null>({source: () => this.cardKey(), computation: () => null});

  /** « Juste une égratignure » lui a coûté cette action : il ne peut que finir son tour. Le MJ peut retirer l'effet pour le laisser agir. */
  readonly actionPerdue = computed(() => perdSonAction(this.effets(), this.card().key));

  /** « 1 point d'héroïsme » de l'attaquant, ou « 1 point de vilénie » d'un rival qui attaque. */
  readonly unPointAttaquant = computed(() => libellePoints(this.card().kind, 1));

  readonly unPointCible = computed(() => libellePoints(this.target()?.kind ?? 'hero', 1));

  /** L'assistant se branche dès sa construction ; ses entrées ne sont lues qu'ensuite. */
  connect(host: TurnAssistantComponent): void {
    this.host = host;
  }

  get choiceChanged() {
    return this.host.choiceChanged;
  }

  get hordeChanged() {
    return this.host.hordeChanged;
  }

  get targetSelected() {
    return this.host.targetSelected;
  }

  get sheetRequested() {
    return this.host.sheetRequested;
  }

  get attackRolled() {
    return this.host.attackRolled;
  }

  get effectRemoved() {
    return this.host.effectRemoved;
  }

  get effectAdded() {
    return this.host.effectAdded;
  }

  get damageApplied() {
    return this.host.damageApplied;
  }

  get totalDefenseRequested() {
    return this.host.totalDefenseRequested;
  }

  get delayRequested() {
    return this.host.delayRequested;
  }

  get rescueRequested() {
    return this.host.rescueRequested;
  }

  get endTurnRequested() {
    return this.host.endTurnRequested;
  }

  get heroismeAdjusted() {
    return this.host.heroismeAdjusted;
  }

  get vitaliteAdjusted() {
    return this.host.vitaliteAdjusted;
  }

  get targetHeroismeAdjusted() {
    return this.host.targetHeroismeAdjusted;
  }

  /** Lance `count` d6 sur le plateau 3D (ou au hasard s'il est absent ou échoue) et renvoie leurs valeurs. */
  async throwDice(notation: string, count: number): Promise<number[]> {
    const box = this.diceBox();
    if (!box) {
      return Array.from({length: count}, () => rollD6());
    }
    this.rolling.set(true);
    try {
      await box.clear();
      // Garde-fou : si le moteur 3D ne répond pas, le tirage se fait sans animation plutôt que de bloquer le tour.
      const results = await Promise.race([
        box.rollNotation(notation),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('dice timeout')), DICE_TIMEOUT_MS)),
      ]);
      return results.map((r) => r.value);
    } catch {
      return Array.from({length: count}, () => rollD6());
    } finally {
      this.rolling.set(false);
    }
  }

  /** Retire les dés restés sur la table une fois le lancer terminé (un clic n'importe où sur l'écran de combat). */
  dismissDice(): void {
    if (!this.rolling()) {
      void this.diceBox()?.clear();
    }
  }

  signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }

  /** En quittant une case, une saisie laissée incomplète ou hors bornes cède la place à la valeur retenue. */
  restoreInput(input: HTMLInputElement, value: number | null): void {
    input.value = value === null ? '' : `${value}`;
  }

  /** Donne la main à un élément du plateau une fois l'écran à jour (il n'existe parfois qu'après le rendu). */
  focusAfterRender(element: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => element()?.nativeElement.focus(), {injector: this.injector});
  }

  /** L'identifiant du bouton d'un popover, pour lui rendre le focus à la fermeture. */
  popId(pop: TurnPopover): string {
    return `tas-pop-${pop}`;
  }

  togglePop(pop: TurnPopover): void {
    this.openPop.update((open) => (open === pop ? null : pop));
  }

  /** Ferme le popover ouvert et rend le focus à son bouton. */
  closePop(): void {
    const open = this.openPop();
    this.openPop.set(null);
    if (open) {
      document.getElementById(this.popId(open))?.focus();
    }
  }

  onPopKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closePop();
    }
  }

  /** Une correction sur le cœur de l'attaquant. */
  adjustVitalite(value: number): void {
    this.correctVitalite(this.card(), this.vitaliteShown, value);
  }

  /** Une correction sur le cœur de la cible. */
  adjustTargetVitalite(value: number): void {
    const target = this.target();
    if (target) {
      this.correctVitalite(target, this.targetVitaliteShown, value);
    }
  }

  /** Signale une correction à la page, d'un pas à la fois (deux clics rapides valent deux pas de 1, pas 1 puis 2). */
  private correctVitalite(card: TapisCard, shown: WritableSignal<number>, value: number): void {
    const delta = value - shown();
    shown.set(value);
    if (delta !== 0) {
      this.vitaliteAdjusted.emit({card, delta});
    }
  }
}
