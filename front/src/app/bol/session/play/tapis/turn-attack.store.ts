import {computed, inject, Injectable, linkedSignal, signal} from '@angular/core';
import {ModifierTerm} from '../../models/combat-effect.model';
import {actionDiceTarget, actionDiceTargetLabel, actionSuccessChance, keptDiceIndexes} from '../../action-roll.util';
import {aDejaFeinte, modificateursPour, POSTURE_DEFENSE, sommeModificateurs} from './combat-effects.util';
import {DiceRowDie} from '../../../../shared/models/dice-row.model';
import {ATTACK_THRESHOLD, attackBonus, computeAttackTotal, HEROIC_OPTIONS, heroicPicksAllowed, suggestedAttackResult, toggleHeroicPick, vigueurBonus} from '../../combat-resolution.util';
import {HeroicSlug} from '../../models/combat-resolution.model';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {ResolvedCombatStats} from '../../models/combat-attack.model';
import {DwRollSumTerm} from '../../../../shared/models/roll-sum.model';
import {StatTile, AttackGoal, AttackVerdict} from '../../models/turn-assistant.model';
import {signedTerm, pointsAffiches, sumTermOf} from './turn-assistant.util';
import {optionHeroiqueBloquee} from './options-heroiques.util';
import {issueSort, modificateurSort, pouvoirSuffisant, sortPayeCeRound} from '../../magie-combat.util';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';

/** Le jet d'attaque : ce qu'il faut pour toucher, les dés lancés ou tapés, l'addition, le verdict, et l'héroïsme qu'on y dépense. */
@Injectable()
export class TurnAttackStore {
  private readonly turn = inject(TurnContextStore);
  private readonly loadout = inject(TurnLoadoutStore);

  /** Les options de succès héroïque, chacune avec la raison qui l'interdit contre cette cible (taille pour le renversement, arme en main
   * pour le désarmement, piétaille pour le massacre) ; `blocked` est `null` pour une option possible. */
  readonly heroicOptions = computed(() => {
    const contexte = {attaquant: this.turn.card(), cible: this.turn.target(), cibleArme: this.turn.targetStats()?.arme};
    return HEROIC_OPTIONS.map((option) => ({...option, blocked: optionHeroiqueBloquee(option.slug, contexte)}));
  });

  /** La feinte de ce jet a été notée sur la cible : l'avertissement ne vaut que pour une nouvelle tentative. */
  readonly feintNoted = signal(false);

  /** Cette feinte a déjà été tentée contre la cible par cet attaquant : elle ne marche pas deux fois. */
  readonly feintRetry = computed(() => {
    const target = this.turn.target();
    return this.loadout.career() !== null && target !== null && !this.feintNoted() && aDejaFeinte(this.turn.effets(), target.key, this.turn.card().key);
  });

  /** Les deux dés qui comptent : ceux du lancer, ou les deux gardés quand le MJ a accordé un dé. */
  readonly dice = signal<readonly [number, number] | null>(null);

  /** Tous les dés d'un lancer à l'écran à trois dés, pour dire lesquels sont gardés ; `null` sinon. */
  readonly rolledDice = signal<readonly number[] | null>(null);

  readonly manualTotal = signal<number | null>(null);

  /** Les chiffres de l'attaquant, en tuiles : attaque, défense, vigueur et dégâts (sa vitalité est sur son cœur, à côté). Ils suivent les
   * réglages du coup : l'attaque compte tout ce qui s'ajoute aux dés avant la défense de la cible, la défense ce que la posture lui fera
   * jusqu'à son prochain tour, les dégâts ce que le coup fera. En défense totale, ni attaque ni dégâts. */
  readonly attackerTiles = computed<readonly StatTile[]>(() => {
    const stats = this.turn.attacker();
    if (!stats) {
      return [];
    }
    const totale = this.loadout.defenseTotale();
    const posture = (totale ? 2 : (POSTURE_DEFENSE[this.loadout.effectiveOption()?.slug ?? ''] ?? 0)) + (POSTURE_DEFENSE[this.loadout.effectiveSpecial()?.slug ?? ''] ?? 0);
    const magie = stats.magie;
    if (this.loadout.sortMode() && magie && !totale) {
      // Un sort : ce qui compte, c'est son esprit et son rang de sorcier ; ses dégâts sont ceux du sort.
      return [
        {label: 'Esprit', value: this.turn.signed(magie.esprit)},
        {label: 'Sorcier', value: this.turn.signed(magie.sorcier ?? 0)},
        {label: 'Défense', value: String(stats.defense + posture), ...(posture === 0 ? {} : {tone: posture > 0 ? ('up' as const) : ('down' as const)})},
        {label: 'Dégâts', value: this.loadout.sortModel().blessant ? this.loadout.sortDegats() : '—', tone: 'hot'},
      ];
    }
    const reglages = this.loadout.postureModifier() + sommeModificateurs(this.loadout.extraAttackTerms());
    const attaque = attackBonus(stats, this.loadout.isTir(), this.loadout.brawl()) + (this.turn.legendaryBonus() ? 1 : 0) + reglages;
    const enPlus = sommeModificateurs(this.loadout.extraDamageTerms());
    const toneOf = (delta: number) => (delta === 0 ? {} : {tone: delta > 0 ? ('up' as const) : ('down' as const)});
    return [
      {label: 'Attaque', value: totale ? '—' : this.turn.signed(attaque), hint: this.attackHint(stats), ...(totale ? {} : toneOf(reglages))},
      {label: 'Défense', value: String(stats.defense + posture), ...toneOf(posture)},
      // Une créature n'ajoute pas sa vigueur aux dégâts : pas de tuile, pour ne pas laisser croire le contraire.
      ...(stats.attaque === null ? [{label: 'Vigueur', value: this.turn.signed(vigueurBonus(stats, this.loadout.isTir(), this.loadout.unarmed()))}] : []),
      totale ? {label: 'Dégâts', value: '—'} : {label: 'Dégâts', value: `${this.loadout.degats() ?? '—'}${enPlus === 0 ? '' : ` ${signedTerm(enPlus)}`}`, tone: 'hot'},
    ];
  });

  /** Points d'héroïsme de l'attaquant ; `null` s'il n'en a pas (PNJ, créature, démon). */
  private readonly heroisme = computed(() => this.turn.attacker()?.heroisme ?? null);

  /** Les points d'héroïsme (héros) ou de vilénie (rival) de l'attaquant, avec leur titre ; `null` s'il n'en a pas. */
  readonly pointsAttaquant = computed(() => pointsAffiches(this.turn.card().kind, this.heroisme()));

  /** Échec critique accepté sur un double 1 : rapporte 1 point d'héroïsme. */
  readonly critique = signal(false);

  /** Succès légendaire acheté sur un double 6 : deux options au lieu d'une. */
  readonly legendary = signal(false);

  /** Coup qui touche transformé en succès héroïque pour 1 point d'héroïsme. */
  readonly heroicUpgrade = signal(false);

  /** Les options de succès héroïque choisies pour ce coup : une, ou deux pour un succès légendaire (la même deux fois si on veut). */
  readonly picks = signal<readonly HeroicSlug[]>([]);

  /** Attaques immédiates que la carte doit encore à un Carnage, ce tour-ci. */
  readonly carnageOwed = linkedSignal<string, number>({source: () => this.turn.turnKey(), computation: () => 0});

  /** Un Carnage a été pris ce tour : les attaques qu'il donne se font sans dépenser d'héroïsme. */
  readonly carnageUsed = linkedSignal<string, boolean>({source: () => this.turn.turnKey(), computation: () => false});

  /** Il reste un point d'héroïsme à dépenser sur cette attaque. */
  private readonly canSpend = computed(() => (this.heroisme() ?? 0) > 0 && !this.carnageUsed());

  /** Ce qui s'ajoute aux deux dés contre la cible choisie : bonus d'attaque − défense + posture + effets en cours. `null` sans cible. */
  readonly attackModifier = computed(() => {
    const a = this.turn.attacker();
    const t = this.turn.targetStats();
    if (!a || !t || !this.turn.target()) {
      return null;
    }
    return computeAttackTotal(0, attackBonus(a, this.loadout.isTir(), this.loadout.brawl()), t.defense, sommeModificateurs(this.effectTerms()), this.turn.legendaryBonus() ? 1 : 0, this.loadout.postureModifier());
  });

  /** Ce qu'il faut aux dés pour toucher la cible choisie, et les chances. */
  readonly attackGoal = computed<AttackGoal | null>(() => {
    const modifier = this.attackModifier();
    return modifier === null ? null : this.goalFor(modifier);
  });

  /** Les dés au-dessus de la case du jet d'attaque : ceux lancés à l'écran (les dés écartés par un dé de bonus ou de malus estompés), ou
   * un double 1 ou double 6 tapé ; `null` sinon (la ligne montre alors le total tapé, ou des places vides). */
  readonly attackRowDice = computed<readonly DiceRowDie[] | null>(() => {
    const all = this.rolledDice();
    if (all) {
      const kept = keptDiceIndexes(all, this.loadout.netDice());
      return all.map((value, index) => ({value, dropped: !kept.includes(index)}));
    }
    const pair = this.naturalDice();
    return pair ? [{value: pair[0]}, {value: pair[1]}] : null;
  });

  /** L'addition du jet d'attaque, sur une ligne : un nombre par terme, son nom dessous. Les termes nuls sont omis. Avant le jet elle
   * s'ouvre sur « 2d6 » et se ferme sur le seuil ; après, sur le total des dés et le total du jet. */
  readonly attackSum = computed<readonly DwRollSumTerm[]>(() => {
    const a = this.turn.attacker();
    const t = this.turn.targetStats();
    if (!a || !t) {
      return [];
    }
    const dice = this.diceSum();
    // Avec un dé de bonus ou de malus, « 2d6B » ou « 2d6M » (les deux meilleurs ou les deux moins bons gardés), comme au jet de réaction :
    // avant le jet en valeur, après le jet sous le total des dés.
    const kept = this.keptDice();
    const terms: DwRollSumTerm[] = [
      {value: dice === null ? (kept ?? '2d6') : `${dice}`, caption: dice === null ? 'dés' : (kept ?? 'dés'), tone: 'dice'},
    ];
    const add = (value: number, caption: string): void => {
      if (value !== 0) {
        terms.push({value: signedTerm(value), caption, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    if (a.attaque !== null) {
      add(a.attaque, 'attaque');
    } else {
      if (this.loadout.brawl()) {
        add(a.vigueur, 'vig');
      } else {
        // L'agilité de la fiche, puis le malus de l'équipement, comme sur le jet d'action.
        const equipement = a.equipementAgilite ?? 0;
        add(a.agilite - equipement, 'agi');
        add(equipement, 'équipement');
      }
      add(this.loadout.isTir() ? a.tir : a.melee, this.loadout.isTir() ? 'tir' : 'mêlée');
    }
    add(-t.defense, 'défense');
    add(this.loadout.stanceModifier(), 'posture');
    add(this.loadout.specialModifier(), this.loadout.choice()?.special?.slug === 'armor-chink' ? 'défaut de l’armure' : 'deux armes');
    add(this.turn.legendaryBonus() ? 1 : 0, 'légendaire');
    terms.push(...this.effectTerms().map((term) => sumTermOf(term)));
    const total = this.total();
    terms.push(total === null ? {value: `≥ ${ATTACK_THRESHOLD}`, caption: 'seuil', tone: 'total'} : {value: `= ${total}`, caption: `pour ${ATTACK_THRESHOLD}`, tone: 'total'});
    return terms;
  });

  /** Clé → nom des deux duellistes : une puce dit à qui est l'effet. */
  readonly noms = computed<Readonly<Record<string, string>>>(() => {
    const target = this.turn.target();
    return {[this.turn.card().key]: this.turn.card().nom, ...(target ? {[target.key]: target.nom} : {})};
  });

  /** Total des dés : lancés ici, ou saisis à la main (total à table, de 2 à 12). */
  readonly diceSum = computed(() => {
    const d = this.dice();
    if (d) {
      return d[0] + d[1];
    }
    return this.manualTotal();
  });

  /** Les modificateurs du registre pour ce jet, tels qu'ils sont au moment où on les lit. */
  readonly liveTerms = computed<readonly ModifierTerm[]>(() => {
    const t = this.turn.targetStats();
    const target = this.turn.target();
    return target
      ? modificateursPour(this.turn.effets(), {jet: 'attaque', attaquant: this.turn.card().key, cible: target.key, bouclier: t?.bouclierMalusUneAttaque ?? 0, bouclierToutes: t?.bouclierDefenseToutes ?? 0, noms: this.noms()})
      : [];
  });

  /** Modificateurs figés au premier jet de cette attaque : la cible est ensuite marquée « attaquée » (son bouclier tombe du registre), mais un
   * jet relancé garde les siens. */
  readonly frozenTerms = signal<readonly ModifierTerm[] | null>(null);

  private readonly effectTerms = computed(() => [...(this.frozenTerms() ?? this.liveTerms()), ...this.loadout.extraAttackTerms()]);

  readonly total = computed(() => {
    const sum = this.diceSum();
    const a = this.turn.attacker();
    const t = this.turn.targetStats();
    if (sum === null || !a || !t) {
      return null;
    }
    return computeAttackTotal(
      sum,
      attackBonus(a, this.loadout.isTir(), this.loadout.brawl()),
      t.defense,
      sommeModificateurs(this.effectTerms()),
      this.turn.legendaryBonus() ? 1 : 0,
      this.loadout.postureModifier(),
    );
  });

  private readonly naturalDice = computed<readonly [number, number] | null>(() => {
    const d = this.dice();
    if (d) {
      return d;
    }
    const manual = this.manualTotal();
    // Un total saisi de 2 ou 12 est un double naturel : les règles absolues s'appliquent.
    return manual === 2 ? [1, 1] : manual === 12 ? [6, 6] : null;
  });

  private readonly isNatural2 = computed(() => {
    const d = this.naturalDice();
    return !!d && d[0] === 1 && d[1] === 1;
  });

  private readonly isNatural12 = computed(() => {
    const d = this.naturalDice();
    return !!d && d[0] === 6 && d[1] === 6;
  });

  /** Ce que disent les dés, avant tout choix d'héroïsme. Le succès héroïque du double 6 est celui des héros et de leurs alliés : pour
   * leurs adversaires, le coup touche, sans plus. */
  private readonly baseResult = computed<InitiativeResultat | null>(() => {
    const d = this.naturalDice() ?? (this.diceSum() === null ? null : ([0, this.diceSum() as number] as const));
    const t = this.total();
    if (t === null || d === null) {
      return null;
    }
    const result = suggestedAttackResult([d[0], d[1]], t, ATTACK_THRESHOLD);
    return result === 'heroique' && !this.turn.heroicAllowed() ? 'reussite' : result;
  });

  /** Le résultat retenu, une fois les choix d'héroïsme faits. */
  readonly verdict = computed(() => {
    const base = this.baseResult();
    if (base === null) {
      return null;
    }
    const result: InitiativeResultat =
      base === 'echec' && this.critique() ? 'echec_critique' : base === 'heroique' && this.legendary() ? 'legendaire' : base === 'reussite' && this.heroicUpgrade() ? 'heroique' : base;
    return {result, hit: result === 'reussite' || result === 'heroique' || result === 'legendaire'};
  });

  /** Faveur divine : 1 point d'héroïsme pour relancer un coup raté — plus une fois l'échec critique accepté. */
  readonly canFavor = computed(() => this.verdict()?.result === 'echec' && this.canSpend());

  /** Un héros qui sort un double 1 peut en faire un échec critique, qui lui rapporte 1 point d'héroïsme. */
  // Accepter un échec critique rapporte un point au joueur : un rival n'en gagne pas de vilénie.
  readonly canCritique = computed(() => this.turn.card().kind === 'hero' && this.heroisme() !== null && this.isNatural2() && this.baseResult() === 'echec');

  /** Seul le double 6 qui vaut succès héroïque se transforme en succès légendaire. */
  readonly canLegendary = computed(() => this.heroisme() !== null && this.baseResult() === 'heroique' && (this.legendary() || this.canSpend()));

  /** Un coup qui touche, sans plus, se transforme en succès héroïque. */
  readonly canUpgrade = computed(() => this.heroisme() !== null && this.baseResult() === 'reussite' && (this.heroicUpgrade() || this.canSpend()));

  /** Nombre d'options de succès héroïque à choisir pour ce coup. */
  readonly picksMax = computed(() => heroicPicksAllowed(this.verdict()?.result ?? 'echec'));

  /** Combien de fois chaque option est prise. */
  readonly pickCounts = computed(() => {
    const counts: Partial<Record<HeroicSlug, number>> = {};
    for (const pick of this.picks()) {
      counts[pick] = (counts[pick] ?? 0) + 1;
    }
    return counts;
  });

  /** Les attaques que le Carnage doit encore après celle-ci, quand elle a raté : un Carnage pris deux fois garde sa seconde attaque. */
  readonly carnageRemaining = computed(() => (this.attackVerdict()?.tone === 'echec' ? Math.max(0, this.carnageOwed() - 1) : 0));

  /** Le coup se conclut sur un Carnage : une nouvelle attaque suit, le tour ne finit pas. */
  readonly carnagePicked = computed(() => this.picks().includes('carnage'));

  /** Le verdict en clair : touché ou raté, et de combien. Un double 1 rate et un double 6 touche quel que soit le total. */
  readonly attackVerdict = computed<AttackVerdict | null>(() => {
    const result = this.verdict()?.result;
    const total = this.total();
    if (!result || total === null) {
      return null;
    }
    switch (result) {
      case 'legendaire':
        return {title: 'Succès légendaire', detail: 'Double 6 et 1 point d’héroïsme : deux options au choix.', tone: 'legendaire'};
      case 'heroique':
        return {
          title: 'Succès héroïque',
          detail: this.isNatural12() ? 'Double 6 : le coup touche, avec une option au choix.' : 'Touché, transformé pour 1 point d’héroïsme : une option au choix.',
          tone: 'heroique',
        };
      case 'echec_critique':
        return {title: 'Échec critique', detail: 'Double 1 : une issue franchement défavorable, et 1 point d’héroïsme gagné.', tone: 'echec'};
      case 'echec':
        return {title: 'Raté', detail: this.isNatural2() ? 'Double 1 : échec automatique.' : `il manquait ${ATTACK_THRESHOLD - total}`, tone: 'echec'};
      case 'reussite': {
        const detail = !this.isNatural12()
          ? total > ATTACK_THRESHOLD
            ? `réussi de ${total - ATTACK_THRESHOLD}`
            : 'tout juste'
          : total > ATTACK_THRESHOLD
            ? 'Double 6 : réussite automatique.'
            : 'Double 6 : seul lui pouvait toucher, c’est une réussite normale.';
        return {title: 'Touché', detail, tone: 'reussite'};
      }
    }
  });

  // ── Le jet de sort (livre p. 148) : 2d6 + esprit + sorcier ± difficulté, moins l'esprit de la cible pour un sort qui agit sur son esprit ;
  // réussite à 9, comme tout jet d'action. Ses dés sont à part de ceux de l'attaque.

  readonly sortDice = signal<readonly [number, number] | null>(null);

  readonly sortRolledDice = signal<readonly number[] | null>(null);

  readonly sortManual = signal<number | null>(null);

  /** Un charme automatique a été lancé, sans jet. */
  readonly sortAuto = signal(false);

  /** Les points de pouvoir payés pour le sort de ce tour ; 0 tant qu'il n'est pas lancé. */
  readonly sortPaid = signal(0);

  /** Échec critique accepté sur un double 1 : rapporte 1 point d'héroïsme. */
  readonly sortCritique = signal(false);

  /** Les dégâts du sort ont été appliqués : il ne reste qu'à finir le tour. */
  readonly sortDamageDone = signal(false);

  /** La trace « sort payé » de cette carte dans l'état du combat (cf. `effetSortPaye`) : elle survit à la page rechargée. */
  readonly sortTrace = computed(() => sortPayeCeRound(this.turn.effets(), this.turn.card().key));

  /** Un sort lancé ce tour-ci a été perdu : la cible a changé après son jet. Il a coûté l'action : l'attaque, la défense totale, le retard
   * restent fermés ; un nouveau sort se paie. */
  readonly sortPerdu = linkedSignal<string, boolean>({source: () => this.turn.turnKey(), computation: () => false});

  /** L'assistant a déjà payé (ou rendu) un sort ce tour-ci : la trace qui reste est la sienne, elle ne fait plus crédit. */
  readonly sortCreditPris = linkedSignal<string, boolean>({source: () => this.turn.turnKey(), computation: () => false});

  /** Le pouvoir payé pour le sort de ce tour avant que l'assistant reparte de zéro (page rechargée en plein tour) : le prochain jet ne le
   * redébite pas. */
  readonly sortCredit = computed(() => (this.sortCreditPris() || this.sortPaid() > 0 || this.sortAuto() ? 0 : this.sortTrace().points));

  /** Ce que le premier jet du sort débitera : son coût, moins ce qui a déjà été payé avant un rechargement. */
  readonly sortADebiter = computed(() => Math.max(0, this.loadout.sortCout().total - this.sortCredit()));

  /** Il a de quoi payer le sort, compte tenu de ce qui est déjà payé. */
  readonly sortPayable = computed(() => pouvoirSuffisant(this.turn.attacker()?.magie?.pouvoir ?? null, this.sortADebiter()));

  readonly sortDiceSum = computed(() => {
    const d = this.sortDice();
    return d ? d[0] + d[1] : this.sortManual();
  });

  private readonly sortNatural = computed<readonly [number, number] | null>(() => {
    const d = this.sortDice();
    if (d) {
      return d;
    }
    const manual = this.sortManual();
    return manual === 2 ? [1, 1] : manual === 12 ? [6, 6] : null;
  });

  /** L'esprit de la cible, en malus d'un sort qui agit sur son esprit ; `null` pour un autre sort. `undefined` : il faut d'abord la viser. */
  private readonly espritCible = computed<number | null | undefined>(() => {
    if (!this.loadout.sortModel().espritCible) {
      return null;
    }
    const stats = this.turn.targetStats();
    return this.turn.target() && stats ? (stats.magie?.esprit ?? 0) : undefined;
  });

  /** Ce qui s'ajoute aux deux dés du jet de sort, modificateur du MJ compris ; `null` tant qu'il manque la cible d'un sort sur l'esprit. */
  readonly sortModifier = computed(() => {
    const magie = this.turn.attacker()?.magie;
    const espritCible = this.espritCible();
    if (!magie || espritCible === undefined) {
      return null;
    }
    const jet = {esprit: magie.esprit, sorcier: magie.sorcier ?? 0, difficulte: this.loadout.sortDifficulte().valeur ?? 0, espritCible};
    return modificateurSort(jet) + this.loadout.freeModifier();
  });

  readonly sortGoal = computed<AttackGoal | null>(() => {
    const modifier = this.sortModifier();
    return modifier === null ? null : this.goalFor(modifier);
  });

  readonly sortTotal = computed(() => {
    const sum = this.sortDiceSum();
    const modifier = this.sortModifier();
    return sum === null || modifier === null ? null : sum + modifier;
  });

  readonly sortRowDice = computed<readonly DiceRowDie[] | null>(() => {
    const all = this.sortRolledDice();
    if (all) {
      const kept = keptDiceIndexes(all, this.loadout.netDice());
      return all.map((value, index) => ({value, dropped: !kept.includes(index)}));
    }
    const pair = this.sortNatural();
    return pair ? [{value: pair[0]}, {value: pair[1]}] : null;
  });

  /** L'addition du jet de sort : les dés, l'esprit, le rang de sorcier, la difficulté, l'esprit de la cible, le modificateur du MJ ; le seuil,
   * puis le total. */
  readonly sortSum = computed<readonly DwRollSumTerm[]>(() => {
    const magie = this.turn.attacker()?.magie;
    if (!magie) {
      return [];
    }
    const dice = this.sortDiceSum();
    const kept = this.keptDice();
    const terms: DwRollSumTerm[] = [{value: dice === null ? (kept ?? '2d6') : `${dice}`, caption: dice === null ? 'dés' : (kept ?? 'dés'), tone: 'dice'}];
    const add = (value: number, caption: string): void => {
      if (value !== 0) {
        terms.push({value: signedTerm(value), caption, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    add(magie.esprit, 'esprit');
    add(magie.sorcier ?? 0, 'sorcier');
    add(this.loadout.sortDifficulte().valeur ?? 0, this.loadout.sortDifficulte().label.toLowerCase());
    const espritCible = this.espritCible();
    if (typeof espritCible === 'number') {
      add(-espritCible, `esprit de ${this.turn.target()?.nom ?? 'la cible'}`);
    }
    add(this.loadout.freeModifier(), 'modificateur');
    const total = this.sortTotal();
    terms.push(total === null ? {value: `≥ ${ATTACK_THRESHOLD}`, caption: 'seuil', tone: 'total'} : {value: `= ${total}`, caption: `pour ${ATTACK_THRESHOLD}`, tone: 'total'});
    return terms;
  });

  /** Ce que disent les dés du sort. Un double 6 qui dépasse le seuil est un succès héroïque, pour les héros et leurs alliés. */
  private readonly sortBase = computed<InitiativeResultat | null>(() => {
    if (this.sortAuto()) {
      return 'reussite';
    }
    const total = this.sortTotal();
    const sum = this.sortDiceSum();
    if (total === null || sum === null) {
      return null;
    }
    return issueSort(this.sortNatural(), sum, total, this.turn.heroicAllowed());
  });

  /** Le verdict du sort. Les points de pouvoir sont dépensés quoi qu'il arrive (interprétation : le livre ne dit rien d'un sort raté). */
  readonly sortVerdict = computed<(AttackVerdict & {readonly hit: boolean}) | null>(() => {
    const base = this.sortBase();
    const total = this.sortTotal();
    if (base === null) {
      return null;
    }
    if (this.sortAuto()) {
      return {title: 'Le charme agit', detail: 'Automatique : sans jet.', tone: 'reussite', hit: true};
    }
    const natural2 = this.sortNatural()?.[0] === 1 && this.sortNatural()?.[1] === 1;
    switch (base) {
      case 'heroique':
        return {title: 'Succès héroïque', detail: 'Double 6 : le sort agit, et le MJ en renforce l’effet.', tone: 'heroique', hit: true};
      case 'reussite':
        return {title: 'Le sort agit', detail: total !== null && total > ATTACK_THRESHOLD ? `réussi de ${total - ATTACK_THRESHOLD}` : 'tout juste', tone: 'reussite', hit: true};
      default:
        if (this.sortCritique()) {
          return {title: 'Échec critique', detail: 'Double 1 : le sort se retourne contre lui, et 1 point d’héroïsme gagné.', tone: 'echec', hit: false};
        }
        return {title: 'Le sort échoue', detail: natural2 ? 'Double 1 : échec automatique. Le pouvoir est dépensé.' : `il manquait ${ATTACK_THRESHOLD - (total ?? 0)} ; le pouvoir est dépensé.`, tone: 'echec', hit: false};
    }
  });

  /** Faveur divine sur un sort raté : 1 point pour relancer les dés, sans repayer le sort. */
  readonly canSortFavor = computed(() => this.sortBase() === 'echec' && !this.sortCritique() && !this.sortAuto() && !this.sortDamageDone() && (this.heroisme() ?? 0) > 0);

  /** Un héros qui sort un double 1 peut en faire un échec critique, qui lui rapporte 1 point d'héroïsme. */
  readonly canSortCritique = computed(() => this.turn.card().kind === 'hero' && this.heroisme() !== null && this.sortBase() === 'echec' && this.sortNatural()?.[0] === 1 && this.sortNatural()?.[1] === 1);

  toggleSortCritique(): void {
    this.turn.heroismeAdjusted.emit(this.sortCritique() ? -1 : 1);
    this.sortCritique.update((chosen) => !chosen);
  }

  /** Le jet du sort est refait (relancé, ou son total retapé) : l'échec critique accepté sur l'ancien jet ne vaut plus, son point
   * d'héroïsme est repris — comme `clearHeroism(true)` pour l'attaque. */
  oublierSortCritique(): void {
    if (this.sortCritique()) {
      this.turn.heroismeAdjusted.emit(-1);
      this.sortCritique.set(false);
    }
  }

  /** Oublie les dés du sort (pas ce qu'il a coûté). */
  clearSortDice(): void {
    this.sortDice.set(null);
    this.sortRolledDice.set(null);
    this.sortManual.set(null);
  }

  /** Oublie le sort du tour : à une nouvelle carte active, ou quand il passe de l'attaque au sort. */
  resetSort(): void {
    this.clearSortDice();
    this.sortAuto.set(false);
    this.sortPaid.set(0);
    this.sortCritique.set(false);
    this.sortDamageDone.set(false);
  }

  goalFor(modifier: number): AttackGoal {
    const net = this.loadout.netDice();
    const chance = Math.round(actionSuccessChance(net, modifier, ATTACK_THRESHOLD) * 100);
    const label = actionDiceTargetLabel(actionDiceTarget(modifier, ATTACK_THRESHOLD));
    // Avec le dé du MJ, le total à atteindre se lit sur les deux dés gardés.
    const small = net !== 0 && label.small === 'aux dés' ? this.keptCaption() : label.small;
    return {big: label.big, small, chance};
  }

  /** Les dés gardés, en notation du livre : « 2d6B » (les deux meilleurs) ou « 2d6M » (les deux moins bons) ; `null` pour un jet à deux dés. */
  private keptDice(): string | null {
    const net = this.loadout.netDice();
    return net > 0 ? '2d6B' : net < 0 ? '2d6M' : null;
  }

  /** Lesquels des trois dés comptent : « 2 meilleurs » ou « 2 moins bons » ; « dés » pour un jet à deux dés. */
  private keptCaption(): string {
    const net = this.loadout.netDice();
    return net > 0 ? '2 meilleurs' : net < 0 ? '2 moins bons' : 'dés';
  }

  /** De quoi est fait le bonus d'attaque, en infobulle sur sa tuile : « Agilité +2, équipement −3, mêlée +2 ». */
  private attackHint(a: ResolvedCombatStats): string {
    if (a.attaque !== null) {
      return 'Attaque de la créature, tout compris';
    }
    const equipement = a.equipementAgilite ?? 0;
    const term = (value: number): string => (value === 0 ? '0' : signedTerm(value));
    const parts = this.loadout.brawl()
      ? [`Vigueur ${term(a.vigueur)} (bagarre)`]
      : [`Agilité ${term(a.agilite - equipement)}`, ...(equipement !== 0 ? [`équipement ${term(equipement)}`] : [])];
    parts.push(this.loadout.isTir() ? `tir ${term(a.tir)}` : `mêlée ${term(a.melee)}`);
    return parts.join(', ');
  }

  /** Prend ou retire une option de succès héroïque (cf. `toggleHeroicPick`). */
  pickHeroic(slug: HeroicSlug): void {
    if (this.heroicOptions().find((option) => option.slug === slug)?.blocked) {
      return;
    }
    this.picks.update((picks) => toggleHeroicPick(picks, slug, this.picksMax()));
  }

  /** Échec critique sur un double 1 : l'accepter rapporte 1 point d'héroïsme, y renoncer le reprend. */
  toggleCritique(): void {
    this.turn.heroismeAdjusted.emit(this.critique() ? -1 : 1);
    this.critique.update((chosen) => !chosen);
  }

  /** Succès légendaire sur un double 6 : 1 point d'héroïsme pour une seconde option ; y renoncer le rembourse. */
  toggleLegendary(): void {
    if (!this.legendary() && !this.canSpend()) {
      return;
    }
    this.turn.heroismeAdjusted.emit(this.legendary() ? 1 : -1);
    this.legendary.update((chosen) => !chosen);
    this.picks.update((picks) => picks.slice(0, this.picksMax()));
  }

  /** Succès héroïque acheté sur un coup qui touche : 1 point d'héroïsme pour une option ; y renoncer le rembourse. */
  toggleHeroicUpgrade(): void {
    if (!this.heroicUpgrade() && !this.canSpend()) {
      return;
    }
    this.turn.heroismeAdjusted.emit(this.heroicUpgrade() ? 1 : -1);
    this.heroicUpgrade.update((chosen) => !chosen);
    this.picks.update((picks) => picks.slice(0, this.picksMax()));
  }

  /** Oublie les choix d'héroïsme du jet. Quand le jet est refait (`refund`), ce qu'ils avaient coûté ou rapporté est rendu. */
  clearHeroism(refund: boolean): void {
    const delta = (this.legendary() ? 1 : 0) + (this.heroicUpgrade() ? 1 : 0) - (this.critique() ? 1 : 0);
    this.critique.set(false);
    this.legendary.set(false);
    this.heroicUpgrade.set(false);
    this.picks.set([]);
    if (refund && delta !== 0) {
      this.turn.heroismeAdjusted.emit(delta);
    }
  }

  /** Oublie le jet : ses dés, ses modificateurs figés et ses choix d'héroïsme, sans rien rendre. */
  resetRoll(): void {
    this.frozenTerms.set(null);
    this.feintNoted.set(false);
    this.dice.set(null);
    this.rolledDice.set(null);
    this.manualTotal.set(null);
    this.clearHeroism(false);
  }
}
