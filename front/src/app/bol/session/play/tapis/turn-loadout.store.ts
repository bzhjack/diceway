import {computed, effect, inject, Injectable, linkedSignal} from '@angular/core';
import {form, max, min} from '@angular/forms/signals';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {ModifierTerm} from '../../models/combat-effect.model';
import {netDiceModifier} from '../../action-roll.util';
import {desDeFoi, doitUnDeDeMalus, POSTURE_DEFENSE} from './combat-effects.util';
import {changerCercle, cercleSort, CERCLES_SORT, coutSort, degatsSort, difficulteSort, DIFFICULTES_SORT, pouvoirSuffisant, saisieSortParDefaut, sortSansJet} from '../../magie-combat.util';
import {CercleSort, SortSaisie} from '../../models/magie-combat.model';
import {baseRangeMeters, DEFAULT_RANGE_INDEX, formatMeters, RANGE_FACTORS, rangeReach} from '../../range.util';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {ARME_IMPROVISEE, DUAL_WIELD_SLUGS, filterAttackMenuCombatOptions, filterVisiblePostures, isDualWieldWeapon, isHeavyWeapon, MAINS_NUES} from '../../attack-options.util';
import {dualStrikeDegats} from '../../combat-attack.util';
import {estArmeFavorite} from '../../../shared/arme/arme-favorite.util';
import {degatsEnMain, estPolyvalente, resolvePostureAttackModifier} from '../../combat-resolution.util';
import {AttackChoice} from '../../models/attack-options.model';
import {PostureChoice, DualChoice} from '../../models/turn-assistant.model';
import {signedTerm, signedOrZero, extraTerm} from './turn-assistant.util';
import {TurnContextStore} from './turn-context.store';

/** Les postures de l'échelle, de la plus prudente à la plus audacieuse ; les autres sont des options spéciales. */
const SCALE_SLUGS: readonly string[] = ['defensive', 'none', 'offensive', 'intrepid'];

/** La défense totale, au bout prudent de l'échelle des postures : pas d'attaque, +2 en défense (02-actions-combat.md). */
const DEFENSE_TOTALE = 'total';

/** Dégâts d'une attaque de horde qui touche, quelles que soient les armes des piétailles (livre p. 132). */
const HORDE_DEGATS = 'd6M';

/** Les réglages du coup, avant le jet : l'arme, la posture et les manœuvres, le combat à deux armes, la portée, la horde, la carrière, les dés accordés. Ils repartent de zéro à chaque nouvelle carte active. */
@Injectable()
export class TurnLoadoutStore {
  private readonly turn = inject(TurnContextStore);

  /** Les mains nues et l'arme improvisée sont à tous ceux qui se battent comme les héros : héros, rivaux et coriaces (02-actions-combat.md,
   * « Dégâts ») — un PNJ désarmé n'a plus que ça. La piétaille a des dégâts fixes (1, ou d3 armée ; 1 à mains nues, 04-pnj-creatures-demons.md),
   * créatures et démons n'ont pas d'arme. */
  private readonly hasMakeshiftWeapons = computed(() => this.turn.isHero() || (this.turn.card().kind === 'pnj' && this.turn.card().rang !== 'Piétaille'));

  /** Un héros attaque avec ses armes équipées, un PNJ avec n'importe laquelle de ses armes ; plus, pour eux, les mains nues et l'arme
   * improvisée. */
  readonly displayArmes = computed(() => (this.hasMakeshiftWeapons() ? [...this.turn.armes(), MAINS_NUES, ARME_IMPROVISEE] : this.turn.armes()));

  // La source est la clé du tour (`turnKey` : le round et la clé de la carte), pas la carte : la table rechargée repasse une carte identique
  // mais neuve, qui remettrait ces choix à zéro — et, avec eux, le jet en cours.
  private readonly selectedArmeId = linkedSignal<string, number | null>({source: () => this.turn.turnKey(), computation: () => null});

  private readonly selectedOptionSlug = linkedSignal<string, string | null>({source: () => this.turn.turnKey(), computation: () => null});

  /** L'option spéciale (défaut de l'armure, deux armes), à part de la posture : les deux se cumulent. */
  private readonly selectedSpecialSlug = linkedSignal<string, string | null>({source: () => this.turn.turnKey(), computation: () => null});

  private readonly selectedOffHandId = linkedSignal<string, number | null>({source: () => this.turn.turnKey(), computation: () => null});

  /** Les armes lourdes que l'attaquant ne peut pas manier : toutes, s'il a moins de 0 en vigueur (02-actions-combat.md, « Dégâts »). */
  private readonly heavyForbidden = computed<ReadonlySet<number | undefined>>(() =>
    (this.turn.attacker()?.vigueur ?? 0) < 0 ? new Set(this.displayArmes().filter(isHeavyWeapon).map((a) => a.id)) : new Set(),
  );

  readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    const allowed = list.filter((a) => !this.heavyForbidden().has(a.id));
    // Un tireur (son tir dépasse sa mêlée) part d'office sur son arme de tir : l'archer prend son arc, pas sa dague.
    const preferred = this.prefersTir() ? allowed.find((a) => a.arme?.type === 'T') : undefined;
    return allowed.find((a) => a.id === this.selectedArmeId()) ?? preferred ?? allowed[0] ?? list[0] ?? null;
  });

  /** À mains nues — celles d'un héros, ou une arme « Mains nues » d'un PNJ : la vigueur ne compte que pour moitié dans les dégâts, et
   * ces dégâts se récupèrent en totalité après le combat. */
  readonly unarmed = computed(() => {
    const arme = this.effectiveArme();
    return arme?.id === MAINS_NUES.id || /mains nues/i.test(arme?.arme?.arme ?? '');
  });

  /** Bagarre à mains nues (livre p. 62, au choix du MJ) : la vigueur remplace l'agilité dans le bonus d'attaque. */
  private readonly brawlChosen = linkedSignal<string, boolean>({source: () => this.turn.turnKey(), computation: () => false});

  readonly canBrawl = computed(() => this.unarmed() && this.turn.attacker()?.attaque === null);

  readonly brawl = computed(() => this.canBrawl() && this.brawlChosen());

  /** Arme polyvalente (Mythic+, « d6 ou d6B ») : maniée à deux mains — d'office, sauf en combat à deux armes —, elle frappe avec son
   * second dé. */
  private readonly deuxMainsChoisi = linkedSignal<string, boolean>({source: () => this.turn.turnKey(), computation: () => true});

  readonly polyvalente = computed(() => estPolyvalente(this.effectiveArme()?.arme?.degats) && !this.isDualWieldSelected());

  /** Pourquoi elle ne peut pas se manier à deux mains : un bouclier occupe l'autre main, ou, à deux mains, ce serait une arme lourde
   * (d6B), impossible avec moins de 0 en vigueur ; `null` si rien ne l'empêche. */
  readonly deuxMainsInterdit = computed(() => {
    const attacker = this.turn.attacker();
    if (attacker?.bouclier) {
      return 'Son bouclier occupe l’autre main : l’arme se manie à une main.';
    }
    return (attacker?.vigueur ?? 0) < 0 ? 'À deux mains, c’est une arme lourde : impossible à manier avec moins de 0 en vigueur.' : null;
  });

  readonly deuxMains = computed(() => this.polyvalente() && this.deuxMainsChoisi() && this.deuxMainsInterdit() === null);

  readonly degatsDeuxMains = computed(() => degatsEnMain(this.effectiveArme()?.arme?.degats ?? null, true));

  /** Modificateur libre du MJ au jet d'attaque (circonstances), comme sur le jet d'action : il repart de 0 à chaque carte active. */
  readonly freeModifier = linkedSignal({source: () => this.turn.turnKey(), computation: () => 0});

  /** « Carrières et combat » (02-actions-combat.md) : pour une manœuvre ou une feinte décrite par le joueur, le MJ peut ajouter le rang
   * d'une carrière au jet d'attaque ou aux dégâts, jamais aux deux. */
  readonly usefulCarrieres = computed(() => this.turn.carrieres().filter((c) => c.value > 0));

  private readonly careerLabel = linkedSignal<string, string | null>({source: () => this.turn.turnKey(), computation: () => null});

  readonly careerOn = linkedSignal<string, 'attaque' | 'degats'>({source: () => this.turn.turnKey(), computation: () => 'attaque'});

  readonly career = computed(() => this.usefulCarrieres().find((c) => c.label === this.careerLabel()) ?? null);

  /** Règle de horde (04-pnj-creatures-demons.md ; livre p. 132) : des piétailles qui attaquent ensemble la même cible ne font qu'une
   * attaque, à +1 par piétaille impliquée, et infligent d6M si elle touche. Le MJ coche celles qui se joignent à la carte active ;
   * le choix repart de zéro à chaque nouvelle carte active. */
  private readonly hordeChosen = linkedSignal<string, readonly string[]>({source: () => this.turn.turnKey(), computation: () => []});

  /** Les piétailles engagées avec la carte active — celles qui peuvent encore jouer. */
  readonly horde = computed(() => (this.defenseTotale() ? [] : this.turn.hordeMates().filter((card) => this.hordeChosen().includes(card.key))));

  /** Nombre de piétailles impliquées, la carte active comprise ; 0 sans horde. C'est aussi le bonus d'attaque. */
  readonly hordeDegats = HORDE_DEGATS;

  readonly hordeSize = computed(() => (this.horde().length > 0 ? this.horde().length + 1 : 0));

  /** Les piétailles à cocher, de leur seul numéro quand elles en ont un (« #2 ») : la ligne est étroite, et elles ont le même nom. */
  readonly hordeChips = computed(() => this.turn.hordeMates().map((card) => ({card, court: card.nom.match(/#\d+$/)?.[0] ?? card.nom})));

  /** Le modificateur libre, la carrière, la portée d'un tir et le bonus de horde, en termes d'addition : ils entrent dans les jets
   * comme les effets en cours. */
  readonly extraAttackTerms = computed<readonly ModifierTerm[]>(() => {
    const career = this.career();
    const range = this.range();
    return [
      ...(this.hordeSize() > 0 ? [extraTerm(this.hordeSize(), 'horde')] : []),
      ...(range && range.modifier !== 0 ? [extraTerm(range.modifier, `portée ${range.label.toLowerCase()}`)] : []),
      ...(this.freeModifier() !== 0 ? [extraTerm(this.freeModifier(), 'modificateur')] : []),
      ...(career && this.careerOn() === 'attaque' ? [extraTerm(career.value, career.label)] : []),
    ];
  });

  readonly extraDamageTerms = computed<readonly ModifierTerm[]>(() => {
    const career = this.career();
    return career && this.careerOn() === 'degats' ? [extraTerm(career.value, career.label)] : [];
  });

  /** L'arme secondaire d'un héros se prend parmi toutes ses armes légères ou moyennes, équipées ou non : « équipée » dit
   * seulement ce que le héros propose à l'attaque, pas ce qu'il a en main pour parer ou frapper à deux armes. */
  private readonly eligibleOffHandArmes = computed(() => {
    const mainId = this.effectiveArme()?.id;
    const candidates = this.turn.isHero() ? this.turn.ownedArmes() : this.displayArmes();
    return candidates.filter((a) => a.id !== mainId && isDualWieldWeapon(a));
  });

  private readonly visibleOptions = computed(() => {
    // Les options de combat sont facultatives (02-actions-combat.md) : créatures et démons, qui n'ont qu'une attaque, n'en ont pas.
    if (this.turn.card().kind === 'creature' || this.turn.card().kind === 'demon') {
      return [];
    }
    const options = filterAttackMenuCombatOptions(this.turn.combatOptions());
    if (!this.turn.isHero()) {
      return options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
    }
    // L'arme principale doit elle aussi être une vraie arme légère ou moyenne : si celle qu'il tient n'en est pas une, choisir le combat à
    // deux armes le fait passer sur la première qui convient (`setDual`).
    const main = this.dualMains()[0] ?? null;
    const otherDegats = this.dualArmes()
      .filter((a) => a.id !== main?.id)
      .map((a) => a.arme?.degats ?? null);
    return filterVisiblePostures(options, main?.arme?.degats ?? null, otherDegats);
  });

  /** Les armes qu'il peut tenir en combat à deux armes : parmi toutes celles d'un héros, équipées ou non. */
  private readonly dualArmes = computed(() => (this.turn.isHero() ? this.turn.ownedArmes() : this.displayArmes()).filter(isDualWieldWeapon));

  /** Celles qui peuvent être l'arme principale : parmi celles qu'il propose à l'attaque. */
  private readonly dualMains = computed(() => this.displayArmes().filter(isDualWieldWeapon));

  /** Il a de quoi combattre à deux armes : sinon, la ligne dit ce qu'il lui manque. */
  readonly dualPossible = computed(() => this.dualMains().length > 0 && this.dualArmes().length > 1);

  /** Les modes du combat à deux armes. L'attaque intrépide prive de la parade (livre p. 64), la défense totale de la double frappe. */
  readonly dualChoices = computed<readonly DualChoice[]>(() => {
    const options = this.visibleOptions().filter((o) => DUAL_WIELD_SLUGS.has(o.slug));
    return options.map((o) => {
      const parade = o.slug === 'dual-parry';
      const interdit = parade ? this.postureSlug() === 'intrepid' : this.defenseTotale();
      const hint = parade && interdit ? 'Pas d’arme de parade en attaque intrépide.' : !parade && interdit ? 'Pas d’attaque en défense totale.' : (o.note ?? '');
      return {slug: o.slug, name: parade ? 'Parade' : 'Double frappe', hint, interdit};
    });
  });

  /** Les armes à choisir : en combat à deux armes, s'y ajoutent celles qu'il n'a pas équipées mais peut prendre en secondaire. */
  readonly rackArmes = computed(() => {
    const list = this.displayArmes();
    if (!this.isDualWieldSelected()) {
      return list;
    }
    const proposees = new Set(list.map((a) => a.id));
    return [...list, ...this.dualArmes().filter((a) => !proposees.has(a.id))];
  });

  /** Ce qu'il a en main, en clair : son arme, ou ses deux armes. */
  readonly armeNom = computed(() => {
    const main = this.effectiveArme()?.arme?.arme ?? '';
    return this.isDualWieldSelected() ? `${main} + ${this.effectiveOffHand()?.arme?.arme ?? ''}` : main;
  });

  /** La posture retenue sur l'échelle (« Aucune » par défaut). */
  readonly effectiveOption = computed(() => {
    const list = this.scalePostures();
    return list.find((o) => o.slug === this.selectedOptionSlug()) ?? list.find((o) => o.slug === 'none') ?? list[0] ?? null;
  });

  /** Les trois postures simples plus « Aucune », dans l'ordre de l'échelle. */
  private readonly scalePostures = computed(() =>
    SCALE_SLUGS.map((slug) => this.visibleOptions().find((o) => o.slug === slug)).filter((o): o is BolCombatOptionModel => !!o),
  );

  /** Combat à deux armes, attaque au défaut de l'armure : des options qui se cochent, en plus de la posture. L'attaque intrépide prive
   * de l'arme secondaire de parade (livre p. 64) : la parade tombe tant qu'elle est choisie. */
  private readonly specialPostures = computed(() =>
    this.visibleOptions().filter((o) => !SCALE_SLUGS.includes(o.slug) && !(o.slug === 'dual-parry' && this.effectiveOption()?.slug === 'intrepid')),
  );

  /** Les manœuvres, sous la posture : les options spéciales autres que le combat à deux armes, réglé avec les armes. */
  readonly manoeuvres = computed(() => this.specialPostures().filter((o) => !DUAL_WIELD_SLUGS.has(o.slug)));

  /** L'option spéciale cochée, ou `null`. En défense totale, seule la parade à deux armes reste : elle s'y cumule. */
  readonly effectiveSpecial = computed(() => {
    const special = this.specialPostures().find((o) => o.slug === this.selectedSpecialSlug()) ?? null;
    return this.defenseTotale() && special?.slug !== 'dual-parry' ? null : special;
  });

  /** Il consacre ce round à parer : pas de cible ni de jet, « Fin du tour » applique le +2. */
  readonly defenseTotale = computed(() => this.selectedOptionSlug() === DEFENSE_TOTALE);

  /** L'échelle des postures, de la défense totale à l'attaque intrépide. Une créature ou un démon n'a pas de posture (`visibleOptions`) : il
   * attaque, ou se défend. */
  readonly postureChoices = computed<readonly PostureChoice[]>(() => {
    const totale: PostureChoice = {slug: DEFENSE_TOTALE, name: 'Déf. totale', effect: `— · ${signedTerm(2)}`, hint: 'Défense totale : le round entier à esquiver et parer, pas d’attaque. « Fin du tour » applique le +2.'};
    const echelle = this.scalePostures();
    if (echelle.length === 0) {
      return [{slug: 'none', name: 'Attaque', effect: 'une attaque', hint: ''}, totale];
    }
    return [
      totale,
      ...echelle.map((o) => ({slug: o.slug, name: this.scaleName(o), effect: `${signedOrZero(o.modificateur)} · ${signedOrZero(POSTURE_DEFENSE[o.slug] ?? 0)}`, hint: o.note ?? ''})),
    ];
  });

  /** Le segment allumé sur l'échelle. */
  readonly posturePressed = computed(() => (this.defenseTotale() ? DEFENSE_TOTALE : (this.postureSlug() ?? 'none')));

  /** Ce que dit le titre de l'échelle. */
  readonly postureNote = computed(() => {
    if (this.defenseTotale()) {
      return 'pas d’attaque ce round';
    }
    if (this.postureSlug() === 'intrepid') {
      return 'perd son bouclier ce round';
    }
    return this.scalePostures().length > 0 ? 'attaque · défense' : '';
  });

  /** La posture de l'échelle retenue. */
  private readonly postureSlug = computed(() => this.effectiveOption()?.slug ?? null);

  /** Les réglages du coup, en clair : ils restent écrits sur la ligne quand le coup est joué. */
  readonly activeOptions = computed<readonly string[]>(() => {
    const active: string[] = [];
    if (this.deuxMains()) {
      active.push(`À deux mains · ${this.degatsDeuxMains()}`);
    }
    const option = this.effectiveOption();
    if (option && option.slug !== 'none') {
      active.push(option.label);
    }
    const special = this.effectiveSpecial();
    if (special) {
      active.push(special.label);
    }
    if (this.brawl()) {
      active.push('Bagarre');
    }
    if (this.distanceModes().length > 1 && this.isTir()) {
      active.push('Tir');
    }
    if (this.hordeSize() > 0) {
      active.push(`Horde · ${this.hordeSize()} piétailles`);
    }
    const gm = this.gmDie();
    if (gm) {
      active.push(gm === 'bonus' ? 'Dé bonus MJ' : 'Dé malus MJ');
    }
    if (this.freeModifier() !== 0) {
      active.push(`Modificateur MJ ${this.turn.signed(this.freeModifier())}`);
    }
    const career = this.career();
    if (career) {
      active.push(`${career.label} +${career.value} aux ${this.careerOn() === 'attaque' ? 'attaques' : 'dégâts'}`);
    }
    return active;
  });

  readonly isDualWieldSelected = computed(() => DUAL_WIELD_SLUGS.has(this.effectiveSpecial()?.slug ?? ''));

  private readonly effectiveOffHand = computed(() => {
    const list = this.eligibleOffHandArmes();
    return list.find((a) => a.id === this.selectedOffHandId()) ?? list[0] ?? null;
  });

  /** Ce avec quoi la carte attaque — `null` si une posture à deux armes est choisie sans arme secondaire jouable. */
  readonly choice = computed<AttackChoice | null>(() => {
    if (this.isDualWieldSelected() && !this.effectiveOffHand()) {
      return null;
    }

    const option = this.effectiveOption();
    const special = this.effectiveSpecial();
    const mainDegats = degatsEnMain(this.effectiveArme()?.arme?.degats ?? null, this.deuxMains());
    const offHand = this.effectiveOffHand();
    const degats =
      this.hordeSize() > 0 ? HORDE_DEGATS : special?.slug === 'dual-strike' && offHand ? dualStrikeDegats(mainDegats, offHand.arme?.degats) : mainDegats;

    return {degats, posture: option && option.slug !== 'none' ? option : null, special};
  });

  readonly choiceKey = computed(() => {
    const choice = this.choice();
    return choice ? `${this.effectiveArme()?.id ?? ''}|${this.effectiveOffHand()?.id ?? ''}|${choice.degats}|${choice.posture?.slug ?? ''}|${choice.special?.slug ?? ''}` : '';
  });

  /** Un combattant meilleur au tir qu'en mêlée part à distance. */
  private readonly prefersTir = computed(() => {
    const a = this.turn.attacker();
    // Les attaques naturelles d'un démon (griffes, crocs) sont de la mêlée : le tir reste au choix.
    return !!a && a.attaque === null && a.tir > a.melee && this.turn.card().kind !== 'demon';
  });

  /** Mêlée ou tir, quand l'arme permet les deux : repart de la préférence du combattant à chaque nouvelle carte active, pas à chaque
   * relecture de ses statistiques. */
  readonly useTir = linkedSignal<{readonly key: string; readonly tir: boolean}, boolean>({
    source: () => ({key: this.turn.turnKey(), tir: this.prefersTir()}),
    computation: (source) => source.tir,
  });

  /** Façons d'utiliser l'arme choisie : mêlée seulement (épée, mains nues), tir seulement (arc, javelot) ou les deux (arme qui se lance :
   * dague, hache, lance, arme improvisée) — la distance ne se choisit que dans ce dernier cas. */
  readonly distanceModes = computed<readonly ('melee' | 'tir')[]>(() => {
    const arme = this.effectiveArme();
    if (!arme) {
      return ['melee', 'tir'];
    }
    if (arme.id === MAINS_NUES.id) {
      return ['melee'];
    }
    if (arme.id === ARME_IMPROVISEE.id) {
      return ['melee', 'tir'];
    }
    if (arme.arme?.type === 'T') {
      return ['tir'];
    }
    const portee = arme.arme?.portee?.trim();
    return portee && portee !== '-' ? ['melee', 'tir'] : ['melee'];
  });

  /** Facteur de portée d'un tir (livre p. 62) : courte d'office, et il repart de là à chaque nouvelle carte active. */
  readonly rangeIndex = linkedSignal<string, number>({source: () => this.turn.turnKey(), computation: () => DEFAULT_RANGE_INDEX});

  readonly rangeFactors = RANGE_FACTORS;

  /** Le facteur de portée retenu, `null` pour une attaque en mêlée ou celle d'une créature. */
  readonly range = computed(() => {
    if (!this.isTir() || this.turn.attacker()?.attaque !== null) {
      return null;
    }
    const factor = RANGE_FACTORS[this.rangeIndex()];
    const base = baseRangeMeters(this.effectiveArme()?.arme?.portee);
    // Jusqu'où va ce facteur avec cette arme : « jusqu'à 12 m » ; rien pour une arme sans portée connue.
    return {
      ...factor,
      text: factor.modifier === 0 ? '0' : signedTerm(factor.modifier),
      reach: base === null ? null : formatMeters(rangeReach(base, this.rangeIndex())),
    };
  });

  /** L'attaque se fait à distance : imposée par l'arme quand elle n'a qu'un mode, sinon choisie dans l'assistant. */
  readonly isTir = computed(() => {
    const modes = this.distanceModes();
    return modes.length === 1 ? modes[0] === 'tir' : this.useTir();
  });

  /** L'attaquant porte l'effet « dé de malus à sa prochaine action » (posé à la main après un renversement, un coup précis…). */
  private readonly malusDieOwed = computed(() => doitUnDeDeMalus(this.turn.effets(), this.turn.card().key));

  /** Dé de bonus ou de malus accordé par le MJ pour cette attaque, selon les circonstances (attaquant ivre, adversaire à terre, arme
   * favorite…) : le jet se fait à 3d6, dont on garde les deux meilleurs ou les deux moins bons (02-actions-combat.md). L'un exclut
   * l'autre. À chaque nouvelle carte active il repart de zéro — ou du dé de malus, si la carte en doit un à sa prochaine action ; il
   * suit aussi cet effet quand on le pose ou qu'on le retire en cours de tour. */
  readonly gmDie = linkedSignal<{readonly key: string; readonly malus: boolean}, 'bonus' | 'malus' | null>({
    source: () => ({key: this.turn.turnKey(), malus: this.malusDieOwed()}),
    computation: (source) => (source.malus ? 'malus' : null),
  });

  /** Il attaque avec son arme favorite (avantage « Arme favorite », livre p. 40) : un dé de bonus, sans que le MJ ait à y penser. */
  private readonly avecArmeFavorite = computed(() => estArmeFavorite(this.turn.attacker()?.armeFavorite ?? null, this.effectiveArme()?.arme?.arme ?? null));

  /** Ce que dit l'assistant du dé de l'arme favorite, sous le dé du MJ ; `null` avec une autre arme. */
  readonly armeFavoriteNote = computed(() =>
    this.avecArmeFavorite() ? `Arme favorite (${this.turn.attacker()?.armeFavorite}) : dé de bonus avec cette arme.` : null,
  );

  /** Les capacités de l'attaquant qui lui donnent un dé à toutes ses attaques (« Attaque féroce », « Armes améliorées », « Attaque
   * timide »), en clair sous le dé du MJ ; vide sinon. */
  readonly abilityDice = computed(() => {
    const a = this.turn.attacker();
    const bonus = a?.attaqueAvantages ?? [];
    const malus = a?.attaqueDesavantages ?? [];
    return [...bonus.map((nom) => `${nom} : dé de bonus`), ...malus.map((nom) => `${nom} : dé de malus`)].join(' · ');
  });

  /** Les dés de foi que la carte active doit à sa prochaine action (livre p. 146) : ils entrent dans son jet, d'attaque ou de sort, et
   * se cumulent avec le dé du MJ. */
  readonly faithDice = computed(() => desDeFoi(this.turn.effets(), this.turn.card().key));

  /** Ce que dit l'assistant des dés de foi qu'elle doit, sous ses chiffres ; `null` sans dé de foi. */
  readonly faithNote = computed(() => {
    const {bonus, malus} = this.faithDice();
    const parts = [...(bonus > 0 ? [`${bonus} dé${bonus > 1 ? 's' : ''} de bonus`] : []), ...(malus > 0 ? [`${malus} dé${malus > 1 ? 's' : ''} de malus`] : [])];
    return parts.length > 0 ? `Foi : ${parts.join(' et ')} à cette action.` : null;
  });

  /** Dés de bonus moins dés de malus (dé du MJ, capacités de l'attaquant, dés de foi) : ils s'annulent un pour un
   * (02-actions-combat.md). Un sort ne prend que le dé du MJ, la foi et la « Magie des Rois-Sorciers » (livre p. 42). */
  readonly netDice = computed(() => {
    const a = this.turn.attacker();
    const foi = this.faithDice();
    if (this.sortMode()) {
      return netDiceModifier((this.gmDie() === 'bonus' ? 1 : 0) + foi.bonus + (a?.magie?.magieRoisSorciers ? 1 : 0), (this.gmDie() === 'malus' ? 1 : 0) + foi.malus);
    }
    const avantages = (this.gmDie() === 'bonus' ? 1 : 0) + (a?.attaqueAvantages?.length ?? 0) + (this.avecArmeFavorite() ? 1 : 0) + foi.bonus;
    const desavantages = (this.gmDie() === 'malus' ? 1 : 0) + (a?.attaqueDesavantages?.length ?? 0) + foi.malus;
    return netDiceModifier(avantages, desavantages);
  });

  // ── La sorcellerie (livre p. 148-157) : au lieu d'attaquer, un sorcier lance un sort. Pas de catalogue : le joueur décrit l'effet, le MJ
  // en fixe la puissance et la difficulté ; l'assistant calcule le coût et le jet.

  /** La carte a des points de pouvoir à dépenser : un sorcier (même à 0 point, pour qu'on le voie). */
  readonly canCast = computed(() => (this.turn.attacker()?.magie?.pouvoir ?? null) !== null);

  /** Ce qu'il fait de son action : attaquer, ou lancer un sort. Il repart sur l'attaque à chaque nouvelle carte active. */
  readonly mode = linkedSignal<string, 'attaque' | 'sort'>({source: () => this.turn.turnKey(), computation: () => 'attaque'});

  /** Il lance un sort ce tour-ci. */
  readonly sortMode = computed(() => this.canCast() && this.mode() === 'sort');

  /** Le sort, tel que le MJ le règle : 1er cercle, Moyenne, la seule condition obligatoire, sans dégâts — à chaque nouvelle carte. */
  readonly sortModel = linkedSignal<string, SortSaisie>({source: () => this.turn.turnKey(), computation: () => saisieSortParDefaut()});

  readonly sortForm = form(this.sortModel, (path) => {
    min(path.conditions, 1);
    max(path.conditions, 12);
  });

  readonly cercles = CERCLES_SORT;

  readonly sortCercle = computed(() => cercleSort(this.sortModel().cercle));

  readonly sortDifficulte = computed(() => difficulteSort(this.sortModel().difficulte));

  /** Les crans de difficulté qu'il peut prendre : « automatique » n'est que pour un charme. */
  private readonly difficultesPossibles = computed(() => DIFFICULTES_SORT.filter((d) => d.valeur !== null || this.sortModel().cercle === 0));

  readonly sortDifficultePremiere = computed(() => this.difficultesPossibles()[0]?.slug === this.sortModel().difficulte);

  readonly sortDifficulteDerniere = computed(() => this.difficultesPossibles().at(-1)?.slug === this.sortModel().difficulte);

  /** La difficulté est l'une de celles que le livre donne à cette puissance. */
  readonly sortDifficulteHabituelle = computed(() => this.sortCercle().difficultes.includes(this.sortModel().difficulte));

  /** Le coût du sort, surcoût de l'armure compris (livre p. 148-153). */
  readonly sortCout = computed(() => coutSort(this.sortModel(), this.turn.attacker()?.magie?.surcoutArmure ?? 0));

  /** Il a de quoi le payer. */
  readonly sortPayable = computed(() => pouvoirSuffisant(this.turn.attacker()?.magie?.pouvoir ?? null, this.sortCout().total));

  /** Les dégâts d'un sort qui blesse, selon sa puissance. */
  readonly sortDegats = computed(() => degatsSort(this.sortModel().cercle));

  /** Un charme automatique : pas de jet. */
  readonly sortSansJet = computed(() => sortSansJet(this.sortModel()));

  /** Le sort a besoin d'une cible : il blesse, ou agit sur un esprit. */
  readonly sortVise = computed(() => this.sortModel().blessant || this.sortModel().espritCible);

  /** Le coût en clair, pour la ligne du sort : « 5 − 1 (conditions) + 2 (armure) = 6 ». */
  readonly sortCoutDetail = computed(() => {
    const cout = this.sortCout();
    const parts = [`${cout.base}`, ...(cout.reduction > 0 ? [`− ${cout.reduction} (conditions)`] : []), ...(cout.armure > 0 ? [`+ ${cout.armure} (armure)`] : [])];
    return parts.length > 1 ? `${parts.join(' ')} = ${cout.total}` : `${cout.total}`;
  });

  setMode(mode: 'attaque' | 'sort'): void {
    this.mode.set(mode);
  }

  setCercle(cercle: CercleSort): void {
    this.sortModel.update((saisie) => changerCercle(saisie, cercle));
  }

  /** Un cran plus facile (−1) ou plus difficile (+1) sur l'échelle. */
  stepDifficulte(delta: number): void {
    const crans = this.difficultesPossibles();
    const index = crans.findIndex((d) => d.slug === this.sortModel().difficulte);
    const next = crans[Math.max(0, Math.min(crans.length - 1, index + delta))];
    if (next) {
      this.sortForm.difficulte().value.set(next.slug);
    }
  }

  setCoutCharme(cout: number): void {
    this.sortForm.coutCharme().value.set(cout);
  }

  toggleSortBlessant(): void {
    this.sortForm.blessant().value.update((v) => !v);
  }

  toggleSortEsprit(): void {
    this.sortForm.espritCible().value.update((v) => !v);
  }

  /** Nombre de dés du jet d'attaque : deux, plus un par dé de bonus ou de malus qui reste. */
  readonly diceCount = computed(() => 2 + Math.abs(this.netDice()));

  readonly degats = computed(() => this.choice()?.degats ?? this.turn.attacker()?.degats ?? this.turn.card().degats);

  /** Ce que la posture, puis l'option spéciale, ajoutent au jet d'attaque contre la cible choisie ; et les deux ensemble. */
  readonly stanceModifier = computed(() => resolvePostureAttackModifier(this.choice()?.posture ?? null, this.turn.targetStats()?.protection ?? 0));

  readonly specialModifier = computed(() => resolvePostureAttackModifier(this.choice()?.special ?? null, this.turn.targetStats()?.protection ?? 0));

  readonly postureModifier = computed(() => this.stanceModifier() + this.specialModifier());

  constructor() {
    effect(() => this.turn.choiceChanged.emit(this.choice()));

    effect(() => this.turn.hordeChanged.emit(this.horde().map((card) => card.key)));
  }

  toggleHordeMate(key: string): void {
    this.hordeChosen.update((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));
  }

  /** L'arme est-elle en main : 1 l'arme choisie, 2 la secondaire du combat à deux armes ; `null` sinon. */
  armeRang(arme: BolHerosArmeModel): 1 | 2 | null {
    if (arme.id === this.effectiveArme()?.id) {
      return 1;
    }
    return this.isDualWieldSelected() && arme.id === this.effectiveOffHand()?.id ? 2 : null;
  }

  /** Une arme qu'il ne peut pas prendre : trop lourde pour lui, ou impossible à deux armes. */
  armeInterdite(arme: BolHerosArmeModel): boolean {
    return this.heavyForbidden().has(arme.id) || (this.isDualWieldSelected() && !isDualWieldWeapon(arme));
  }

  /** Son nom, et pourquoi il ne peut pas la prendre. */
  armeHint(arme: BolHerosArmeModel): string {
    const nom = arme.arme?.arme ?? '';
    if (this.heavyForbidden().has(arme.id)) {
      return `${nom} · arme lourde : impossible à manier avec moins de 0 en vigueur`;
    }
    return this.isDualWieldSelected() && !isDualWieldWeapon(arme) ? `${nom} · pas à deux armes : il faut une vraie arme légère ou moyenne, tenue d’une main` : nom;
  }

  /** Les dégâts sur la case d'une arme : une arme polyvalente donne les deux, sauf en main, où on sait comment elle est tenue. */
  armeDegats(arme: BolHerosArmeModel): string {
    const degats = arme.arme?.degats ?? '';
    if (!estPolyvalente(degats)) {
      return degats;
    }
    const une = degatsEnMain(degats, false) ?? degats;
    const deux = degatsEnMain(degats, true) ?? degats;
    return this.armeRang(arme) === null ? `${une} / ${deux}` : this.armeRang(arme) === 1 && this.deuxMains() ? deux : une;
  }

  /** Un clic sur une arme. À deux armes, elle devient la secondaire ; cliquer la secondaire inverse les deux, si elle peut être l'arme principale. */
  pickArme(arme: BolHerosArmeModel): void {
    if (this.armeInterdite(arme)) {
      return;
    }
    if (!this.isDualWieldSelected()) {
      this.selectArme(arme.id);
      return;
    }
    const main = this.effectiveArme();
    if (arme.id === main?.id) {
      return;
    }
    if (arme.id === this.effectiveOffHand()?.id) {
      if (this.displayArmes().some((a) => a.id === arme.id)) {
        this.selectedOffHandId.set(main?.id ?? null);
        this.selectArme(arme.id);
      }
      return;
    }
    this.selectOffHand(arme.id);
  }

  /** Choisit un mode du combat à deux armes, ou y renonce (`null`) ; s'il tient une arme qui ne s'y prête pas, il passe sur la première qui convient. */
  setDual(slug: string | null): void {
    if (slug === null) {
      if (this.isDualWieldSelected()) {
        this.selectedSpecialSlug.set(null);
        this.selectedOffHandId.set(null);
      }
      return;
    }
    const main = this.effectiveArme();
    if (!main || !isDualWieldWeapon(main)) {
      this.selectArme(this.dualMains()[0]?.id);
    }
    this.selectedSpecialSlug.set(slug);
  }

  /** « Posture offensive » → « Offensive », « Attaque intrépide » → « Intrépide ». */
  private scaleName(option: BolCombatOptionModel): string {
    const short = option.label.replace(/^(Posture|Attaque) /, '');
    return short.charAt(0).toUpperCase() + short.slice(1);
  }

  /** « Attaque au défaut de l'armure » → « Défaut de l'armure ». */
  specialName(option: BolCombatOptionModel): string {
    const short = option.label.replace(/^Attaque au /, '');
    return short.charAt(0).toUpperCase() + short.slice(1);
  }

  /** Une option spéciale se coche et se décoche, sans toucher à la posture ; cocher l'une décoche l'autre. */
  toggleSpecial(slug: string): void {
    const next = this.effectiveSpecial()?.slug === slug ? null : slug;
    this.selectedSpecialSlug.set(next);
    if (!DUAL_WIELD_SLUGS.has(next ?? '')) {
      this.selectedOffHandId.set(null);
    }
  }

  stepRange(delta: number): void {
    this.rangeIndex.update((index) => Math.max(0, Math.min(RANGE_FACTORS.length - 1, index + delta)));
  }

  /** Accorde le dé de bonus ou de malus du MJ pour cette attaque ; un second clic sur le même le retire. */
  toggleGmDie(kind: 'bonus' | 'malus'): void {
    this.gmDie.update((current) => (current === kind ? null : kind));
  }

  private selectArme(id: number | undefined): void {
    if (id !== undefined && this.heavyForbidden().has(id)) {
      return;
    }
    this.selectedArmeId.set(id ?? null);
  }

  toggleCareer(label: string): void {
    this.careerLabel.update((current) => (current === label ? null : label));
  }

  toggleBrawl(): void {
    this.brawlChosen.update((on) => !on);
  }

  toggleDeuxMains(): void {
    if (this.deuxMainsInterdit() !== null) {
      return;
    }
    this.deuxMainsChoisi.update((on) => !on);
  }

  /** Choisit un segment de l'échelle. La défense totale renonce à la cible visée : il n'y a plus de jet. */
  selectOption(slug: string): void {
    this.selectedOptionSlug.set(slug);
    if (slug === DEFENSE_TOTALE && this.turn.target()) {
      this.turn.targetSelected.emit(null);
    }
  }

  private selectOffHand(id: number | undefined): void {
    this.selectedOffHandId.set(id ?? null);
  }
}
