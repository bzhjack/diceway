import {afterNextRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, Injector, input, linkedSignal, output, signal, untracked, viewChild} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {A11yModule} from '@angular/cdk/a11y';
import {CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition} from '@angular/cdk/overlay';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {ActionDiceTargetLabel, ActionRollCarriere, ActionRollTone, RollSumTerm} from '../../models/action-roll.model';
import {CombatEffect, ModifierTerm, NewEffect} from '../../models/combat-effect.model';
import {actionDiceTarget, actionDiceTargetLabel, actionSuccessChance, keepBestOrWorstTwo, keptDiceIndexes, netDiceModifier, parseDiceTotal} from '../../action-roll.util';
import {aDejaFeinte, descriptionEffet, doitUnDeDeMalus, perdSonAction, effetActionPerdue, effetFeinte, effetParade, effetCoupPrecis, effetRenversement, libelleDuree, modificateursPour, POSTURE_DEFENSE, sansTerme, sommeModificateurs} from './combat-effects.util';
import {EffectsListComponent} from './effects-list';
import {baseRangeMeters, DEFAULT_RANGE_INDEX, formatMeters, RANGE_FACTORS, rangeReach} from '../../range.util';
import {DwDiceRowComponent} from '../../../../shared/dice-row/dice-row';
import {DiceRowDie} from '../../../../shared/models/dice-row.model';
import {EndTurnDialogComponent} from '../end-turn-dialog/end-turn-dialog';
import {EndTurnChoice, EndTurnDialogData} from '../../models/end-turn-dialog.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {ARME_IMPROVISEE, DUAL_WIELD_SLUGS, filterAttackMenuCombatOptions, filterVisiblePostures, isDualWieldWeapon, isHeavyWeapon, MAINS_NUES} from '../../attack-options.util';
import {dualStrikeDegats, libellePoints, nomDesPoints, sbireBouclier} from '../../combat-attack.util';
import {estArmeFavorite} from '../../../shared/arme/arme-favorite.util';
import {egratignure} from '../../heroisme-spend.util';
import {
  ATTACK_THRESHOLD,
  attackBonus,
  computeAttackTotal,
  damageDiceCount,
  damageDieMax,
  damageRange,
  degatsEnMain,
  devastatingBonus,
  estPolyvalente,
  finalDamage,
  HEROIC_OPTIONS,
  heroicPicksAllowed,
  HeroicSlug,
  parseDamage,
  rawDamage,
  scaleDamage,
  resolvePostureAttackModifier,
  rollD6,
  suggestedAttackResult,
  toggleHeroicPick,
  vigueurBonus,
} from '../../combat-resolution.util';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {AttackChoice} from '../../models/attack-options.model';
import {AppliedHit, DamageDie, HeroismeChange, ResolvedCombatStats, VitaliteChange} from '../../models/combat-attack.model';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {ValueTracker} from '../../value-tracker';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {PointsStepperComponent} from './points-stepper';
import {isLowVitalite, vitalitePercent} from './tapis.util';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';

/** Délai maximal d'un lancer 3D avant de tirer les dés sans animation. */
const DICE_TIMEOUT_MS = 12000;

/** Les postures de l'échelle, de la plus prudente à la plus audacieuse ; les autres sont des options spéciales. */
const SCALE_SLUGS: readonly string[] = ['defensive', 'none', 'offensive', 'intrepid'];

/** Un réglage rare actif (option spéciale, dé ou modificateur du MJ, carrière), montré en pastille quand « Options » est replié. */
interface ActiveOption {
  readonly id: 'special' | 'gm' | 'mod' | 'career';
  readonly label: string;
}

/** Ce que rapporte chaque dé de dégâts, en clair, à côté de la case où on le saisit. */
const DIE_NOTES: Readonly<Record<DamageDie, string>> = {
  d3: 'un d6 divisé par deux',
  d6: 'un d6',
  d6m: 'le moins bon de deux d6',
  d6b: 'le meilleur de deux d6',
};

/** Dégâts d'une attaque de horde qui touche, quelles que soient les armes des piétailles (livre p. 132). */
const HORDE_DEGATS = 'd6M';

/** Ce qu'est une carte, en clair. */
const KIND_LABELS: Readonly<Record<TapisKind, string>> = {hero: 'Héros', pnj: 'PNJ', creature: 'Créature', demon: 'Démon'};

/** Où en est une des trois cases du coup : pas encore son tour, à jouer, ou faite. */
type StationState = 'todo' | 'cur' | 'done';

/** Un chiffre de combat et son libellé : dans la ligne de l'attaquant, ou en tuile sur la fiche de la cible. */
interface StatTile {
  readonly label: string;
  readonly value: string;
  /** La posture choisie améliore (`up`) ou dégrade (`down`) ce chiffre. */
  readonly tone?: 'up' | 'down';
  /** D'où vient le chiffre, en infobulle. */
  readonly hint?: string;
  /** Le dé qui peut remplacer le chiffre (protection « d6−2 »), en petit sous lui. */
  readonly sub?: string;
}

/** Une protection au dé (« d6-2 (2) ») en tuile : sa valeur fixe en grand, son dé en petit ; une protection fixe reste telle quelle. */
function protectionTile(text: string | null, fixed: number): StatTile {
  const die = text?.replace(/\s*\(\d+\)\s*$/, '').trim() ?? '';
  return /d\d/i.test(die) ? {label: 'Protection', value: String(fixed), sub: die.replace('-', '−')} : {label: 'Protection', value: text ?? String(fixed)};
}

/** Un terme de l'addition d'un jet sur le plateau. */
interface TraySumTerm extends RollSumTerm {
  /** Effet du registre dont le terme vient : sa croix le retire. */
  readonly effetId?: string;
  /** Le terme se clique pour saisir sa valeur à la main (protection de la cible). */
  readonly editable?: boolean;
}

/** Ce qu'il faut aux dés pour toucher, et les chances d'y arriver. */
interface AttackGoal extends ActionDiceTargetLabel {
  readonly chance: number;
}

/** Le verdict du jet d'attaque : son titre, l'écart au seuil, sa couleur. */
interface AttackVerdict {
  readonly title: string;
  readonly detail: string;
  readonly tone: ActionRollTone;
}

/** La barre de vie d'une carte, en pourcentages : ce qu'il lui reste, et ce que le coup en cours va lui retirer. */
interface LifeBar {
  readonly rest: number;
  readonly loss: number;
  readonly low: boolean;
}

/** Typographie d'un terme signé : « +2 », « −1 ». */
function signedTerm(value: number): string {
  return `${value > 0 ? '+' : '−'}${Math.abs(value)}`;
}

/** De quel côté est une carte, en clair : « Héros », « Allié » ou « Adversaire », puis ce qu'elle est (« PNJ · Coriace ») pour tout ce
 * qui n'est pas un héros. */
function sideOf(card: TapisCard): {readonly foe: boolean; readonly label: string; readonly detail: string} {
  const foe = card.camp !== 'heros';
  const label = foe ? 'Adversaire' : card.kind === 'hero' ? 'Héros' : 'Allié';
  const detail = card.kind === 'hero' ? (foe ? 'Héros' : '') : [KIND_LABELS[card.kind], card.rang].filter(Boolean).join(' · ');
  return {foe, label, detail};
}

/** Un modificateur hors registre (modificateur libre, carrière) en terme d'addition : « + 2 Voleur ». */
function extraTerm(valeur: number, nom: string): ModifierTerm {
  return {effetId: null, label: `${valeur > 0 ? '+' : '−'} ${Math.abs(valeur)} ${nom}`, valeur, tone: valeur > 0 ? 'plus' : 'minus'};
}

/** Des points à montrer sous le titre « Héroïsme » ou « Vilénie » ; `null` pour une carte qui n'en a pas. */
function pointsAffiches(kind: TapisKind, points: number | null): {points: number; titre: string} | null {
  if (points === null) {
    return null;
  }
  const nom = nomDesPoints(kind);
  return {points, titre: nom.charAt(0).toUpperCase() + nom.slice(1)};
}

/** L'assistant de tour, sous la frise en combat : un coup en trois temps. Trois cartes portent les réglages de la carte active — qui
 * attaque (ses chiffres, les effets en cours, la fin de son tour), avec quoi (arme, distance), comment (posture, options) ; dessous,
 * sur la même grille, trois cases — qui elle vise, son jet d'attaque (2d6 + bonus − défense, 9+), son jet de dégâts — dont celle où
 * il faut agir s'allume, et une ligne qui dit quoi faire ensuite.
 * Il annonce ce qu'il faut aux dés et les chances, prend les totaux lancés à table, et montre sur la vie de la cible ce que le coup va
 * lui retirer. Pour un héros, le jet d'attaque ouvre les usages de l'héroïsme : faveur divine après un coup raté, échec critique sur un
 * double 1, succès héroïque acheté sur un coup qui touche, succès légendaire sur un double 6 — avec leurs options de combat.
 * Il ne parle à aucun service : il signale à la page ce qui doit être enregistré (dégâts, fin de tour, défense totale, héroïsme). */
@Component({
  selector: 'bol-turn-assistant',
  imports: [
    A11yModule,
    AvatarFallbackDirective,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    DwDiceRowComponent,
    DwValueStepperComponent,
    EffectsListComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    PointsStepperComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './turn-assistant.html',
  styleUrl: './turn-assistant.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnAssistantComponent {
  readonly card = input.required<TapisCard>();
  /** Armes du héros actif — vide pour un PNJ, une créature ou un démon, ou tant qu'elles chargent. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  /** Toutes les armes du héros, équipées ou non : l'arme secondaire du combat à deux armes se choisit parmi elles. */
  readonly ownedArmes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);
  /** Cartes que la carte active peut viser : le camp d'en face, hors combat exclu. */
  readonly targets = input<readonly TapisCard[]>([]);
  readonly target = input<TapisCard | null>(null);
  /** Statistiques résolues de l'attaquant et de la cible (défense totale de la cible déjà ajoutée). */
  readonly attacker = input<ResolvedCombatStats | null>(null);
  readonly targetStats = input<ResolvedCombatStats | null>(null);
  /** Statistiques de chaque carte visable (clé de carte → statistiques) : son jeton annonce ce qu'il faut pour la toucher. */
  readonly targetsStats = input<ReadonlyMap<string, ResolvedCombatStats>>(new Map());
  /** Un héros a obtenu un succès légendaire : +1 aux jets d'attaque de l'attaquant s'il est du camp des héros. */
  readonly legendaryBonus = input(false);
  /** Les effets en cours (registre du combat) : leurs modificateurs entrent dans les jets. */
  readonly effets = input<readonly CombatEffect[]>([]);
  /** Plateau de dés 3D de l'écran de combat : les dés roulent par-dessus tout l'écran. Sans lui, les dés sont tirés sans animation. */
  readonly diceBox = input<DiceBoxHostComponent | null>(null);
  /** Carrières de l'attaquant (un héros) : le MJ peut en laisser une aider une manœuvre ou une feinte. */
  readonly carrieres = input<readonly ActionRollCarriere[]>([]);
  /** Un héros mourant du camp de la carte active peut être secouru : « Secourir » s'affiche. */
  readonly canRescue = input(false);
  /** Les piétailles de son camp qui peuvent se joindre à l'attaque de la carte active, une piétaille : elles attaquent en horde. */
  readonly hordeMates = input<readonly TapisCard[]>([]);

  readonly choiceChanged = output<AttackChoice | null>();
  /** Les piétailles engagées dans la horde : leur tour finit avec celui de la carte active. */
  readonly hordeChanged = output<readonly string[]>();
  /** La carte choisie comme cible, ou `null` pour « Changer d'adversaire ». */
  readonly targetSelected = output<TapisCard | null>();
  /** Ouvrir la fiche complète (statbloc) d'un des deux duellistes. */
  readonly sheetRequested = output<TapisCard>();
  readonly attackRolled = output<TapisCard>();
  readonly effectRemoved = output<string>();
  readonly effectAdded = output<NewEffect>();
  readonly damageApplied = output<AppliedHit>();
  readonly totalDefenseRequested = output<void>();
  /** « Retarder » : la carte active joue en dernier ce round. */
  readonly delayRequested = output<void>();
  /** « Secourir » : la carte active tente de stabiliser un héros mourant, à la place de son attaque. */
  readonly rescueRequested = output<void>();
  /** « Fin du tour ». `true` quand il suit un coup qu'on vient de conclure : la fin du tour attend alors l'enregistrement des effets
   * du coup, au lieu d'être ignorée comme un double clic. */
  readonly endTurnRequested = output<boolean>();
  /** Points d'héroïsme dépensés (négatif) ou gagnés (positif) par l'attaquant sur ce jet. */
  readonly heroismeAdjusted = output<number>();
  /** Vitalité de l'attaquant ou de la cible corrigée à la main sur son cœur, ou rendue par « Juste une égratignure ». */
  readonly vitaliteAdjusted = output<VitaliteChange>();
  /** Points d'héroïsme dépensés par la cible, un héros : parade in extremis, « Juste une égratignure ». */
  readonly targetHeroismeAdjusted = output<HeroismeChange>();

  /** La vitalité de l'attaquant et celle de la cible, chacune sur son cœur : elles suivent la table, et chaque pas est signalé à la
   * page. */
  protected readonly vitaliteControl = new FormControl(0, {nonNullable: true});
  protected readonly targetVitaliteControl = new FormControl(0, {nonNullable: true});
  /** Un héros peut descendre sous 0 (mourant) ; les autres s'arrêtent à 0. */
  protected readonly vitaliteMin = computed(() => (this.card().kind === 'hero' ? -20 : 0));
  protected readonly targetVitaliteMin = computed(() => (this.target()?.kind === 'hero' ? -20 : 0));

  /** De quel côté est la carte qui attaque, dit en gros sur sa carte : « Héros », « Allié » ou « Adversaire », puis ce qu'elle est
   * (« PNJ · Coriace », « Créature · Rival »…) pour tout ce qui n'est pas un héros. */
  protected readonly side = computed(() => sideOf(this.card()));
  /** La même pastille pour la cible, sur la carte « Qui ? ». */
  protected readonly targetSide = computed(() => {
    const target = this.target();
    return target ? sideOf(target) : null;
  });

  protected readonly heroicOptions = HEROIC_OPTIONS;
  protected readonly isHero = computed(() => this.card().kind === 'hero');
  /** Les options de succès héroïque (dont « Massacrer la piétaille ») sont celles des héros : leurs alliés y ont droit, pas leurs adversaires. */
  protected readonly heroicAllowed = computed(() => this.card().camp === 'heros');

  // ── Étape 1 : arme, posture, arme secondaire — repartent de zéro à chaque nouvelle carte active ──
  /** Les mains nues et l'arme improvisée sont à tous ceux qui se battent comme les héros : héros, rivaux et coriaces (02-actions-combat.md,
   * « Dégâts ») — un PNJ désarmé n'a plus que ça. La piétaille a des dégâts fixes (1, ou d3 armée ; 1 à mains nues, 04-pnj-creatures-demons.md),
   * créatures et démons n'ont pas d'arme. */
  private readonly hasMakeshiftWeapons = computed(() => this.isHero() || (this.card().kind === 'pnj' && this.card().rang !== 'Piétaille'));
  /** Un héros attaque avec ses armes équipées, un PNJ avec n'importe laquelle de ses armes ; plus, pour eux, les mains nues et l'arme
   * improvisée. */
  protected readonly displayArmes = computed(() => (this.hasMakeshiftWeapons() ? [...this.armes(), MAINS_NUES, ARME_IMPROVISEE] : this.armes()));
  // La source est la clé de la carte (`cardKey`), pas la carte : la table rechargée repasse une carte identique mais neuve, qui remettrait
  // ces choix à zéro — et, avec eux, le jet en cours.
  private readonly selectedArmeId = linkedSignal<string, number | null>({source: () => this.cardKey(), computation: () => null});
  private readonly selectedOptionSlug = linkedSignal<string, string | null>({source: () => this.cardKey(), computation: () => null});
  private readonly selectedOffHandId = linkedSignal<string, number | null>({source: () => this.cardKey(), computation: () => null});

  /** Les armes lourdes que l'attaquant ne peut pas manier : toutes, s'il a moins de 0 en vigueur (02-actions-combat.md, « Dégâts »). */
  protected readonly heavyForbidden = computed<ReadonlySet<number | undefined>>(() =>
    (this.attacker()?.vigueur ?? 0) < 0 ? new Set(this.displayArmes().filter(isHeavyWeapon).map((a) => a.id)) : new Set(),
  );

  protected readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    const allowed = list.filter((a) => !this.heavyForbidden().has(a.id));
    // Un tireur (son tir dépasse sa mêlée) part d'office sur son arme de tir : l'archer prend son arc, pas sa dague.
    const preferred = this.prefersTir() ? allowed.find((a) => a.arme?.type === 'T') : undefined;
    return allowed.find((a) => a.id === this.selectedArmeId()) ?? preferred ?? allowed[0] ?? list[0] ?? null;
  });
  /** À mains nues — celles d'un héros, ou une arme « Mains nues » d'un PNJ : la vigueur ne compte que pour moitié dans les dégâts, et
   * ces dégâts se récupèrent en totalité après le combat. */
  private readonly unarmed = computed(() => {
    const arme = this.effectiveArme();
    return arme?.id === MAINS_NUES.id || /mains nues/i.test(arme?.arme?.arme ?? '');
  });

  /** Bagarre à mains nues (livre p. 62, au choix du MJ) : la vigueur remplace l'agilité dans le bonus d'attaque. */
  private readonly brawlChosen = linkedSignal<string, boolean>({source: () => this.cardKey(), computation: () => false});
  protected readonly canBrawl = computed(() => this.unarmed() && this.attacker()?.attaque === null);
  protected readonly brawl = computed(() => this.canBrawl() && this.brawlChosen());

  /** Arme polyvalente (Mythic+, « d6 ou d6B ») : maniée à deux mains — d'office, sauf en combat à deux armes —, elle frappe avec son
   * second dé. */
  private readonly deuxMainsChoisi = linkedSignal<string, boolean>({source: () => this.cardKey(), computation: () => true});
  protected readonly polyvalente = computed(() => estPolyvalente(this.effectiveArme()?.arme?.degats) && !this.isDualWieldSelected());
  /** Pourquoi elle ne peut pas se manier à deux mains : un bouclier occupe l'autre main, ou, à deux mains, ce serait une arme lourde
   * (d6B), impossible avec moins de 0 en vigueur ; `null` si rien ne l'empêche. */
  protected readonly deuxMainsInterdit = computed(() => {
    const attacker = this.attacker();
    if (attacker?.bouclier) {
      return 'Son bouclier occupe l’autre main : l’arme se manie à une main.';
    }
    return (attacker?.vigueur ?? 0) < 0 ? 'À deux mains, c’est une arme lourde : impossible à manier avec moins de 0 en vigueur.' : null;
  });
  protected readonly deuxMains = computed(() => this.polyvalente() && this.deuxMainsChoisi() && this.deuxMainsInterdit() === null);
  protected readonly degatsDeuxMains = computed(() => degatsEnMain(this.effectiveArme()?.arme?.degats ?? null, true));

  /** Modificateur libre du MJ au jet d'attaque (circonstances), comme sur le jet d'action : il repart de 0 à chaque carte active. */
  protected readonly modifierControl = new FormControl(0, {nonNullable: true});
  private readonly freeModifier = toSignal(this.modifierControl.valueChanges, {initialValue: 0});

  /** « Carrières et combat » (02-actions-combat.md) : pour une manœuvre ou une feinte décrite par le joueur, le MJ peut ajouter le rang
   * d'une carrière au jet d'attaque ou aux dégâts, jamais aux deux. */
  protected readonly usefulCarrieres = computed(() => this.carrieres().filter((c) => c.value > 0));
  private readonly careerLabel = linkedSignal<string, string | null>({source: () => this.cardKey(), computation: () => null});
  protected readonly careerOn = linkedSignal<string, 'attaque' | 'degats'>({source: () => this.cardKey(), computation: () => 'attaque'});
  protected readonly career = computed(() => this.usefulCarrieres().find((c) => c.label === this.careerLabel()) ?? null);
  /** La feinte de ce jet a été notée sur la cible : l'avertissement ne vaut que pour une nouvelle tentative. */
  private readonly feintNoted = signal(false);
  /** Cette feinte a déjà été tentée contre la cible par cet attaquant : elle ne marche pas deux fois. */
  protected readonly feintRetry = computed(() => {
    const target = this.target();
    return this.career() !== null && target !== null && !this.feintNoted() && aDejaFeinte(this.effets(), target.key, this.card().key);
  });

  /** Règle de horde (04-pnj-creatures-demons.md ; livre p. 132) : des piétailles qui attaquent ensemble la même cible ne font qu'une
   * attaque, à +1 par piétaille impliquée, et infligent d6M si elle touche. Le MJ coche celles qui se joignent à la carte active ;
   * le choix repart de zéro à chaque nouvelle carte active. */
  private readonly hordeChosen = linkedSignal<string, readonly string[]>({source: () => this.cardKey(), computation: () => []});
  /** Les piétailles engagées avec la carte active — celles qui peuvent encore jouer. */
  protected readonly horde = computed(() => this.hordeMates().filter((card) => this.hordeChosen().includes(card.key)));
  /** Nombre de piétailles impliquées, la carte active comprise ; 0 sans horde. C'est aussi le bonus d'attaque. */
  protected readonly hordeDegats = HORDE_DEGATS;
  protected readonly hordeSize = computed(() => (this.horde().length > 0 ? this.horde().length + 1 : 0));

  protected toggleHordeMate(key: string): void {
    this.hordeChosen.update((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));
  }

  /** Le modificateur libre, la carrière, la portée d'un tir et le bonus de horde, en termes d'addition : ils entrent dans les jets
   * comme les effets en cours. */
  private readonly extraAttackTerms = computed<readonly ModifierTerm[]>(() => {
    const career = this.career();
    const range = this.range();
    return [
      ...(this.hordeSize() > 0 ? [extraTerm(this.hordeSize(), 'horde')] : []),
      ...(range && range.modifier !== 0 ? [extraTerm(range.modifier, `portée ${range.label.toLowerCase()}`)] : []),
      ...(this.freeModifier() !== 0 ? [extraTerm(this.freeModifier(), 'modificateur')] : []),
      ...(career && this.careerOn() === 'attaque' ? [extraTerm(career.value, career.label)] : []),
    ];
  });
  private readonly extraDamageTerms = computed<readonly ModifierTerm[]>(() => {
    const career = this.career();
    return career && this.careerOn() === 'degats' ? [extraTerm(career.value, career.label)] : [];
  });

  /** L'arme secondaire d'un héros se prend parmi toutes ses armes légères ou moyennes, équipées ou non : « équipée » dit
   * seulement ce que le héros propose à l'attaque, pas ce qu'il a en main pour parer ou frapper à deux armes. */
  protected readonly eligibleOffHandArmes = computed(() => {
    const mainId = this.effectiveArme()?.id;
    const candidates = this.isHero() ? this.ownedArmes() : this.displayArmes();
    return candidates.filter((a) => a.id !== mainId && isDualWieldWeapon(a));
  });

  protected readonly visibleOptions = computed(() => {
    // Les options de combat sont facultatives (02-actions-combat.md) : créatures et démons, qui n'ont qu'une attaque, n'en ont pas.
    if (this.card().kind === 'creature' || this.card().kind === 'demon') {
      return [];
    }
    const options = filterAttackMenuCombatOptions(this.combatOptions());
    if (!this.isHero()) {
      return options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
    }
    const otherDegats = this.eligibleOffHandArmes().map((a) => a.arme?.degats ?? null);
    // L'arme principale doit elle aussi être une vraie arme légère ou moyenne : mains nues et arme improvisée ne comptent pas.
    const main = this.effectiveArme();
    return filterVisiblePostures(options, main && isDualWieldWeapon(main) ? (main.arme?.degats ?? null) : null, otherDegats);
  });

  protected readonly effectiveOption = computed(() => {
    const list = this.visibleOptions();
    return list.find((o) => o.slug === this.selectedOptionSlug()) ?? list[0] ?? null;
  });

  /** Les trois postures simples plus « Aucune », dans l'ordre de l'échelle. */
  protected readonly scalePostures = computed(() =>
    SCALE_SLUGS.map((slug) => this.visibleOptions().find((o) => o.slug === slug)).filter((o): o is BolCombatOptionModel => !!o),
  );

  /** Combat à deux armes, attaque au défaut de l'armure : des options qui se cochent, en plus de la posture. */
  protected readonly specialPostures = computed(() => this.visibleOptions().filter((o) => !SCALE_SLUGS.includes(o.slug)));

  /** « Posture offensive » → « Offensive », « Attaque intrépide » → « Intrépide ». */
  protected scaleName(option: BolCombatOptionModel): string {
    const short = option.label.replace(/^(Posture|Attaque) /, '');
    return short.charAt(0).toUpperCase() + short.slice(1);
  }

  /** « att +1 · déf −1 » : le bonus d'attaque du référentiel et l'effet connu sur la défense. */
  protected scaleEffect(option: BolCombatOptionModel): string {
    return `att ${this.signed(option.modificateur)} · déf ${this.signed(POSTURE_DEFENSE[option.slug] ?? 0)}`;
  }

  /** La posture de l'échelle retenue, pour sa liste ; `null` quand c'est une option spéciale (le défaut de l'armure…) qui est cochée. */
  protected readonly postureSlug = computed(() => {
    const slug = this.effectiveOption()?.slug ?? null;
    return slug !== null && SCALE_SLUGS.includes(slug) ? slug : null;
  });

  /** « Options » replié ou déplié ; il se replie à chaque nouveau tour. */
  protected readonly optionsOpen = linkedSignal<string, boolean>({source: () => this.cardKey(), computation: () => false});

  /** Les popovers (options, effets) s'ouvrent sous leur bouton, calées sur son bord gauche ; près du bord droit de l'écran, sur son bord
   * droit ; au-dessus s'il n'y a pas la place en bas. En dernier recours, elles sont poussées dans l'écran (`cdkConnectedOverlayPush`). */
  protected readonly popoverPositions: ConnectedPosition[] = [
    {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6},
    {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6},
    {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6},
    {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6},
  ];
  private readonly optionsButton = viewChild<ElementRef<HTMLButtonElement>>('optionsButton');

  /** Ferme la popover des options et rend le focus à son bouton. */
  protected closeOptions(): void {
    this.optionsOpen.set(false);
    this.optionsButton()?.nativeElement.focus();
  }

  protected onOptionsKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeOptions();
    }
  }

  private readonly effectsButton = viewChild<ElementRef<HTMLButtonElement>>('effectsButton');

  /** Ferme la popover des effets et rend le focus à son bouton. */
  protected closeEffects(): void {
    this.effectsOpen.set(false);
    this.effectsButton()?.nativeElement.focus();
  }

  protected onEffectsKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeEffects();
    }
  }

  /** Les réglages rares actifs, en pastilles sous « Options » replié : ils se voient sans ouvrir le menu, et se retirent d'un clic. */
  protected readonly activeOptions = computed<readonly ActiveOption[]>(() => {
    const active: ActiveOption[] = [];
    const option = this.effectiveOption();
    if (option && !SCALE_SLUGS.includes(option.slug)) {
      active.push({id: 'special', label: option.label});
    }
    const gm = this.gmDie();
    if (gm) {
      active.push({id: 'gm', label: gm === 'bonus' ? 'Dé bonus MJ' : 'Dé malus MJ'});
    }
    if (this.freeModifier() !== 0) {
      active.push({id: 'mod', label: `Modificateur MJ ${this.signed(this.freeModifier())}`});
    }
    const career = this.career();
    if (career) {
      active.push({id: 'career', label: `${career.label} +${career.value} aux ${this.careerOn() === 'attaque' ? 'attaques' : 'dégâts'}`});
    }
    return active;
  });

  protected clearOption(id: ActiveOption['id']): void {
    switch (id) {
      case 'special':
        this.selectOption('none');
        break;
      case 'gm':
        this.gmDie.set(null);
        break;
      case 'mod':
        this.modifierControl.setValue(0);
        break;
      case 'career':
        this.careerLabel.set(null);
        break;
    }
  }

  /** Une option spéciale se coche et se décoche ; décochée, on revient à « Aucune ». */
  protected toggleSpecial(slug: string): void {
    this.selectOption(this.effectiveOption()?.slug === slug ? 'none' : slug);
  }

  protected readonly isDualWieldSelected = computed(() => DUAL_WIELD_SLUGS.has(this.effectiveOption()?.slug ?? ''));

  protected readonly effectiveOffHand = computed(() => {
    const list = this.eligibleOffHandArmes();
    return list.find((a) => a.id === this.selectedOffHandId()) ?? list[0] ?? null;
  });

  /** Ce avec quoi la carte attaque — `null` si une posture à deux armes est choisie sans arme secondaire jouable. */
  private readonly choice = computed<AttackChoice | null>(() => {
    if (this.isDualWieldSelected() && !this.effectiveOffHand()) {
      return null;
    }

    const option = this.effectiveOption();
    const mainDegats = degatsEnMain(this.effectiveArme()?.arme?.degats ?? null, this.deuxMains());
    const offHand = this.effectiveOffHand();
    const degats =
      this.hordeSize() > 0 ? HORDE_DEGATS : option?.slug === 'dual-strike' && offHand ? dualStrikeDegats(mainDegats, offHand.arme?.degats) : mainDegats;

    return {degats, posture: option && option.slug !== 'none' ? option : null};
  });

  // Les clés, pas les objets : la table rechargée repasse des cartes identiques mais neuves, qui ne doivent pas effacer le jet en cours.
  private readonly cardKey = computed(() => this.card().key);
  private readonly targetKey = computed(() => this.target()?.key ?? null);
  private readonly choiceKey = computed(() => {
    const choice = this.choice();
    return choice ? `${this.effectiveArme()?.id ?? ''}|${this.effectiveOffHand()?.id ?? ''}|${choice.degats}|${choice.posture?.slug ?? ''}` : '';
  });

  // ── Étape 3 : le jet d'attaque ──
  /** Un combattant meilleur au tir qu'en mêlée part à distance. */
  private readonly prefersTir = computed(() => {
    const a = this.attacker();
    // Les attaques naturelles d'un démon (griffes, crocs) sont de la mêlée : le tir reste au choix.
    return !!a && a.attaque === null && a.tir > a.melee && this.card().kind !== 'demon';
  });
  /** Mêlée ou tir, quand l'arme permet les deux : repart de la préférence du combattant à chaque nouvelle carte active, pas à chaque
   * relecture de ses statistiques. */
  protected readonly useTir = linkedSignal<{readonly key: string; readonly tir: boolean}, boolean>({
    source: () => ({key: this.cardKey(), tir: this.prefersTir()}),
    computation: (source) => source.tir,
  });
  /** Façons d'utiliser l'arme choisie : mêlée seulement (épée, mains nues), tir seulement (arc, javelot) ou les deux (arme qui se lance :
   * dague, hache, lance, arme improvisée) — la distance ne se choisit que dans ce dernier cas. */
  protected readonly distanceModes = computed<readonly ('melee' | 'tir')[]>(() => {
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
  protected readonly rangeIndex = linkedSignal<string, number>({source: () => this.cardKey(), computation: () => DEFAULT_RANGE_INDEX});
  protected readonly rangeFactors = RANGE_FACTORS;
  /** Le facteur de portée retenu, `null` pour une attaque en mêlée ou celle d'une créature. */
  protected readonly range = computed(() => {
    if (!this.isTir() || this.attacker()?.attaque !== null) {
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

  protected stepRange(delta: number): void {
    this.rangeIndex.update((index) => Math.max(0, Math.min(RANGE_FACTORS.length - 1, index + delta)));
  }

  /** L'attaque se fait à distance : imposée par l'arme quand elle n'a qu'un mode, sinon choisie dans l'assistant. */
  protected readonly isTir = computed(() => {
    const modes = this.distanceModes();
    return modes.length === 1 ? modes[0] === 'tir' : this.useTir();
  });

  /** « Juste une égratignure » lui a coûté cette action : il ne peut que finir son tour. Le MJ peut retirer l'effet pour le laisser agir. */
  protected readonly actionPerdue = computed(() => perdSonAction(this.effets(), this.card().key));
  /** L'attaquant porte l'effet « dé de malus à sa prochaine action » (posé à la main après un renversement, un coup précis…). */
  private readonly malusDieOwed = computed(() => doitUnDeDeMalus(this.effets(), this.card().key));
  /** Dé de bonus ou de malus accordé par le MJ pour cette attaque, selon les circonstances (attaquant ivre, adversaire à terre, arme
   * favorite…) : le jet se fait à 3d6, dont on garde les deux meilleurs ou les deux moins bons (02-actions-combat.md). L'un exclut
   * l'autre. À chaque nouvelle carte active il repart de zéro — ou du dé de malus, si la carte en doit un à sa prochaine action ; il
   * suit aussi cet effet quand on le pose ou qu'on le retire en cours de tour. */
  protected readonly gmDie = linkedSignal<{readonly key: string; readonly malus: boolean}, 'bonus' | 'malus' | null>({
    source: () => ({key: this.cardKey(), malus: this.malusDieOwed()}),
    computation: (source) => (source.malus ? 'malus' : null),
  });
  /** Il attaque avec son arme favorite (avantage « Arme favorite », livre p. 40) : un dé de bonus, sans que le MJ ait à y penser. */
  private readonly avecArmeFavorite = computed(() => estArmeFavorite(this.attacker()?.armeFavorite ?? null, this.effectiveArme()?.arme?.arme ?? null));
  /** Ce que dit l'assistant du dé de l'arme favorite, sous le dé du MJ ; `null` avec une autre arme. */
  protected readonly armeFavoriteNote = computed(() =>
    this.avecArmeFavorite() ? `Arme favorite (${this.attacker()?.armeFavorite}) : dé de bonus avec cette arme.` : null,
  );
  /** Les capacités de l'attaquant qui lui donnent un dé à toutes ses attaques (« Attaque féroce », « Armes améliorées », « Attaque
   * timide »), en clair sous le dé du MJ ; vide sinon. */
  protected readonly abilityDice = computed(() => {
    const a = this.attacker();
    const bonus = a?.attaqueAvantages ?? [];
    const malus = a?.attaqueDesavantages ?? [];
    return [...bonus.map((nom) => `${nom} : dé de bonus`), ...malus.map((nom) => `${nom} : dé de malus`)].join(' · ');
  });
  /** Dés de bonus moins dés de malus (dé du MJ, capacités de l'attaquant) : ils s'annulent un pour un (02-actions-combat.md). */
  private readonly netDice = computed(() => {
    const a = this.attacker();
    const avantages = (this.gmDie() === 'bonus' ? 1 : 0) + (a?.attaqueAvantages?.length ?? 0) + (this.avecArmeFavorite() ? 1 : 0);
    const desavantages = (this.gmDie() === 'malus' ? 1 : 0) + (a?.attaqueDesavantages?.length ?? 0);
    return netDiceModifier(avantages, desavantages);
  });
  /** Nombre de dés du jet d'attaque : deux, plus un par dé de bonus ou de malus qui reste. */
  protected readonly diceCount = computed(() => 2 + Math.abs(this.netDice()));

  /** Les deux dés qui comptent : ceux du lancer, ou les deux gardés quand le MJ a accordé un dé. */
  protected readonly dice = signal<readonly [number, number] | null>(null);
  /** Tous les dés d'un lancer à l'écran à trois dés, pour dire lesquels sont gardés ; `null` sinon. */
  private readonly rolledDice = signal<readonly number[] | null>(null);
  protected readonly rolling = signal(false);

  /** Les chiffres de l'attaquant, en tuiles : attaque, défense et vigueur (sa vitalité est sur son cœur, à côté). La défense montre
   * déjà ce que la posture choisie lui fera jusqu'à son prochain tour. */
  protected readonly attackerTiles = computed<readonly StatTile[]>(() => {
    const stats = this.attacker();
    if (!stats) {
      return [];
    }
    const posture = POSTURE_DEFENSE[this.effectiveOption()?.slug ?? ''] ?? 0;
    return [
      {label: 'Attaque', value: this.signed(attackBonus(stats, this.isTir(), this.brawl())), hint: this.attackHint(stats)},
      {label: 'Défense', value: String(stats.defense + posture), ...(posture !== 0 ? {tone: posture > 0 ? ('up' as const) : ('down' as const)} : {})},
      // Une créature n'ajoute pas sa vigueur aux dégâts : pas de tuile, pour ne pas laisser croire le contraire.
      ...(stats.attaque === null ? [{label: 'Vigueur', value: this.signed(vigueurBonus(stats, this.isTir(), this.unarmed()))}] : []),
    ];
  });

  /** Fiche de la cible choisie : ce qui s'oppose au coup, sa défense et sa protection. */
  protected readonly targetTiles = computed<readonly StatTile[]>(() => {
    const stats = this.targetStats();
    if (!stats) {
      return [];
    }
    const armorIgnored = this.choice()?.posture?.slug === 'armor-chink';
    return [
      {label: 'Défense', value: String(stats.defense)},
      armorIgnored ? {label: 'Armure ignorée', value: '0', tone: 'up'} : protectionTile(stats.protectionText, stats.protection),
    ];
  });

  protected readonly manualTotal = signal<number | null>(null);

  // ── L'héroïsme sur le jet d'attaque (02-actions-combat.md) ──
  /** Points d'héroïsme de l'attaquant ; `null` s'il n'en a pas (PNJ, créature, démon). */
  protected readonly heroisme = computed(() => this.attacker()?.heroisme ?? null);
  /** « 3 points d'héroïsme » de l'attaquant, ou « 3 points de vilénie » d'un rival. */
  /** Les points d'héroïsme (héros) ou de vilénie (rival) de l'attaquant, avec leur titre ; `null` s'il n'en a pas. */
  protected readonly pointsAttaquant = computed(() => pointsAffiches(this.card().kind, this.heroisme()));
  /** Ceux de la cible, de même : un coriace, une piétaille, une créature ou un démon n'en ont pas. */
  protected readonly pointsCible = computed(() => pointsAffiches(this.target()?.kind ?? 'hero', this.targetStats()?.heroisme ?? null));
  /** Échec critique accepté sur un double 1 : rapporte 1 point d'héroïsme. */
  protected readonly critique = signal(false);
  /** Succès légendaire acheté sur un double 6 : deux options au lieu d'une. */
  protected readonly legendary = signal(false);
  /** Coup qui touche transformé en succès héroïque pour 1 point d'héroïsme. */
  protected readonly heroicUpgrade = signal(false);
  /** Les options de succès héroïque choisies pour ce coup : une, ou deux pour un succès légendaire (la même deux fois si on veut). */
  protected readonly picks = signal<readonly HeroicSlug[]>([]);
  /** Faveur divine dépensée : les dés sont à relancer. */
  private readonly favor = signal(false);
  /** Attaques immédiates que la carte doit encore à un Carnage, ce tour-ci. */
  protected readonly carnageOwed = linkedSignal<string, number>({source: () => this.cardKey(), computation: () => 0});
  /** Un Carnage a été pris ce tour : les attaques qu'il donne se font sans dépenser d'héroïsme. */
  private readonly carnageUsed = linkedSignal<string, boolean>({source: () => this.cardKey(), computation: () => false});
  /** Il reste un point d'héroïsme à dépenser sur cette attaque. */
  private readonly canSpend = computed(() => (this.heroisme() ?? 0) > 0 && !this.carnageUsed());

  protected readonly degats = computed(() => this.choice()?.degats ?? this.attacker()?.degats ?? this.card().degats);
  protected readonly postureModifier = computed(() =>
    resolvePostureAttackModifier(this.choice()?.posture ?? null, this.targetStats()?.protection ?? 0),
  );

  /** Ce qui s'ajoute aux deux dés contre la cible choisie : bonus d'attaque − défense + posture + effets en cours. `null` sans cible. */
  protected readonly attackModifier = computed(() => {
    const a = this.attacker();
    const t = this.targetStats();
    if (!a || !t || !this.target()) {
      return null;
    }
    return computeAttackTotal(0, attackBonus(a, this.isTir(), this.brawl()), t.defense, sommeModificateurs(this.effectTerms()), this.legendaryBonus() ? 1 : 0, this.postureModifier());
  });

  /** Ce qu'il faut aux dés pour toucher la cible choisie, et les chances. */
  protected readonly attackGoal = computed<AttackGoal | null>(() => {
    const modifier = this.attackModifier();
    return modifier === null ? null : this.goalFor(modifier);
  });

  private goalFor(modifier: number): AttackGoal {
    const net = this.netDice();
    const chance = Math.round(actionSuccessChance(net, modifier, ATTACK_THRESHOLD) * 100);
    const label = actionDiceTargetLabel(actionDiceTarget(modifier, ATTACK_THRESHOLD));
    // Avec le dé du MJ, le total à atteindre se lit sur les deux dés gardés.
    const small = net !== 0 && label.small === 'aux dés' ? this.keptCaption() : label.small;
    return {big: label.big, small, chance};
  }

  /** Lesquels des trois dés comptent : « 2 meilleurs » ou « 2 moins bons » ; « dés » pour un jet à deux dés. */
  private keptCaption(): string {
    const net = this.netDice();
    return net > 0 ? '2 meilleurs' : net < 0 ? '2 moins bons' : 'dés';
  }

  /** De quoi est fait le bonus d'attaque, en infobulle sur sa tuile : « Agilité +2, équipement −3, mêlée +2 ». */
  private attackHint(a: ResolvedCombatStats): string {
    if (a.attaque !== null) {
      return 'Attaque de la créature, tout compris';
    }
    const equipement = a.equipementAgilite ?? 0;
    const term = (value: number): string => (value === 0 ? '0' : signedTerm(value));
    const parts = this.brawl()
      ? [`Vigueur ${term(a.vigueur)} (bagarre)`]
      : [`Agilité ${term(a.agilite - equipement)}`, ...(equipement !== 0 ? [`équipement ${term(equipement)}`] : [])];
    parts.push(this.isTir() ? `tir ${term(a.tir)}` : `mêlée ${term(a.melee)}`);
    return parts.join(', ');
  }

  /** Les dés au-dessus de la case du jet d'attaque : ceux lancés à l'écran (les dés écartés par un dé de bonus ou de malus estompés), ou
   * un double 1 ou double 6 tapé ; `null` sinon (la ligne montre alors le total tapé, ou des places vides). */
  protected readonly attackRowDice = computed<readonly DiceRowDie[] | null>(() => {
    const all = this.rolledDice();
    if (all) {
      const kept = keptDiceIndexes(all, this.netDice());
      return all.map((value, index) => ({value, dropped: !kept.includes(index)}));
    }
    const pair = this.naturalDice();
    return pair ? [{value: pair[0]}, {value: pair[1]}] : null;
  });

  /** Sur le jeton de chaque carte visable, ce qu'il faut pour la toucher avec l'arme et la posture choisies : « 6+ · 72 % ». Absent tant
   * que ses statistiques ne sont pas connues. */
  /** Ce qu'est chaque cible à choisir, en clair (« PNJ · Rival », « Créature · Coriace ») ; vide pour un héros de la compagnie. */
  protected readonly targetDetails = computed<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(this.targets().map((t) => [t.key, sideOf(t).detail])),
  );
  protected readonly odds = computed<Readonly<Record<string, string>>>(() => {
    const a = this.attacker();
    const odds: Record<string, string> = {};
    if (!a) {
      return odds;
    }
    const selected = this.target()?.key;
    for (const card of this.targets()) {
      const stats = this.targetsStats().get(card.key);
      // La cible choisie reprend le calcul du plateau, modificateurs figés compris.
      const modifier =
        card.key === selected
          ? this.attackModifier()
          : stats
            ? computeAttackTotal(
                0,
                attackBonus(a, this.isTir(), this.brawl()),
                stats.defense,
                sommeModificateurs(modificateursPour(this.effets(), {jet: 'attaque', attaquant: this.card().key, cible: card.key, bouclier: stats.bouclierMalusUneAttaque, bouclierToutes: stats.bouclierDefenseToutes})) +
                  sommeModificateurs(this.extraAttackTerms()),
                this.legendaryBonus() ? 1 : 0,
                resolvePostureAttackModifier(this.choice()?.posture ?? null, stats.protection),
              )
            : null;
      if (modifier !== null) {
        const goal = this.goalFor(modifier);
        odds[card.key] = `${goal.big} · ${goal.chance} %`;
      }
    }
    return odds;
  });

  /** L'addition du jet d'attaque, sur une ligne : un nombre par terme, son nom dessous. Les termes nuls sont omis. Avant le jet elle
   * s'ouvre sur « 2d6 » et se ferme sur le seuil ; après, sur le total des dés et le total du jet. */
  protected readonly attackSum = computed<readonly TraySumTerm[]>(() => {
    const a = this.attacker();
    const t = this.targetStats();
    if (!a || !t) {
      return [];
    }
    const dice = this.diceSum();
    const terms: TraySumTerm[] = [{value: dice === null ? `${this.diceCount()}d6` : `${dice}`, caption: this.keptCaption(), tone: 'dice'}];
    const add = (value: number, caption: string): void => {
      if (value !== 0) {
        terms.push({value: signedTerm(value), caption, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    if (a.attaque !== null) {
      add(a.attaque, 'attaque');
    } else {
      if (this.brawl()) {
        add(a.vigueur, 'vig');
      } else {
        // L'agilité de la fiche, puis le malus de l'équipement, comme sur le jet d'action.
        const equipement = a.equipementAgilite ?? 0;
        add(a.agilite - equipement, 'agi');
        add(equipement, 'équipement');
      }
      add(this.isTir() ? a.tir : a.melee, this.isTir() ? 'tir' : 'mêlée');
    }
    add(-t.defense, 'défense');
    add(this.postureModifier(), 'posture');
    add(this.legendaryBonus() ? 1 : 0, 'légendaire');
    terms.push(...this.effectTerms().map((term) => this.sumTermOf(term)));
    const total = this.total();
    terms.push(total === null ? {value: `≥ ${ATTACK_THRESHOLD}`, caption: 'seuil', tone: 'total'} : {value: `= ${total}`, caption: `pour ${ATTACK_THRESHOLD}`, tone: 'total'});
    return terms;
  });

  /** Un modificateur du registre (« − 1 bouclier (Krongar) ») en terme d'addition : sa valeur, puis son nom dessous. */
  private sumTermOf(term: ModifierTerm): TraySumTerm {
    return {value: signedTerm(term.valeur), caption: term.label.replace(/^[+−] \d+ /, ''), tone: term.tone, ...(term.effetId ? {effetId: term.effetId} : {})};
  }

  /** Clé → nom des deux duellistes : une puce dit à qui est l'effet. */
  private readonly noms = computed<Readonly<Record<string, string>>>(() => {
    const target = this.target();
    return {[this.card().key]: this.card().nom, ...(target ? {[target.key]: target.nom} : {})};
  });

  /** « Effets » replié ou déplié ; il se replie à chaque nouveau tour. */
  protected readonly effectsOpen = linkedSignal<string, boolean>({source: () => this.cardKey(), computation: () => false});

  /** Le nombre d'effets en cours sur l'attaquant et sa cible : le compteur du bouton « Effets ». */
  protected readonly effetsCount = computed(() => {
    const keys = new Set(this.duelistes().map((d) => d.key));
    return this.effets().filter((effet) => keys.has(effet.porteur)).length;
  });

  /** Les deux duellistes, pour nommer à qui appartient un effet et à qui l'ajouter. */
  protected readonly duelistes = computed(() => {
    const target = this.target();
    return [{key: this.card().key, nom: this.card().nom}, ...(target ? [{key: target.key, nom: target.nom}] : [])];
  });

  private badgesDe(key: string | undefined): readonly string[] {
    return key
      ? this.effets()
          .filter((effet) => effet.porteur === key && effet.valeur !== 0)
          .map((effet) => `${descriptionEffet(effet)} · ${libelleDuree(effet.duree)}`)
      : [];
  }
  protected readonly targetBadges = computed(() => this.badgesDe(this.target()?.key));

  /** L'addition du jet de dégâts : le dé de l'arme, la vigueur, le coup dévastateur, la protection de la cible (elle se clique pour la
   * saisir), les effets en cours, puis la fourchette des dégâts — et, le dé tombé, leur total. */
  protected readonly damageSum = computed<readonly TraySumTerm[]>(() => {
    const spec = this.damageSpec();
    const face = this.face();
    const add = (value: number, caption: string): void => {
      if (value !== 0) {
        terms.push({value: signedTerm(value), caption, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    const terms: TraySumTerm[] = [];
    if (spec === null) {
      // Dégâts spéciaux : le total tapé, tel quel.
      terms.push({value: this.raw() === null ? '?' : `${this.raw()}`, caption: 'spécial', tone: 'dice'});
    } else if (spec.fixed !== null) {
      terms.push({value: `${spec.fixed}`, caption: 'fixes', tone: 'dice'});
    } else {
      terms.push({value: face === null ? this.degats() : `${face}`, caption: 'dé', tone: 'dice'});
      if (spec.multiplier > 1) {
        terms.push({value: `×${spec.multiplier}`, caption: 'taille', tone: 'plus'});
      }
      add(spec.modifier, 'profil');
    }
    add(this.vigueur(), 'vigueur');
    add(devastatingBonus(this.devastating()), this.devastating() > 1 ? `dévastateur ×${this.devastating()}` : 'dévastateur');
    if (this.choice()?.posture?.slug === 'armor-chink') {
      terms.push({value: '0', caption: 'armure ignorée', tone: 'dice'});
    } else {
      const protection = this.protection();
      const source = this.protectionManual() !== null ? ' (saisie)' : this.protectionFace() !== null ? ` (dé ${this.protectionFace()})` : '';
      // Toujours affichée, même à 0 : c'est elle qu'on clique pour saisir une valeur.
      terms.push({value: protection === 0 ? '0' : signedTerm(-protection), caption: `protection${source}`, tone: 'minus', editable: true});
    }
    terms.push(...this.damageEffectTerms().map((term) => this.sumTermOf(term)));
    const damage = this.damage();
    if (damage === null && spec === null) {
      terms.push({value: '?', caption: 'dégâts', tone: 'total'});
    } else if (damage === null && spec !== null) {
      const [min, max] = damageRange(spec, this.vigueur(), this.effectiveProtection(), this.devastating());
      terms.push({value: min === max ? `${min}` : `${min} à ${max}`, caption: 'dégâts', tone: 'total'});
    } else {
      terms.push({value: `= ${damage}`, caption: 'dégâts', tone: 'total'});
    }
    return terms;
  });

  /** Total des dés : lancés ici, ou saisis à la main (total à table, de 2 à 12). */
  protected readonly diceSum = computed(() => {
    const d = this.dice();
    if (d) {
      return d[0] + d[1];
    }
    return this.manualTotal();
  });

  /** Les modificateurs du registre pour ce jet, tels qu'ils sont au moment où on les lit. */
  private readonly liveTerms = computed<readonly ModifierTerm[]>(() => {
    const t = this.targetStats();
    const target = this.target();
    return target
      ? modificateursPour(this.effets(), {jet: 'attaque', attaquant: this.card().key, cible: target.key, bouclier: t?.bouclierMalusUneAttaque ?? 0, bouclierToutes: t?.bouclierDefenseToutes ?? 0, noms: this.noms()})
      : [];
  });

  /** Modificateurs figés au premier jet de cette attaque : la cible est ensuite marquée « attaquée » (son bouclier tombe du registre), mais un
   * jet relancé garde les siens. */
  private readonly frozenTerms = signal<readonly ModifierTerm[] | null>(null);
  protected readonly effectTerms = computed(() => [...(this.frozenTerms() ?? this.liveTerms()), ...this.extraAttackTerms()]);

  /** Les modificateurs du registre pour le jet de dégâts (effets de dégâts de l'attaquant, protection de la cible), figés comme ceux de
   * l'attaque : un effet à usage limité consommé par le jet d'attaque compte encore pour ses dégâts. */
  private readonly liveDamageTerms = computed<readonly ModifierTerm[]>(() => {
    const target = this.target();
    return target ? modificateursPour(this.effets(), {jet: 'degats', attaquant: this.card().key, cible: target.key, bouclier: 0, bouclierToutes: 0, noms: this.noms()}) : [];
  });
  private readonly frozenDamageTerms = signal<readonly ModifierTerm[] | null>(null);
  private readonly damageEffectTerms = computed(() => [...(this.frozenDamageTerms() ?? this.liveDamageTerms()), ...this.extraDamageTerms()]);

  protected readonly total = computed(() => {
    const sum = this.diceSum();
    const a = this.attacker();
    const t = this.targetStats();
    if (sum === null || !a || !t) {
      return null;
    }
    return computeAttackTotal(
      sum,
      attackBonus(a, this.isTir(), this.brawl()),
      t.defense,
      sommeModificateurs(this.effectTerms()),
      this.legendaryBonus() ? 1 : 0,
      this.postureModifier(),
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
    return result === 'heroique' && !this.heroicAllowed() ? 'reussite' : result;
  });

  /** Le résultat retenu, une fois les choix d'héroïsme faits. */
  protected readonly verdict = computed(() => {
    const base = this.baseResult();
    if (base === null) {
      return null;
    }
    const result: InitiativeResultat =
      base === 'echec' && this.critique() ? 'echec_critique' : base === 'heroique' && this.legendary() ? 'legendaire' : base === 'reussite' && this.heroicUpgrade() ? 'heroique' : base;
    return {result, hit: result === 'reussite' || result === 'heroique' || result === 'legendaire'};
  });

  /** Faveur divine : 1 point d'héroïsme pour relancer un coup raté — plus une fois l'échec critique accepté. */
  protected readonly canFavor = computed(() => this.verdict()?.result === 'echec' && this.canSpend());
  /** Un héros qui sort un double 1 peut en faire un échec critique, qui lui rapporte 1 point d'héroïsme. */
  // Accepter un échec critique rapporte un point au joueur : un rival n'en gagne pas de vilénie.
  protected readonly canCritique = computed(() => this.card().kind === 'hero' && this.heroisme() !== null && this.isNatural2() && this.baseResult() === 'echec');
  /** Seul le double 6 qui vaut succès héroïque se transforme en succès légendaire. */
  protected readonly canLegendary = computed(() => this.heroisme() !== null && this.baseResult() === 'heroique' && (this.legendary() || this.canSpend()));
  /** Un coup qui touche, sans plus, se transforme en succès héroïque. */
  protected readonly canUpgrade = computed(() => this.heroisme() !== null && this.baseResult() === 'reussite' && (this.heroicUpgrade() || this.canSpend()));
  /** Nombre d'options de succès héroïque à choisir pour ce coup. */
  protected readonly picksMax = computed(() => heroicPicksAllowed(this.verdict()?.result ?? 'echec'));
  /** Combien de fois chaque option est prise. */
  protected readonly pickCounts = computed(() => {
    const counts: Partial<Record<HeroicSlug, number>> = {};
    for (const pick of this.picks()) {
      counts[pick] = (counts[pick] ?? 0) + 1;
    }
    return counts;
  });
  /** Le coup se conclut sur un Carnage : une nouvelle attaque suit, le tour ne finit pas. */
  protected readonly carnagePicked = computed(() => this.picks().includes('carnage'));

  /** Le verdict en clair : touché ou raté, et de combien. Un double 1 rate et un double 6 touche quel que soit le total. */
  protected readonly attackVerdict = computed<AttackVerdict | null>(() => {
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

  // ── Étape 4 : les dégâts ──
  protected readonly damageValues = signal<readonly number[] | null>(null);
  /** Le dé de dégâts a été lancé à l'écran (ses faces sont connues), pas tapé à table. */
  private readonly damageRolled = signal(false);
  /** Les dégâts de l'arme ou du profil, lus en entier (dé, multiplicateur, modificateur, ou valeur fixe) ; `null` pour des dégâts
   * spéciaux, dont le MJ tape le total. */
  protected readonly damageSpec = computed(() => parseDamage(this.degats()));
  protected readonly die = computed<DamageDie>(() => this.damageSpec()?.die ?? 'd6');
  /** Dégâts spéciaux : pas de dé à proposer, le total se tape. */
  protected readonly specialDamage = computed(() => this.damageSpec() === null);
  /** Dégâts fixes : pas de jet, ils sont connus dès que le coup touche. */
  protected readonly fixedDamage = computed(() => this.damageSpec()?.fixed ?? null);
  /** Le dé de protection de la cible, lu sur son armure (« d6-1(3) » → un d6 moins 1), avec le bonus d'un casque ou de Peau dure
   * (« d6-1 (3) +2 ») ; `null` sans dé. */
  protected readonly protectionDie = computed<{readonly malus: number; readonly bonus: number} | null>(() => {
    const text = this.targetStats()?.protectionText ?? '';
    // « d6-1 (3) » : un d6 moins 1 ; « d6 (4) » : un d6 sans retrait (certaines créatures).
    const match = text.match(/d6\s*(?:-\s*(\d+))?/i);
    return match ? {malus: Number(match[1] ?? 0), bonus: Number(text.match(/\)\s*\+(\d+)/)?.[1] ?? 0)} : null;
  });
  /** Face du dé de protection lancé à la place de la valeur fixe (le livre laisse le choix au MJ) ; `null` : valeur fixe. */
  protected readonly protectionFace = signal<number | null>(null);
  /** Valeur de protection saisie à la main (clic sur la puce) ; prime sur le dé et sur la valeur fixe. */
  protected readonly protectionManual = signal<number | null>(null);
  protected readonly editingProtection = signal(false);
  protected readonly protectionDraft = signal('');
  private readonly protectionInput = viewChild<ElementRef<HTMLInputElement>>('protectionInput');
  private readonly injector = inject(Injector);
  private readonly dialog = inject(MatDialog);
  protected readonly protection = computed(() => {
    if (this.choice()?.posture?.slug === 'armor-chink') {
      return 0;
    }
    const manual = this.protectionManual();
    if (manual !== null) {
      return manual;
    }
    const die = this.protectionDie();
    const face = this.protectionFace();
    return die && face !== null ? Math.max(0, face - die.malus) + die.bonus : (this.targetStats()?.protection ?? 0);
  });
  /** La vigueur ajoutée aux dégâts ; aucune pour une horde, dont les d6M sont les dégâts du groupe. */
  protected readonly vigueur = computed(() => {
    const a = this.attacker();
    return a && this.hordeSize() === 0 ? vigueurBonus(a, this.isTir(), this.unarmed()) : 0;
  });
  /** Nombre de coups dévastateurs pris : +6 dégâts chacun. */
  protected readonly devastating = computed(() => this.pickCounts().devastateur ?? 0);

  /** Ce qu'a donné le dé de dégâts, avant multiplicateur et modificateur ; `null` avant le jet. */
  protected readonly face = computed(() => {
    const values = this.damageValues();
    return values && this.damageSpec() !== null ? rawDamage(this.die(), values) : null;
  });
  /** Les dégâts bruts, avant la vigueur et la protection : la valeur fixe, le dé multiplié et modifié, ou le total tapé (dégâts
   * spéciaux). */
  protected readonly raw = computed(() => {
    const spec = this.damageSpec();
    if (spec === null) {
      return this.damageValues()?.[0] ?? null;
    }
    if (spec.fixed !== null) {
      return spec.fixed;
    }
    const face = this.face();
    return face === null ? null : scaleDamage(spec, face);
  });
  /** Ce que les dés ont donné quand l'arme en lance deux : « 1 et 4 → 1 retenu (le moins bon) ». Vide pour un dé unique ou une saisie à table. */
  /** Les dés au-dessus de la case des dégâts : ceux lancés à l'écran (pour un d6M ou un d6B, celui qui n'est pas retenu estompé) ; `null`
   * pour un dé tapé à table, montré par son total. */
  protected readonly damageRowDice = computed<readonly DiceRowDie[] | null>(() => {
    const values = this.damageValues();
    const die = this.die();
    if (!values || !this.damageRolled()) {
      return null;
    }
    if (values.length === 2 && (die === 'd6m' || die === 'd6b')) {
      const kept = values.indexOf(die === 'd6m' ? Math.min(...values) : Math.max(...values));
      return values.map((value, index) => ({value, dropped: index !== kept}));
    }
    return values.map((value) => ({value}));
  });
  protected readonly damageRowTotal = computed(() => (this.damageRolled() ? null : this.specialDamage() ? this.raw() : this.face()));
  protected readonly damageSlots = computed(() => damageDiceCount(this.die()));
  /** Ce qui se retranche vraiment des dégâts : un modificateur positif des effets ajoute aux dégâts, il se retranche de la protection. */
  private readonly effectiveProtection = computed(() => this.protection() - sommeModificateurs(this.damageEffectTerms()));
  protected readonly damage = computed(() => {
    const raw = this.raw();
    return raw === null ? null : finalDamage(raw, this.vigueur(), this.effectiveProtection(), this.devastating());
  });
  /** Ce que rapporte le dé de dégâts, à côté de sa case : « d6M : le moins bon de deux d6 », « d6Bx2 : le meilleur de deux d6, multiplié
   * par 2 ». */
  protected readonly dieNote = computed(() => {
    const spec = this.damageSpec();
    if (spec === null) {
      return `${this.degats()} : voir la fiche, et tape le total`;
    }
    if (spec.fixed !== null) {
      return `${this.degats()} : dégâts fixes, sans jet`;
    }
    const times = spec.multiplier > 1 ? `, multiplié par ${spec.multiplier}` : '';
    const plus = spec.modifier !== 0 ? `, ${signedTerm(spec.modifier)}` : '';
    return `${this.degats()} : ${DIE_NOTES[this.die()]}${times}${plus}`;
  });
  protected readonly hasDamageStep = computed(() => !!this.verdict()?.hit && !this.picks().includes('desarmement'));
  /** Plus grand nombre à taper dans la case des dégâts : la face du dé (3 pour un d3, 6 sinon), ou le total de dégâts spéciaux. */
  protected readonly damageMax = computed(() => (this.specialDamage() ? 99 : damageDieMax(this.die())));

  /** Le dernier coup appliqué par cette carte : il reste affiché sur le plateau tant qu'un nouveau jet n'est pas fait. */
  protected readonly lastHit = linkedSignal<string, AppliedHit | null>({source: () => this.cardKey(), computation: () => null});

  /** La vie de la cible choisie, en chiffres : ce qu'il lui reste, et où le coup en cours la fait tomber (`after`, `null` sans dégâts). */
  protected readonly targetLife = computed(() => {
    const target = this.target();
    const current = target?.vitaliteCourante ?? null;
    const damage = this.damage();
    // Une bagarre à mains nues ne fait pas passer sous 0 : la cible est assommée.
    const after = current !== null && damage !== null && damage > 0 ? (this.unarmed() ? Math.min(current, Math.max(0, current - damage)) : current - damage) : null;
    return {current, max: target?.vitaliteMax ?? null, after, loss: after === null || current === null ? 0 : current - after, out: after !== null && after <= 0};
  });

  /** Où en sont les trois cases — qui, l'attaque, les dégâts : celle où il faut agir s'allume. Quand il ne reste qu'à finir le tour, c'est
   * la case des dégâts, qui porte « Fin du tour » ; après des dégâts appliqués, une nouvelle attaque reste possible dans la case 2. */
  protected readonly stations = computed<readonly [StationState, StationState, StationState]>(() => {
    // Action perdue : seule la case d'attaque, qui le dit, est allumée.
    if (this.actionPerdue()) {
      return ['todo', 'cur', 'todo'];
    }
    const aimed = this.target() !== null;
    const rolled = this.attackVerdict() !== null;
    // « Fin du tour » est dans la case des dégâts (coup raté, désarmement, dégâts appliqués sans Carnage à suivre) : elle reste allumée,
    // même quand la cible, tombée sous le coup, n'est plus à viser.
    const endsHere = (aimed && rolled && !this.hasDamageStep()) || (!rolled && this.lastHit() !== null && this.carnageOwed() === 0);
    return [
      aimed || endsHere ? 'done' : 'cur',
      endsHere || (aimed && rolled) ? 'done' : aimed ? 'cur' : 'todo',
      this.hasDamageStep() || endsHere ? 'cur' : rolled || this.lastHit() ? 'done' : 'todo',
    ];
  });

  /** Ce qu'il y a à faire maintenant, en une phrase ; `step` est le numéro de la case concernée, vide quand il ne reste qu'à conclure. */
  protected readonly nextStep = computed<{readonly step: string; readonly text: string}>(() => {
    if (this.actionPerdue()) {
      return {step: '', text: `Juste une égratignure : se remettre du coup coûte son action à ${this.card().nom}. Il ne reste qu’à finir son tour.`};
    }
    const target = this.target();
    // Les dégâts sont appliqués et rien ne suit : il ne reste qu'à finir le tour, même si la cible est tombée.
    if (!target && this.lastHit() && this.carnageOwed() === 0) {
      return {step: '', text: `${this.lastHit()?.parried ? 'Coup paré' : 'Dégâts appliqués'}. Il ne reste qu’à finir le tour.`};
    }
    if (!target) {
      return this.targets().length === 0
        ? {step: '', text: 'Plus personne à viser en face : le combat peut se terminer.'}
        : {step: '1', text: `Choisis qui ${this.card().nom} attaque.`};
    }
    const verdict = this.attackVerdict();
    if (!verdict && this.favor()) {
      return {step: '2', text: 'Faveur divine : relance tous les dés d’attaque, puis tape le nouveau total — ou lance-les à l’écran.'};
    }
    if (!verdict && this.carnageOwed() > 0) {
      return {step: '2', text: `Carnage : ${this.card().nom} attaque de nouveau tout de suite, sans dépenser d’héroïsme. Garde la cible ou changes-en, puis tape le total.`};
    }
    if (!verdict) {
      return this.lastHit()
        ? {step: '', text: `${this.lastHit()?.parried ? 'Coup paré' : 'Dégâts appliqués'}. Il ne reste qu’à finir le tour, ou à lancer une nouvelle attaque.`}
        : {step: '2', text: this.netDice() !== 0 ? `Tape le total des deux dés gardés (les ${this.keptCaption()} de ${this.diceCount()}d6), ou lance-les à l’écran.` : 'Tape le total des deux dés d’attaque, ou lance-les à l’écran.'};
    }
    if (!this.hasDamageStep()) {
      return verdict.tone !== 'echec' && this.carnagePicked()
        ? {step: '', text: 'Désarmement. Valide-le pour enchaîner sur l’attaque du Carnage.'}
        : {step: '', text: `${verdict.tone === 'echec' ? 'Raté' : 'Désarmement'}. Il ne reste qu’à finir le tour.`};
    }
    const damage = this.damage();
    const toPick = this.picksMax() - this.picks().length;
    if (damage === null && toPick > 0) {
      return {step: '2', text: `Choisis ${toPick > 1 ? 'les deux options' : 'l’option'} du coup ${this.picksMax() > 1 ? 'légendaire' : 'héroïque'}, puis tape le dé de dégâts (${this.dieNote()}).`};
    }
    return damage === null
      ? {step: '3', text: `Tape le dé de dégâts (${this.dieNote()}), ou lance-le à l’écran.`}
      : {step: '', text: `Entrée applique ${damage} ${damage > 1 ? 'dégâts' : 'dégât'} à ${target.nom}.`};
  });

  // Les cases et boutons du plateau, pour passer la main de l'un à l'autre au fil de la saisie.
  private readonly attackInput = viewChild<ElementRef<HTMLInputElement>>('attackInput');
  private readonly scratchInput = viewChild<ElementRef<HTMLInputElement>>('scratchInput');
  private readonly damageInput = viewChild<ElementRef<HTMLInputElement>>('damageInput');
  private readonly applyButton = viewChild('applyButton', {read: ElementRef<HTMLButtonElement>});
  private readonly endButton = viewChild('endButton', {read: ElementRef<HTMLButtonElement>});
  /** Une cible vient d'être choisie : la case du jet d'attaque prend la main dès qu'elle est à l'écran. */
  private attackFocusWanted = false;

  constructor() {
    effect(() => this.choiceChanged.emit(this.choice()));
    effect(() => this.hordeChanged.emit(this.horde().map((card) => card.key)));

    this.bindVitalite(this.vitaliteControl, () => this.card());
    this.bindVitalite(this.targetVitaliteControl, () => this.target());

    // Un autre attaquant, une autre cible, un autre choix ou un dé du MJ accordé ou retiré : le jet précédent ne vaut plus. Le choix est comparé par sa valeur : la table
    // rechargée (enregistrement de l'état du combat) en refait un objet identique, qui ne doit pas effacer le jet en cours.
    effect(() => {
      this.cardKey();
      this.targetKey();
      this.choiceKey();
      this.gmDie();
      this.brawl();
      untracked(() => this.resetRoll());
    });

    // Une nouvelle carte active : le modificateur libre repart de 0.
    effect(() => {
      this.cardKey();
      untracked(() => this.modifierControl.setValue(0));
    });

    // La case du jet d'attaque n'existe qu'une fois les statistiques de la cible lues : elle prend la main à ce moment-là.
    effect(() => {
      const input = this.attackInput();
      if (input && this.attackFocusWanted) {
        this.attackFocusWanted = false;
        input.nativeElement.focus();
      }
    });
  }

  /** Lie un cœur de vitalité à une carte : il reprend sa valeur à chaque rechargement de la table, et chaque correction faite dessus
   * est signalée à la page, d'un pas à la fois (deux clics rapides valent deux pas de 1, pas 1 puis 2). */
  private bindVitalite(control: FormControl<number>, card: () => TapisCard | null): void {
    const tracker = new ValueTracker();
    effect(() => {
      const value = card()?.vitaliteCourante ?? 0;
      tracker.reset(value);
      if (value !== control.value) {
        control.setValue(value, {emitEvent: false});
      }
    });
    control.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const current = untracked(card);
      const delta = tracker.take(value);
      if (current && delta !== 0) {
        this.vitaliteAdjusted.emit({card: current, delta});
      }
    });
  }

  /** La cible choisie dans la liste : la même ne change rien. */
  protected pickTarget(key: string | null): void {
    const card = this.targets().find((t) => t.key === key);
    if (card && card.key !== this.target()?.key) {
      this.selectTarget(card);
    }
  }

  /** Vise une carte — ou, si c'est déjà la cible, y renonce. */
  protected selectTarget(card: TapisCard): void {
    const same = this.target()?.key === card.key;
    this.attackFocusWanted = !same;
    this.targetSelected.emit(same ? null : card);
  }

  /** Donne la main à un élément du plateau une fois l'écran à jour (il n'existe parfois qu'après le rendu). */
  private focusAfterRender(element: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => element()?.nativeElement.focus(), {injector: this.injector});
  }

  /** Accorde le dé de bonus ou de malus du MJ pour cette attaque ; un second clic sur le même le retire. */
  protected toggleGmDie(kind: 'bonus' | 'malus'): void {
    this.gmDie.update((current) => (current === kind ? null : kind));
  }

  protected selectArme(id: number | undefined): void {
    if (id !== undefined && this.heavyForbidden().has(id)) {
      return;
    }
    this.selectedArmeId.set(id ?? null);
  }

  protected toggleCareer(label: string): void {
    this.careerLabel.update((current) => (current === label ? null : label));
  }

  protected toggleBrawl(): void {
    this.brawlChosen.update((on) => !on);
  }

  protected toggleDeuxMains(): void {
    if (this.deuxMainsInterdit() !== null) {
      return;
    }
    this.deuxMainsChoisi.update((on) => !on);
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

  protected async roll(): Promise<void> {
    if (this.rolling()) {
      return;
    }
    this.manualTotal.set(null);
    this.clearHeroism(true);
    this.damageValues.set(null);
    this.dice.set(null);
    this.lastHit.set(null);
    this.markAttacked();
    const net = this.netDice();
    const count = this.diceCount();
    const values = await this.throwDice(`${count}d6`, count);
    this.rolledDice.set(count > 2 ? values : null);
    this.dice.set(keepBestOrWorstTwo(values, net));
    this.focusAfterRender(() => (this.hasDamageStep() ? (this.damageInput() ?? this.applyButton()) : this.endButton()));
  }

  /** Retire les dés restés sur la table une fois le lancer terminé (un clic n'importe où sur l'écran de combat). */
  dismissDice(): void {
    if (!this.rolling()) {
      void this.diceBox()?.clear();
    }
  }

  /** Lance `count` d6 sur le plateau 3D (ou au hasard s'il est absent ou échoue) et renvoie leurs valeurs. */
  private async throwDice(notation: string, count: number): Promise<number[]> {
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

  /** Saisie du total des deux dés lancés à table. De 2 à 9 un chiffre suffit : le jet est pris tout de suite, et la main passe au dé de
   * dégâts s'il touche, à « Fin du tour » sinon. Une case vidée efface le jet. */
  protected onAttackInput(raw: string): void {
    if (raw.trim() === '') {
      if (this.diceSum() !== null) {
        this.dice.set(null);
        this.manualTotal.set(null);
        this.clearHeroism(true);
        this.damageValues.set(null);
      }
      return;
    }
    const total = parseDiceTotal(raw);
    if (total === null) {
      return;
    }
    this.dice.set(null);
    this.rolledDice.set(null);
    this.clearHeroism(true);
    this.damageValues.set(null);
    this.lastHit.set(null);
    this.manualTotal.set(total);
    this.markAttacked();
    this.focusAfterRender(() => (this.hasDamageStep() ? (this.damageInput() ?? this.applyButton()) : this.endButton()));
  }

  /** En quittant une case, une saisie laissée incomplète ou hors bornes cède la place à la valeur retenue. */
  protected restoreInput(input: HTMLInputElement, value: number | null): void {
    input.value = value === null ? '' : `${value}`;
  }

  /** Le MJ retire un effet : le registre l'oublie, et le jet déjà fait (modificateurs figés) perd sa puce et recalcule son total. */
  protected removeEffect(id: string): void {
    this.frozenTerms.update((termes) => (termes ? sansTerme(termes, id) : termes));
    this.frozenDamageTerms.update((termes) => (termes ? sansTerme(termes, id) : termes));
    this.effectRemoved.emit(id);
  }

  /** Premier jet contre cette cible : fige les modificateurs et signale l'attaque au registre. */
  private markAttacked(): void {
    const target = this.target();
    if (!target || this.frozenTerms() !== null) {
      return;
    }
    this.frozenTerms.set(this.liveTerms());
    this.frozenDamageTerms.set(this.liveDamageTerms());
    // Une feinte tentée se note sur la cible : retentée contre elle, elle sera signalée.
    const career = this.career();
    if (career && !aDejaFeinte(this.effets(), target.key, this.card().key)) {
      this.feintNoted.set(true);
      this.effectAdded.emit(effetFeinte(target.key, this.card().key, career.label));
    }
    this.attackRolled.emit(target);
  }

  /** Saisie du dé de dégâts lancé à table : un chiffre, pris tout de suite. Un d6 de malus ou de bonus garde le dé retenu (on saisit
   * celui-là), un d3 se lit tel quel. La main passe ensuite au bouton qui applique. */
  protected onDamageInput(raw: string): void {
    this.damageRolled.set(false);
    const text = raw.trim();
    if (text === '') {
      this.damageValues.set(null);
      return;
    }
    const value = Number(text);
    if (this.specialDamage()) {
      // Dégâts spéciaux : le total, tel que le profil le décrit.
      if (/^\d{1,2}$/.test(text)) {
        this.damageValues.set([value]);
      }
      return;
    }
    if (!/^[1-6]$/.test(text) || value > this.damageMax()) {
      return;
    }
    // `rawDamage` lit un d3 comme un d6 divisé par deux : 2n − 1 redonne n.
    const face = this.die() === 'd3' ? 2 * value - 1 : value;
    this.damageValues.set(Array.from({length: damageDiceCount(this.die())}, () => face));
    this.focusAfterRender(() => this.applyButton());
  }

  /** Ouvre la saisie de la protection : le champ remplace la puce, prérempli avec la valeur courante. */
  protected startEditProtection(): void {
    this.protectionDraft.set(String(this.protection()));
    this.editingProtection.set(true);
    afterNextRender(
      () => {
        const input = this.protectionInput()?.nativeElement;
        input?.focus();
        input?.select();
      },
      {injector: this.injector},
    );
  }

  /** Entrée : valide un entier positif ou nul ; une saisie invalide referme le champ sans rien changer. */
  protected commitProtection(): void {
    const value = Number(this.protectionDraft());
    if (this.protectionDraft().trim() !== '' && Number.isInteger(value) && value >= 0) {
      this.protectionManual.set(value);
      this.protectionFace.set(null);
    }
    this.editingProtection.set(false);
  }

  protected resetProtection(): void {
    this.protectionManual.set(null);
    this.protectionFace.set(null);
  }

  /** Lance le dé de protection de la cible : son résultat remplace la valeur fixe pour ce coup. */
  protected async rollProtection(): Promise<void> {
    if (this.rolling() || !this.protectionDie()) {
      return;
    }
    const [face] = await this.throwDice('1d6', 1);
    this.protectionFace.set(face);
    this.protectionManual.set(null);
  }

  protected async rollDamage(): Promise<void> {
    if (this.rolling()) {
      return;
    }
    const count = damageDiceCount(this.die());
    this.damageValues.set(await this.throwDice(`${count}d6`, count));
    this.damageRolled.set(true);
    this.focusAfterRender(() => this.applyButton());
  }

  /** La barre de vie d'une carte. Celle de la cible choisie montre aussi ce que le coup en cours va lui retirer. */
  protected lifeOf(card: TapisCard): LifeBar {
    const rest = vitalitePercent(card.vitaliteCourante, card.vitaliteMax);
    const max = card.vitaliteMax ?? 0;
    const hit = card.key === this.target()?.key ? (this.damage() ?? 0) : 0;
    const loss = max > 0 ? Math.min(rest, (hit / max) * 100) : 0;
    return {rest: rest - loss, loss, low: isLowVitalite(card.vitaliteCourante, card.vitaliteMax)};
  }

  /** Prend ou retire une option de succès héroïque (cf. `toggleHeroicPick`). */
  protected pickHeroic(slug: HeroicSlug): void {
    this.picks.update((picks) => toggleHeroicPick(picks, slug, this.picksMax()));
  }

  /** Faveur divine : 1 point d'héroïsme, et tous les dés du jet d'attaque se relancent — à table ou à l'écran. Le second jet est gardé. */
  protected divineFavor(): void {
    if (!this.canFavor()) {
      return;
    }
    this.heroismeAdjusted.emit(-1);
    this.favor.set(true);
    this.dice.set(null);
    this.rolledDice.set(null);
    this.manualTotal.set(null);
    this.damageValues.set(null);
    this.focusAfterRender(() => this.attackInput());
  }

  /** Échec critique sur un double 1 : l'accepter rapporte 1 point d'héroïsme, y renoncer le reprend. */
  protected toggleCritique(): void {
    this.heroismeAdjusted.emit(this.critique() ? -1 : 1);
    this.critique.update((chosen) => !chosen);
  }

  /** Succès légendaire sur un double 6 : 1 point d'héroïsme pour une seconde option ; y renoncer le rembourse. */
  protected toggleLegendary(): void {
    if (!this.legendary() && !this.canSpend()) {
      return;
    }
    this.heroismeAdjusted.emit(this.legendary() ? 1 : -1);
    this.legendary.update((chosen) => !chosen);
    this.picks.update((picks) => picks.slice(0, this.picksMax()));
  }

  /** Succès héroïque acheté sur un coup qui touche : 1 point d'héroïsme pour une option ; y renoncer le rembourse. */
  protected toggleHeroicUpgrade(): void {
    if (!this.heroicUpgrade() && !this.canSpend()) {
      return;
    }
    this.heroismeAdjusted.emit(this.heroicUpgrade() ? 1 : -1);
    this.heroicUpgrade.update((chosen) => !chosen);
    this.picks.update((picks) => picks.slice(0, this.picksMax()));
  }

  /** Oublie les choix d'héroïsme du jet. Quand le jet est refait (`refund`), ce qu'ils avaient coûté ou rapporté est rendu. */
  private clearHeroism(refund: boolean): void {
    const delta = (this.legendary() ? 1 : 0) + (this.heroicUpgrade() ? 1 : 0) - (this.critique() ? 1 : 0);
    this.critique.set(false);
    this.legendary.set(false);
    this.heroicUpgrade.set(false);
    this.picks.set([]);
    if (refund && delta !== 0) {
      this.heroismeAdjusted.emit(delta);
    }
  }

  /** Le coup est conclu : ses options héroïques laissent leurs effets sur la cible (dé de malus du coup précis, du renversement), et
   * un Carnage donne une attaque de plus. */
  private conclude(target: TapisCard, withEffects = true): void {
    const picks = new Set(withEffects ? this.picks() : []);
    if (picks.has('precis')) {
      this.effectAdded.emit(effetCoupPrecis(target.key));
    }
    if (picks.has('renversement')) {
      this.effectAdded.emit(effetRenversement(target.key));
    }
    const carnages = this.pickCounts().carnage ?? 0;
    this.carnageOwed.update((owed) => Math.max(0, owed - 1) + carnages);
    if (carnages > 0) {
      this.carnageUsed.set(true);
    }
  }

  protected apply(): void {
    const target = this.target();
    const damage = this.damage();
    if (!target || damage === null) {
      return;
    }
    this.conclude(target);
    const hit = {target, damage, unarmed: this.unarmed()};
    this.damageApplied.emit(hit);
    this.resetRoll();
    this.lastHit.set(hit);
    this.focusAfterRender(() => (this.carnageOwed() > 0 ? this.attackInput() : this.endButton()));
  }

  /** Points de la cible pour se défendre : l'héroïsme d'un héros, la vilénie d'un rival (0 pour les autres). */
  private readonly targetHeroisme = computed(() => this.targetStats()?.heroisme ?? 0);
  /** « 1 point d'héroïsme » de l'attaquant, ou « 1 point de vilénie » d'un rival qui attaque. */
  protected readonly unPointAttaquant = computed(() => libellePoints(this.card().kind, 1));
  protected readonly unPointCible = computed(() => libellePoints(this.target()?.kind ?? 'hero', 1));
  /** Parade in extremis (02-actions-combat.md, « Points d'héroïsme ») : un coup qui touche un héros ou un rival, pas encore appliqué. */
  protected readonly canParry = computed(() => this.hasDamageStep() && this.targetHeroisme() > 0);
  /** « Juste une égratignure » : juste après des dégâts appliqués à un héros ou à un rival, une fois par coup. */
  protected readonly canScratch = computed(() => {
    const hit = this.lastHit();
    return !!hit && hit.target.key === this.target()?.key && hit.damage > 0 && !hit.parried && !hit.scratch && this.targetHeroisme() > 0;
  });
  /** Le sbire qui peut servir de bouclier humain au rival visé : une piétaille encore debout de son camp. */
  protected readonly sbire = computed(() => {
    const target = this.target();
    return target?.kind === 'pnj' ? sbireBouclier(target, this.targets()) : null;
  });
  /** « Bouclier humain » (04-pnj-creatures-demons.md, « Points de vilenie ») : un coup qui touche un rival qui a de la vilénie et un
   * sbire à ses côtés. */
  protected readonly canHumanShield = computed(() => this.hasDamageStep() && this.targetHeroisme() > 0 && this.sbire() !== null);

  /** Ce que dit le rappel du dernier coup : les dégâts, ou la parade ; puis l'égratignure, s'il y en a eu une. */
  protected readonly hitSummary = computed(() => {
    const hit = this.lastHit();
    if (!hit) {
      return null;
    }
    const title = hit.parried === 'sbire' ? 'Bouclier humain' : hit.parried ? 'Paré' : `${hit.damage} ${hit.damage > 1 ? 'dégâts' : 'dégât'}`;
    const detail =
      hit.parried === 'sbire'
        ? `${hit.sbire} s’interpose et encaisse le coup à la place de ${hit.target.nom}.`
        : hit.parried
          ? `${hit.target.nom} interpose ${hit.parried === 'bouclier' ? 'son bouclier, qui est brisé' : 'son arme, qui est brisée'}.`
          : `appliqués à ${hit.target.nom}.`;
    const scratch = hit.scratch
      ? `Juste une égratignure : ${hit.scratch.die} au d6B, ${hit.scratch.healed} ${hit.scratch.healed > 1 ? 'points rendus' : 'point rendu'} ; ${hit.target.nom} perd sa prochaine action.`
      : '';
    return {title, detail, scratch};
  });

  /** Parade in extremis : la cible dépense 1 point d'héroïsme (ou de vilénie) et interpose son bouclier (s'il en a un) ou son arme, qui est brisé ; le
   * coup ne fait pas de dégâts, et ses options héroïques non plus. Un Carnage garde son attaque de plus. */
  protected parry(): void {
    const target = this.target();
    if (!target || !this.canParry()) {
      return;
    }
    const stats = this.targetStats();
    const bouclier = (stats?.bouclierMalusUneAttaque ?? 0) > 0 || (stats?.bouclierDefenseToutes ?? 0) > 0;
    this.targetHeroismeAdjusted.emit({card: target, delta: -1});
    this.effectAdded.emit(effetParade(target.key, bouclier));
    this.conclude(target, false);
    this.resetRoll();
    this.lastHit.set({target, damage: 0, unarmed: false, parried: bouclier ? 'bouclier' : 'arme'});
    this.focusAfterRender(() => (this.carnageOwed() > 0 ? this.attackInput() : this.endButton()));
  }

  /** « Bouclier humain » : le rival dépense 1 point de vilénie et pousse un de ses sbires devant le coup. Le sbire encaisse le coup à
   * sa place : une piétaille tombe au premier coup, il est mis hors de combat (toute sa vitalité restante, sans calcul contre une armure
   * qui n'est pas la sienne). Le rival ne subit rien, et les options héroïques du coup tombent avec lui. */
  protected humanShield(): void {
    const target = this.target();
    const sbire = this.sbire();
    if (!target || !sbire || !this.canHumanShield()) {
      return;
    }
    this.targetHeroismeAdjusted.emit({card: target, delta: -1});
    this.damageApplied.emit({target: sbire, damage: Math.max(1, sbire.vitaliteCourante ?? 1), unarmed: this.unarmed()});
    this.conclude(target, false);
    this.resetRoll();
    this.lastHit.set({target, damage: 0, unarmed: false, parried: 'sbire', sbire: sbire.nom});
    this.focusAfterRender(() => (this.carnageOwed() > 0 ? this.attackInput() : this.endButton()));
  }

  /** « Juste une égratignure » ouverte : son d6B attend, lancé à table (le dé gardé, saisi) ou à l'écran. Refermée à chaque nouveau
   * coup. */
  protected readonly scratching = linkedSignal<AppliedHit | null, boolean>({source: () => this.lastHit(), computation: () => false});

  /** Ouvre « Juste une égratignure » : la main passe au champ du dé. Le point n'est dépensé qu'une fois le dé connu. */
  protected startScratch(): void {
    if (!this.canScratch() || this.rolling()) {
      return;
    }
    this.scratching.set(true);
    this.focusAfterRender(() => this.scratchInput());
  }

  /** Échap ou « Annuler » : la saisie se referme sans rien dépenser (Échap ne va pas plus loin que ce champ). */
  protected cancelScratch(event?: Event): void {
    event?.preventDefault();
    this.scratching.set(false);
  }

  /** Le d6B lancé à table : le dé gardé, un chiffre de 1 à 6, pris tout de suite. */
  protected onScratchInput(raw: string): void {
    const text = raw.trim();
    if (/^[1-6]$/.test(text)) {
      this.applyScratch([Number(text)]);
    }
  }

  /** Le d6B lancé à l'écran : deux d6, le meilleur compte. */
  protected async rollScratch(): Promise<void> {
    if (!this.canScratch() || this.rolling()) {
      return;
    }
    this.applyScratch(await this.throwDice('2d6', 2));
  }

  /** « Juste une égratignure » : la cible dépense 1 point d'héroïsme (ou de vilénie) pour son d6B ; elle récupère autant de vitalité,
   * sans dépasser les dégâts du coup, et perd sa prochaine action. */
  private applyScratch(des: readonly number[]): void {
    const hit = this.lastHit();
    if (!hit || !this.canScratch()) {
      return;
    }
    const {die, healed} = egratignure(des, hit.damage);
    this.targetHeroismeAdjusted.emit({card: hit.target, delta: -1});
    this.vitaliteAdjusted.emit({card: hit.target, delta: healed});
    this.effectAdded.emit(effetActionPerdue(hit.target.key));
    this.lastHit.set({...hit, scratch: {die, healed}});
  }

  /** Désarmement : pas de dégâts à appliquer. Le coup se conclut, et le tour finit — sauf si un Carnage donne une nouvelle attaque. */
  protected concludeWithoutDamage(): void {
    const target = this.target();
    if (!target) {
      return;
    }
    this.conclude(target);
    // Le jet s'efface tout de suite : le bouton disparaît, un second clic ne conclut pas deux fois.
    this.resetRoll();
    if (this.carnageOwed() > 0) {
      this.focusAfterRender(() => this.attackInput());
    } else {
      this.endTurnRequested.emit(true);
    }
  }

  /** « Fin du tour » (bouton ou touche F). Un coup qui a touché sans être appliqué perdrait ses dégâts et les effets de ses options
   * héroïques : le MJ choisit d'abord de l'appliquer et finir, de finir sans l'appliquer, ou de rester sur le tour. */
  requestEndTurn(): void {
    const target = this.target();
    if (!target || !this.verdict()?.hit) {
      this.endTurnRequested.emit(false);
      return;
    }
    const damage = this.hasDamageStep() ? this.damage() : null;
    this.dialog
      .open<EndTurnDialogComponent, EndTurnDialogData, EndTurnChoice>(EndTurnDialogComponent, {
        width: '440px',
        data: {attackerNom: this.card().nom, targetNom: target.nom, damage, canApply: !this.hasDamageStep() || damage !== null},
      })
      .afterClosed()
      .subscribe((choice) => {
        if (choice === 'apply') {
          if (this.hasDamageStep()) {
            this.apply();
          } else {
            this.conclude(target);
            this.resetRoll();
          }
        }
        if (choice) {
          this.endTurnRequested.emit(choice === 'apply');
        }
      });
  }

  protected signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }

  private resetRoll(): void {
    this.protectionFace.set(null);
    this.protectionManual.set(null);
    this.editingProtection.set(false);
    this.frozenTerms.set(null);
    this.frozenDamageTerms.set(null);
    this.feintNoted.set(false);
    this.dice.set(null);
    this.rolledDice.set(null);
    this.manualTotal.set(null);
    this.favor.set(false);
    this.clearHeroism(false);
    this.damageValues.set(null);
  }
}
