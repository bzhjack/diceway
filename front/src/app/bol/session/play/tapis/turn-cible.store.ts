import {afterNextRender, computed, effect, ElementRef, inject, Injectable, linkedSignal, signal} from '@angular/core';
import {descriptionEffet, libelleDuree, modificateursPour, sommeModificateurs} from './combat-effects.util';
import {sbireBouclier} from '../../combat-attack.util';
import {attackBonus, computeAttackTotal, resolvePostureAttackModifier} from '../../combat-resolution.util';
import {TapisCard} from '../../models/tapis.model';
import {isLowVitalite, vitalitePercent} from './tapis.util';
import {usableAvatar} from '../../../../shared/avatar-fallback/avatar.util';
import {parFiche} from '../theatre/theatre.util';
import {sansNumero} from '../../reaction-roll.util';
import {StatTile, LifeBar, TargetGroup} from '../../models/turn-assistant.model';
import {protectionTile, sideOf, pointsAffiches} from './turn-assistant.util';
import {objetsDeParade} from './options-heroiques.util';
import {ObjetDeParade} from '../../models/combat-attack.model';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnDamageStore} from './turn-damage.store';

/** Qui viser, et ce qu'il peut opposer au coup : les cibles possibles et leurs chances, la fiche de la cible, et ses réactions possibles. */
@Injectable()
export class TurnCibleStore {
  private readonly turn = inject(TurnContextStore);
  private readonly loadout = inject(TurnLoadoutStore);
  private readonly attack = inject(TurnAttackStore);
  private readonly damage = inject(TurnDamageStore);

  /** Fiche de la cible choisie : ce qui s'oppose au coup, sa défense et sa protection. */
  readonly targetTiles = computed<readonly StatTile[]>(() => {
    const stats = this.turn.targetStats();
    if (!stats) {
      return [];
    }
    const armorIgnored = !this.loadout.sortMode() && this.loadout.choice()?.special?.slug === 'armor-chink';
    // Contre un sort, son esprit : un sort qui agit sur l'esprit le subit en malus (livre p. 148).
    const esprit: StatTile[] = this.loadout.sortMode() ? [{label: 'Esprit', value: this.turn.signed(stats.magie?.esprit ?? 0), ...(this.loadout.sortModel().espritCible ? {tone: 'up' as const} : {})}] : [];
    return [
      ...esprit,
      {label: 'Défense', value: String(stats.defense)},
      armorIgnored ? {label: 'Armure ignorée', value: '0', tone: 'up'} : protectionTile(stats.protectionText, stats.protection),
    ];
  });

  /** Ceux de la cible, de même : un coriace, une piétaille, une créature ou un démon n'en ont pas. */
  readonly pointsCible = computed(() => pointsAffiches(this.turn.target()?.kind ?? 'hero', this.turn.targetStats()?.heroisme ?? null));

  /** Les cibles possibles, par fiche : les exemplaires d'une même fiche (les squelettes) sous leur nom commun, chacun par son numéro. */
  readonly targetGroups = computed<readonly TargetGroup[]>(() => {
    const odds = this.odds();
    return parFiche(this.turn.targets()).map((cards) => {
      const shared = new Set(cards.map((card) => odds[card.key] ?? null));
      const groupOdds = shared.size === 1 ? [...shared][0] : null;
      return {
        key: cards[0].key,
        nom: cards.length > 1 ? sansNumero(cards[0].nom) : cards[0].nom,
        foe: cards[0].camp !== 'heros',
        odds: groupOdds,
        members: cards.map((card, index) => ({
          card,
          num: card.nom.match(/#(\d+)$/)?.[1] ?? `${index + 1}`,
          life: this.lifeOf(card),
          odds: groupOdds === null ? (odds[card.key] ?? null) : null,
        })),
      };
    });
  });

  /** Ce qu'est chaque cible à choisir, en clair (« PNJ · Rival », « Créature · Coriace ») ; vide pour un héros de la compagnie. */
  readonly targetDetails = computed<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(this.turn.targets().map((t) => [t.key, sideOf(t).detail])),
  );

  /** Sur le jeton de chaque carte visable, ce qu'il faut pour la toucher avec l'arme et la posture choisies : « 6+ · 72 % ». Absent tant
   * que ses statistiques ne sont pas connues. */
  readonly odds = computed<Readonly<Record<string, string>>>(() => {
    const a = this.turn.attacker();
    const odds: Record<string, string> = {};
    if (!a) {
      return odds;
    }
    const selected = this.turn.target()?.key;
    for (const card of this.turn.targets()) {
      const stats = this.turn.targetsStats().get(card.key);
      // La cible choisie reprend le calcul du plateau, modificateurs figés compris.
      const modifier =
        card.key === selected
          ? this.attack.attackModifier()
          : stats
            ? computeAttackTotal(
                0,
                attackBonus(a, this.loadout.isTir(), this.loadout.brawl()),
                stats.defense,
                sommeModificateurs(modificateursPour(this.turn.effets(), {jet: 'attaque', attaquant: this.turn.card().key, cible: card.key, bouclier: stats.bouclierMalusUneAttaque, bouclierToutes: stats.bouclierDefenseToutes, ignoreBouclier: this.loadout.ignoreBouclier()})) +
                  sommeModificateurs(this.loadout.extraAttackTerms()),
                this.turn.legendaryBonus() ? 1 : 0,
                resolvePostureAttackModifier(this.loadout.choice()?.posture ?? null, stats.protection) +
                  resolvePostureAttackModifier(this.loadout.choice()?.special ?? null, stats.protection),
              )
            : null;
      if (modifier !== null) {
        const goal = this.attack.goalFor(modifier);
        odds[card.key] = `${goal.big} · ${goal.chance} %`;
      }
    }
    return odds;
  });

  /** Le nombre d'effets en cours sur l'attaquant et sa cible : le compteur du bouton « Effets ». */
  readonly effetsCount = computed(() => {
    const keys = new Set(this.duelistes().map((d) => d.key));
    return this.turn.effets().filter((effet) => keys.has(effet.porteur)).length;
  });

  /** Les deux duellistes, pour nommer à qui appartient un effet et à qui l'ajouter. */
  readonly duelistes = computed(() => {
    const target = this.turn.target();
    return [{key: this.turn.card().key, nom: this.turn.card().nom}, ...(target ? [{key: target.key, nom: target.nom}] : [])];
  });

  readonly targetBadges = computed(() => this.badgesDe(this.turn.target()?.key));

  /** Une cible vient d'être choisie : la case du jet d'attaque prend la main dès qu'elle est à l'écran. */
  private attackFocusWanted = false;

  /** Le portrait de la cible, sur ses boutons de réaction ; sans portrait, son initiale. */
  readonly targetPortrait = computed(() => usableAvatar(this.turn.target()?.avatar));

  /** La ligne des cartes de cible déborde-t-elle, et peut-elle défiler vers la gauche ou la droite : les flèches s'affichent et se grisent. */
  readonly canScrollPrev = signal(false);

  readonly canScrollNext = signal(false);

  readonly picksOverflow = computed(() => this.canScrollPrev() || this.canScrollNext());

  /** Points de la cible pour se défendre : l'héroïsme d'un héros, la vilénie d'un rival (0 pour les autres). */
  readonly targetHeroisme = computed(() => this.turn.targetStats()?.heroisme ?? 0);

  /** Parade in extremis (02-actions-combat.md, « Points d'héroïsme ») : un coup qui touche un héros ou un rival, pas encore appliqué. */
  // Contre un sort, ni parade in extremis ni bouclier humain : le livre ne les donne que contre un coup (interprétation).
  readonly canParry = computed(() => this.damage.hasDamageStep() && !this.loadout.sortMode() && this.targetHeroisme() > 0);

  /** Ce que la cible peut interposer dans une parade in extremis : son bouclier, son arme, ou les deux (le choix est alors proposé). */
  readonly parryItems = computed(() => objetsDeParade(this.turn.targetStats()));

  /** Ce qu'elle interpose, et qui sera brisé : son bouclier d'office s'il en a un, sinon son arme ; le MJ peut choisir l'autre. Son
   * choix tient pour ce défenseur pendant ce tour, même quand la table rechargée relit la fiche de la cible (un objet neuf) : il ne
   * revient au défaut que pour un autre défenseur, un autre tour, ou quand l'objet choisi n'est plus là. */
  readonly parryWith = linkedSignal<{readonly scope: string; readonly items: readonly ObjetDeParade[]}, ObjetDeParade>({
    source: () => ({scope: `${this.turn.turnKey()}|${this.turn.targetKey() ?? ''}`, items: this.parryItems()}),
    computation: (source, previous) =>
      previous && previous.source.scope === source.scope && source.items.includes(previous.value) ? previous.value : source.items[0],
  });

  /** Le sbire qui peut servir de bouclier humain au rival visé : une piétaille encore debout de son camp. */
  readonly sbire = computed(() => {
    const target = this.turn.target();
    return target?.kind === 'pnj' ? sbireBouclier(target, this.turn.targets()) : null;
  });

  /** « Bouclier humain » (04-pnj-creatures-demons.md, « Points de vilenie ») : un coup qui touche un rival qui a de la vilénie et un
   * sbire à ses côtés. */
  readonly canHumanShield = computed(() => this.damage.hasDamageStep() && !this.loadout.sortMode() && this.targetHeroisme() > 0 && this.sbire() !== null);

  constructor() {
    // Les flèches de la ligne des cibles suivent sa taille (fenêtre, panneau) et son contenu (cibles qui changent).
    effect((onCleanup) => {
      const list = this.turn.picksList()?.nativeElement;
      this.targetGroups();
      afterNextRender(() => this.updatePicksScroll(), {injector: this.turn.injector});
      if (!list || typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => this.updatePicksScroll());
      observer.observe(list);
      onCleanup(() => observer.disconnect());
    });

    // La case du jet d'attaque n'existe qu'une fois les statistiques de la cible lues : elle prend la main à ce moment-là.
    effect(() => {
      const input = this.turn.attackInput();
      if (input && this.attackFocusWanted) {
        this.attackFocusWanted = false;
        input.nativeElement.focus();
      }
    });
  }

  private badgesDe(key: string | undefined): readonly string[] {
    return key
      ? this.turn.effets()
          .filter((effet) => effet.porteur === key && effet.valeur !== 0)
          .map((effet) => `${descriptionEffet(effet)} · ${libelleDuree(effet.duree)}`)
      : [];
  }

  /** La barre de vie d'une carte. Celle de la cible choisie montre aussi ce que le coup en cours va lui retirer. */
  private lifeOf(card: TapisCard): LifeBar {
    const rest = vitalitePercent(card.vitaliteCourante, card.vitaliteMax);
    const max = card.vitaliteMax ?? 0;
    const hit = card.key === this.turn.target()?.key ? (this.damage.damage() ?? 0) : 0;
    const loss = max > 0 ? Math.min(rest, (hit / max) * 100) : 0;
    return {rest: rest - loss, loss, low: isLowVitalite(card.vitaliteCourante, card.vitaliteMax)};
  }

  /** « Changer d'adversaire » : la cible est abandonnée, la rangée des cartes revient, le focus sur la première. */
  changeTarget(): void {
    this.turn.targetSelected.emit(null);
    this.turn.focusAfterRender(() => this.firstPick());
  }

  /** Vise une carte — ou, si c'est déjà la cible, y renonce. */
  selectTarget(card: TapisCard): void {
    const same = this.turn.target()?.key === card.key;
    this.attackFocusWanted = !same;
    this.turn.targetSelected.emit(same ? null : card);
  }

  /** Le premier bouton de la liste des cibles (la première carte), pour y rendre le focus. */
  firstPick(): ElementRef<HTMLElement> | undefined {
    const button = this.turn.picksList()?.nativeElement.querySelector<HTMLElement>('.tas-cible button');
    return button ? new ElementRef(button) : undefined;
  }

  updatePicksScroll(): void {
    const list = this.turn.picksList()?.nativeElement;
    // Quelques pixels de tolérance : l'aimantation des cartes laisse parfois la ligne à 2 px du bord.
    this.canScrollPrev.set(!!list && list.scrollLeft > 4);
    this.canScrollNext.set(!!list && list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
  }

  /** Fait défiler la ligne des cartes d'à peu près sa largeur, d'un côté ou de l'autre. */
  scrollPicks(direction: -1 | 1): void {
    const list = this.turn.picksList()?.nativeElement;
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    list?.scrollBy({left: direction * list.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth'});
  }
}
