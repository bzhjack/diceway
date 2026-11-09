import {afterNextRender, computed, inject, Injectable, signal} from '@angular/core';
import {ModifierTerm} from '../../models/combat-effect.model';
import {effetParalyse, estParalyse, modificateursPour, sommeModificateurs} from './combat-effects.util';
import {degatsDoubles, libelleVulnerabilite, poisonPossible} from './pouvoirs-combat.util';
import {DiceRowDie} from '../../../../shared/models/dice-row.model';
import {damageDiceCount, damageDieMax, damageRange, devastatingBonus, finalDamage, parseDamage, rawDamage, scaleDamage, vigueurBonus} from '../../combat-resolution.util';
import {DamageDie} from '../../models/combat-attack.model';
import {DwRollSumTerm} from '../../../../shared/models/roll-sum.model';
import {signedTerm, sumTermOf} from './turn-assistant.util';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';

/** Ce que rapporte chaque dé de dégâts, en clair, à côté de la case où on le saisit. */
const DIE_NOTES: Readonly<Record<DamageDie, string>> = {
  d3: 'un d6 divisé par deux',
  d6: 'un d6',
  d6m: 'le moins bon de deux d6',
  d6b: 'le meilleur de deux d6',
};

/** Les dégâts d'un coup qui touche : le dé de l'arme, la protection de la cible, l'addition, et ce que le coup retire à la cible. */
@Injectable()
export class TurnDamageStore {
  private readonly turn = inject(TurnContextStore);
  private readonly loadout = inject(TurnLoadoutStore);
  private readonly attack = inject(TurnAttackStore);

  readonly damageValues = signal<readonly number[] | null>(null);

  /** Le dé de dégâts a été lancé à l'écran (ses faces sont connues), pas tapé à table. */
  private readonly damageRolled = signal(false);

  /** Un sort qui blesse (livre p. 150) : ses dégâts sont ceux de sa puissance, sans vigueur ni protection d'armure (interprétation : le
   * livre les inflige « automatiquement »). Le MJ peut saisir une protection à la main. */
  readonly sort = computed(() => this.loadout.sortMode());

  /** Les dégâts du coup : ceux de l'arme ou du profil, ou ceux du sort. */
  private readonly degats = computed(() => (this.sort() ? this.loadout.sortDegats() : this.loadout.degats()));

  /** Un coup qui ne tue pas (à mains nues, ou au gourdin en non létal) : jamais pour un sort. */
  private readonly sansTuer = computed(() => !this.sort() && this.loadout.sansTuer());

  /** Les dégâts de l'arme ou du profil, lus en entier (dé, multiplicateur, modificateur, ou valeur fixe) ; `null` pour des dégâts
   * spéciaux, dont le MJ tape le total. */
  private readonly damageSpec = computed(() => parseDamage(this.degats()));

  /** La fourchette des dégâts possibles (« 2 à 7 »), au bout de leur addition tant que le dé n'est pas tombé ; `null` pour des dégâts spéciaux, tapés tels quels. */
  readonly damageSpan = computed(() => {
    const spec = this.damageSpec();
    if (spec === null) {
      return null;
    }
    const range = damageRange(spec, this.vigueur(), this.effectiveProtection(), this.devastating());
    const [min, max] = range.map((value) => degatsDoubles(value, this.doubled()) ?? value);
    return min === max ? `${min}` : `${min} à ${max}`;
  });

  private readonly die = computed<DamageDie>(() => this.damageSpec()?.die ?? 'd6');

  /** Dégâts spéciaux : pas de dé à proposer, le total se tape. */
  readonly specialDamage = computed(() => this.damageSpec() === null);

  /** Dégâts fixes : pas de jet, ils sont connus dès que le coup touche. */
  readonly fixedDamage = computed(() => this.damageSpec()?.fixed ?? null);

  /** Le dé de protection de la cible, lu sur son armure (« d6-1(3) » → un d6 moins 1), avec le bonus d'un casque ou de Peau dure
   * (« d6-1 (3) +2 ») ; `null` sans dé. */
  readonly protectionDie = computed<{readonly malus: number; readonly bonus: number} | null>(() => {
    const text = this.turn.targetStats()?.protectionText ?? '';
    // « d6-1 (3) » : un d6 moins 1 ; « d6 (4) » : un d6 sans retrait (certaines créatures).
    const match = text.match(/d6\s*(?:-\s*(\d+))?/i);
    return match ? {malus: Number(match[1] ?? 0), bonus: Number(text.match(/\)\s*\+(\d+)/)?.[1] ?? 0)} : null;
  });

  /** Face du dé de protection lancé à la place de la valeur fixe (le livre laisse le choix au MJ) ; `null` : valeur fixe. */
  readonly protectionFace = signal<number | null>(null);

  /** Valeur de protection saisie à la main (clic sur la puce) ; prime sur le dé et sur la valeur fixe. */
  readonly protectionManual = signal<number | null>(null);

  readonly editingProtection = signal(false);

  readonly protectionDraft = signal('');

  private readonly protection = computed(() => {
    if (!this.sort() && this.loadout.choice()?.special?.slug === 'armor-chink') {
      return 0;
    }
    const manual = this.protectionManual();
    if (manual !== null) {
      return manual;
    }
    if (this.sort()) {
      return 0;
    }
    const die = this.protectionDie();
    const face = this.protectionFace();
    return die && face !== null ? Math.max(0, face - die.malus) + die.bonus : (this.turn.targetStats()?.protection ?? 0);
  });

  /** La vigueur ajoutée aux dégâts ; aucune pour une horde, dont les d6M sont les dégâts du groupe. */
  private readonly vigueur = computed(() => {
    const a = this.turn.attacker();
    return a && !this.sort() && this.loadout.hordeSize() === 0 ? vigueurBonus(a, this.loadout.isTir(), this.loadout.unarmed()) : 0;
  });

  /** Nombre de coups dévastateurs pris : +6 dégâts chacun. */
  private readonly devastating = computed(() => this.attack.pickCounts().devastateur ?? 0);

  /** Ce qu'a donné le dé de dégâts, avant multiplicateur et modificateur ; `null` avant le jet. */
  readonly face = computed(() => {
    const values = this.damageValues();
    return values && this.damageSpec() !== null ? rawDamage(this.die(), values) : null;
  });

  /** Les dégâts bruts, avant la vigueur et la protection : la valeur fixe, le dé multiplié et modifié, ou le total tapé (dégâts
   * spéciaux). */
  readonly raw = computed(() => {
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

  /** Les dés au-dessus de la case des dégâts : ceux lancés à l'écran (pour un d6M ou un d6B, celui qui n'est pas retenu estompé) ; `null`
   * pour un dé tapé à table, montré par son total. */
  readonly damageRowDice = computed<readonly DiceRowDie[] | null>(() => {
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

  readonly damageRowTotal = computed(() => (this.damageRolled() ? null : this.specialDamage() ? this.raw() : this.face()));

  readonly damageSlots = computed(() => damageDiceCount(this.die()));

  /** Ce qui se retranche vraiment des dégâts : un modificateur positif des effets ajoute aux dégâts, il se retranche de la protection. */
  private readonly effectiveProtection = computed(() => this.protection() - sommeModificateurs(this.damageEffectTerms()));

  /** Les dégâts du coup, doublés si le MJ a coché la vulnérabilité de la cible. */
  readonly damage = computed(() => {
    const raw = this.raw();
    return degatsDoubles(raw === null ? null : finalDamage(raw, this.vigueur(), this.effectiveProtection(), this.devastating()), this.doubled());
  });

  /** La cible est vulnérable (« Vulnérabilité ») : sa faiblesse, que le MJ peut cocher pour doubler les dégâts de ce coup ; `null` sinon. */
  readonly vulnerabilite = computed(() => {
    const v = this.turn.target()?.pouvoirs?.vulnerabilite;
    return v ? libelleVulnerabilite(v) : null;
  });

  /** « Dégâts doublés » coché : le coup frappe la faiblesse de la cible. Décoché à chaque nouveau jet, cible ou attaquant. */
  readonly doubled = signal(false);

  /** La cible est intangible : seules la sorcellerie et l'alchimie la blessent. Le MJ décide d'appliquer ou non. */
  readonly intangible = computed(() => this.turn.target()?.pouvoirs?.intangible === true);

  /** Le coup d'un démon venimeux touche une cible de taille moyenne ou moins : le jet de vigueur contre la paralysie est à faire. */
  readonly poison = computed(() => poisonPossible(this.turn.card(), this.turn.target()));

  /** La cible est déjà paralysée : le bouton « Paralysé » l'a fait. */
  readonly targetParalysed = computed(() => {
    const target = this.turn.target();
    return !!target && estParalyse(this.turn.effets(), target.key);
  });

  /** « Paralysé » : la cible a raté son jet de vigueur, elle ne joue plus tant que le MJ ne retire pas l'effet. */
  paralyze(): void {
    const target = this.turn.target();
    if (target && this.poison() && !this.targetParalysed()) {
      this.turn.effectAdded.emit(effetParalyse(target.key));
    }
  }

  /** Ce que rapporte le dé de dégâts, à côté de sa case : « d6M : le moins bon de deux d6 », « d6Bx2 : le meilleur de deux d6, multiplié
   * par 2 ». */
  readonly dieNote = computed(() => {
    const spec = this.damageSpec();
    if (spec === null) {
      return `${this.degats()} : voir la fiche, et tape le total`;
    }
    if (spec.fixed !== null) {
      return `${this.degats()} : dégâts fixes, sans jet`;
    }
    const times = spec.multiplier > 1 ? `, multiplié par ${spec.multiplier}` : '';
    const plus = spec.modifier !== 0 ? `, ${signedTerm(spec.modifier)}` : '';
    return `${this.sort() ? 'Sort, ' : ''}${this.degats()} : ${DIE_NOTES[this.die()]}${times}${plus}`;
  });

  readonly hasDamageStep = computed(() =>
    this.sort()
      ? !!this.attack.sortVerdict()?.hit && this.loadout.sortModel().blessant && this.turn.target() !== null && !this.attack.sortDamageDone()
      : !!this.attack.verdict()?.hit && !this.attack.picks().includes('desarmement'),
  );

  /** Plus grand nombre à taper dans la case des dégâts : la face du dé (3 pour un d3, 6 sinon), ou le total de dégâts spéciaux. */
  readonly damageMax = computed(() => (this.specialDamage() ? 99 : damageDieMax(this.die())));

  /** L'addition du jet de dégâts : le dé de l'arme, la vigueur, le coup dévastateur, la protection de la cible (elle se clique pour la
   * saisir), les effets en cours, puis la fourchette des dégâts — et, le dé tombé, leur total. */
  readonly damageSum = computed<readonly DwRollSumTerm[]>(() => {
    const spec = this.damageSpec();
    const face = this.face();
    const add = (value: number, caption: string): void => {
      if (value !== 0) {
        terms.push({value: signedTerm(value), caption, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    const terms: DwRollSumTerm[] = [];
    if (spec === null) {
      // Dégâts spéciaux : le total tapé, tel quel.
      terms.push({value: this.raw() === null ? '?' : `${this.raw()}`, caption: 'spécial', tone: 'dice'});
    } else if (spec.fixed !== null) {
      terms.push({value: `${spec.fixed}`, caption: 'fixes', tone: 'dice'});
    } else {
      terms.push({value: face === null ? this.degats() : `${face}`, caption: this.sort() ? 'sort' : 'dé', tone: 'dice'});
      if (spec.multiplier > 1) {
        terms.push({value: `×${spec.multiplier}`, caption: 'taille', tone: 'plus'});
      }
      add(spec.modifier, 'profil');
    }
    add(this.vigueur(), 'vigueur');
    add(devastatingBonus(this.devastating()), this.devastating() > 1 ? `dévastateur ×${this.devastating()}` : 'dévastateur');
    if (this.sort() && this.protectionManual() === null) {
      // Toujours affichée : c'est elle qu'on clique pour saisir une protection.
      terms.push({value: '0', caption: 'protection (sort)', tone: 'minus', editable: true});
    } else if (!this.sort() && this.loadout.choice()?.special?.slug === 'armor-chink') {
      terms.push({value: '0', caption: 'armure ignorée', tone: 'dice'});
    } else {
      const protection = this.protection();
      const source = this.protectionManual() !== null ? ' (saisie)' : this.protectionFace() !== null ? ` (dé ${this.protectionFace()})` : '';
      // Toujours affichée, même à 0 : c'est elle qu'on clique pour saisir une valeur.
      terms.push({value: protection === 0 ? '0' : signedTerm(-protection), caption: `protection${source}`, tone: 'minus', editable: true});
    }
    terms.push(...this.damageEffectTerms().map((term) => sumTermOf(term)));
    if (this.doubled()) {
      terms.push({value: '×2', caption: 'vulnérable', tone: 'plus'});
    }
    const damage = this.damage();
    if (damage === null && spec === null) {
      terms.push({value: '?', caption: 'dégâts', tone: 'total'});
    } else if (damage === null && spec !== null) {
      const span = this.damageSpan();
      terms.push({value: span ?? '?', caption: 'dégâts', tone: 'total'});
    } else {
      terms.push({value: `= ${damage}`, caption: 'dégâts', tone: 'total'});
    }
    return terms;
  });

  /** Les modificateurs du registre pour le jet de dégâts (effets de dégâts de l'attaquant, protection de la cible), figés comme ceux de
   * l'attaque : un effet à usage limité consommé par le jet d'attaque compte encore pour ses dégâts. */
  readonly liveDamageTerms = computed<readonly ModifierTerm[]>(() => {
    const target = this.turn.target();
    return target ? modificateursPour(this.turn.effets(), {jet: 'degats', attaquant: this.turn.card().key, cible: target.key, bouclier: 0, bouclierToutes: 0, noms: this.attack.noms()}) : [];
  });

  readonly frozenDamageTerms = signal<readonly ModifierTerm[] | null>(null);

  private readonly damageEffectTerms = computed(() => [...(this.frozenDamageTerms() ?? this.liveDamageTerms()), ...(this.sort() ? [] : this.loadout.extraDamageTerms())]);

  /** La vie de la cible choisie, en chiffres : ce qu'il lui reste, et où le coup en cours la fait tomber (`after`, `null` sans dégâts). */
  readonly targetLife = computed(() => {
    const target = this.turn.target();
    const current = target?.vitaliteCourante ?? null;
    const damage = this.damage();
    // Une bagarre à mains nues, ou un coup non létal, ne fait pas passer sous 0 : la cible est assommée.
    const after = current !== null && damage !== null && damage > 0 ? (this.sansTuer() ? Math.min(current, Math.max(0, current - damage)) : current - damage) : null;
    return {current, max: target?.vitaliteMax ?? null, after, loss: after === null || current === null ? 0 : current - after, out: after !== null && after <= 0};
  });

  /** Saisie du dé de dégâts lancé à table : un chiffre, pris tout de suite. Un d6 de malus ou de bonus garde le dé retenu (on saisit
   * celui-là), un d3 se lit tel quel. La main passe ensuite au bouton qui applique. */
  onDamageInput(raw: string): void {
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
    this.turn.focusAfterRender(() => this.turn.applyButton());
  }

  /** Ouvre la saisie de la protection : le champ remplace la puce, prérempli avec la valeur courante. */
  startEditProtection(): void {
    this.protectionDraft.set(String(this.protection()));
    this.editingProtection.set(true);
    afterNextRender(
      () => {
        const input = this.turn.protectionInput()?.nativeElement;
        input?.focus();
        input?.select();
      },
      {injector: this.turn.injector},
    );
  }

  /** Entrée : valide un entier positif ou nul ; une saisie invalide referme le champ sans rien changer. */
  commitProtection(): void {
    const value = Number(this.protectionDraft());
    if (this.protectionDraft().trim() !== '' && Number.isInteger(value) && value >= 0) {
      this.protectionManual.set(value);
      this.protectionFace.set(null);
    }
    this.editingProtection.set(false);
  }

  resetProtection(): void {
    this.protectionManual.set(null);
    this.protectionFace.set(null);
  }

  /** Lance le dé de protection de la cible : son résultat remplace la valeur fixe pour ce coup. */
  async rollProtection(): Promise<void> {
    if (this.turn.rolling() || !this.protectionDie()) {
      return;
    }
    const [face] = await this.turn.throwDice('1d6', 1);
    this.protectionFace.set(face);
    this.protectionManual.set(null);
  }

  async rollDamage(): Promise<void> {
    if (this.turn.rolling()) {
      return;
    }
    const count = damageDiceCount(this.die());
    this.damageValues.set(await this.turn.throwDice(`${count}d6`, count));
    this.damageRolled.set(true);
    this.turn.focusAfterRender(() => this.turn.applyButton());
  }

  /** Oublie les dégâts du jet : le dé, la protection saisie, les modificateurs figés. */
  resetRoll(): void {
    this.doubled.set(false);
    this.protectionFace.set(null);
    this.protectionManual.set(null);
    this.editingProtection.set(false);
    this.frozenDamageTerms.set(null);
    this.damageValues.set(null);
  }
}
