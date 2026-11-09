import {computed, effect, inject, Injectable, linkedSignal, untracked} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {keepBestOrWorstTwo, parseDiceTotal} from '../../action-roll.util';
import {aDejaFeinte, effetActionPerdue, effetFeinte, effetParade, effetCoupPrecis, effetRechargement, effetRenversement, enRechargement, sansTerme} from './combat-effects.util';
import {EndTurnDialogComponent} from '../end-turn-dialog/end-turn-dialog';
import {EndTurnChoice, EndTurnDialogData} from '../../models/end-turn-dialog.model';
import {egratignure} from '../../heroisme-spend.util';
import {HEROIC_OPTIONS} from '../../combat-resolution.util';
import {AppliedHit} from '../../models/combat-attack.model';
import {MassacrePietailleDialogComponent} from '../massacre-pietaille-dialog/massacre-pietaille-dialog';
import {MassacrePietailleDialogData, MassacrePietailleResult} from '../../models/massacre-pietaille-dialog.model';
import {candidatsMassacre} from './options-heroiques.util';
import {PIETAILLE} from './combat-turn.util';
import {TapisCard} from '../../models/tapis.model';
import {StationState, PlayedAttack} from '../../models/turn-assistant.model';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnDamageStore} from './turn-damage.store';
import {TurnCibleStore} from './turn-cible.store';
import {blessuresDuSort, effetSortPaye} from '../../magie-combat.util';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {confirmDialog} from '../../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolHerosService} from '../../../services/bol-heros.service';

/** Les attributs, en clair, pour la perte définitive d'un sort du 3e cercle. */
const PERTE_LIBELLES: Readonly<Record<'vigueur' | 'agilite' | 'esprit' | 'aura', string>> = {vigueur: 'Vigueur', agilite: 'Agilité', esprit: 'Esprit', aura: 'Aura'};

/** Le déroulé du coup, de bout en bout : ce qui fait passer d'une étape à l'autre (le jet, l'application, la parade, la fin du tour), le coup joué qui reste écrit, et les cases allumées. */
@Injectable()
export class TurnFlowStore {
  private readonly turn = inject(TurnContextStore);
  private readonly loadout = inject(TurnLoadoutStore);
  private readonly attack = inject(TurnAttackStore);
  private readonly damage = inject(TurnDamageStore);
  private readonly cible = inject(TurnCibleStore);

  private readonly dialog = inject(MatDialog);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  /** L'attaque est lancée ou jouée (ou le sort payé, même avant que la page soit rechargée) : il est trop tard pour retarder, secourir ou se
   * mettre en défense totale. */
  readonly attaqueEngagee = computed(
    () => this.attack.attackVerdict() !== null || this.played() !== null || this.lastHit() !== null || this.sortLance() || this.attack.sortPerdu() || this.attack.sortCredit() > 0,
  );

  /** Le sort de ce tour est lancé (payé) : il ne se règle plus, et l'attaque n'est plus possible. */
  readonly sortLance = computed(() => this.attack.sortPaid() > 0 || this.attack.sortAuto());

  /** Un prêtre visé ne peut plus imposer de dé de foi à son agresseur : le dé s'annonce avant le jet (livre p. 146 : le druide perturbe
   * Krongar « qui s'apprête à jeter sa lance », et Krongar jette ensuite 3 dés). Le jet fait — attaque ou sort, payé même avant un
   * rechargement —, ou le coup joué, le dé de foi de la cible se ferme ; il se rouvre si le jet est effacé, ou pour l'attaque suivante d'un
   * Carnage. `null` tant qu'il est ouvert, sinon ce que dit son infobulle. */
  readonly deFoiCibleVerrou = computed(() => {
    const jetFait =
      this.attack.attackVerdict() !== null ||
      this.attack.sortVerdict() !== null ||
      this.sortLance() ||
      this.attack.sortCredit() > 0 ||
      this.played() !== null ||
      (this.lastHit() !== null && this.attack.carnageOwed() === 0);
    return jetFait ? `Trop tard : le jet de ${this.turn.card().nom} est fait, et un dé de foi s’impose avant le jet (livre p. 146)` : null;
  });

  /** Il reste à choisir qui viser : les cartes des cibles prennent toute la largeur, l'attaque et les dégâts attendent. */
  readonly choixCible = computed(
    () =>
      !this.played() &&
      !this.turn.target() &&
      this.turn.targets().length > 0 &&
      !this.loadout.defenseTotale() &&
      !this.turn.actionPerdue() &&
      // Un sort qui ne vise personne (une invocation, une illusion) se lance sans cible.
      (!this.loadout.sortMode() || (this.loadout.sortVise() && !this.sortLance())),
  );

  /** Le dernier coup appliqué par cette carte : il reste affiché sur le plateau tant qu'un nouveau jet n'est pas fait. */
  private readonly lastHit = linkedSignal<string, AppliedHit | null>({source: () => this.turn.turnKey(), computation: () => null});

  /** Le coup joué, figé quand il se conclut (cf. `PlayedAttack`). */
  private readonly playedAttack = linkedSignal<string, PlayedAttack | null>({source: () => this.turn.turnKey(), computation: () => null});

  /** Le coup joué à montrer : pas quand un Carnage donne une nouvelle attaque, ni une fois une autre attaque commencée. */
  readonly played = computed(() => (this.attack.carnageOwed() === 0 && this.attack.attackVerdict() === null ? this.playedAttack() : null));

  /** La cible du coup joué n'est plus à viser : tombée, ou sortie du combat. */
  readonly playedTargetOut = computed(() => {
    const played = this.played();
    return played !== null && !this.turn.targets().some((card) => card.key === played.target.key);
  });

  /** La couleur de la ligne de l'attaque : celle du jet en cours, ou du coup joué. */
  readonly attackTone = computed(() => (this.attack.attackVerdict() ?? this.played()?.verdict)?.tone ?? null);

  /** La carte des dégâts n'apparaît qu'une fois le jet d'attaque (ou de sort) fait : avant, elle n'aurait rien à proposer. Elle porte ensuite
   * le dé, « Appliquer » et, après un coup raté ou joué, « Fin du tour ». */
  readonly degatsVisibles = computed(
    () => this.damage.hasDamageStep() || this.attack.attackVerdict() !== null || this.hitSummary() !== null || (this.loadout.sortMode() && this.attack.sortVerdict() !== null),
  );

  /** « Fin du tour » est le bouton or de la ligne des dégâts (coup raté, désarmement, coup joué) : celui du bandeau s'efface alors. */
  readonly endTurnInLine = computed(() => {
    if (this.damage.hasDamageStep() || this.turn.actionPerdue()) {
      return false;
    }
    if (this.loadout.sortMode()) {
      return this.attack.sortVerdict() !== null;
    }
    const verdict = this.attack.attackVerdict();
    if (verdict) {
      // Une attaque de Carnage ratée, quand une autre reste due : la ligne propose l'attaque suivante, « Fin du tour » reste en haut.
      return verdict.tone === 'echec' ? this.attack.carnageRemaining() === 0 : !this.attack.carnagePicked();
    }
    return this.hitSummary() !== null && this.attack.carnageOwed() === 0;
  });

  /** Où en sont les trois cases — qui, l'attaque, les dégâts : celle où il faut agir s'allume. Quand il ne reste qu'à finir le tour, c'est
   * la case des dégâts, qui porte « Fin du tour » ; après le coup joué, les cases 1 et 2 le gardent, figé (« Autre attaque » les rouvre). */
  readonly stations = computed<readonly [StationState, StationState, StationState]>(() => {
    // Action perdue : seule la case d'attaque, qui le dit, est allumée.
    if (this.turn.actionPerdue()) {
      return ['todo', 'cur', 'todo'];
    }
    // Défense totale : pas de jet, tout se joue sur « Fin du tour », en or sur la ligne de l'attaquant.
    if (this.loadout.defenseTotale()) {
      return ['todo', 'todo', 'todo'];
    }
    if (this.loadout.sortMode()) {
      const vise = this.turn.target() !== null || !this.loadout.sortVise();
      const lance = this.attack.sortVerdict() !== null;
      const finit = lance && !this.damage.hasDamageStep();
      return [vise || lance ? 'done' : 'cur', lance ? 'done' : vise ? 'cur' : 'todo', this.damage.hasDamageStep() || finit ? 'cur' : 'todo'];
    }
    const aimed = this.turn.target() !== null;
    const rolled = this.attack.attackVerdict() !== null;
    // « Fin du tour » est dans la case des dégâts (coup raté, désarmement, dégâts appliqués sans Carnage à suivre) : elle reste allumée,
    // même quand la cible, tombée sous le coup, n'est plus à viser.
    const endsHere = (aimed && rolled && !this.damage.hasDamageStep()) || (!rolled && this.lastHit() !== null && this.attack.carnageOwed() === 0);
    return [
      aimed || endsHere ? 'done' : 'cur',
      endsHere || (aimed && rolled) ? 'done' : aimed ? 'cur' : 'todo',
      this.damage.hasDamageStep() || endsHere ? 'cur' : rolled || this.lastHit() ? 'done' : 'todo',
    ];
  });

  /** « Juste une égratignure » : juste après des dégâts appliqués à un héros ou à un rival, une fois par coup. */
  readonly canScratch = computed(() => {
    const hit = this.lastHit();
    return !!hit && hit.target.key === this.turn.target()?.key && hit.damage > 0 && !hit.parried && !hit.scratch && this.cible.targetHeroisme() > 0;
  });

  /** Ce que dit le rappel du dernier coup : les dégâts, ou la parade ; puis l'égratignure, s'il y en a eu une. */
  readonly hitSummary = computed(() => {
    const hit = this.lastHit();
    if (!hit) {
      return null;
    }
    if (hit.massacre) {
      const n = hit.massacre.length;
      return {
        title: `${n} hors de combat`,
        detail: n > 0 ? `Massacrer la piétaille : ${hit.massacre.join(', ')}.` : 'Massacrer la piétaille : personne ne tombe.',
        scratch: '',
      };
    }
    const title = hit.parried === 'sbire' ? 'Bouclier humain' : hit.parried ? 'Paré' : `${hit.damage} ${hit.damage > 1 ? 'dégâts' : 'dégât'}`;
    const detail =
      hit.parried === 'sbire'
        ? `${hit.sbire} s’interpose et encaisse le coup à la place de ${hit.target.nom}.`
        : hit.parried
          ? `${hit.target.nom} interpose ${hit.parried === 'bouclier' ? 'son bouclier, qui est brisé' : 'son arme, qui est brisée'}.`
          : `appliqués à ${hit.target.nom}.`;
    const scratch = hit.scratch
      ? `Juste une égratignure : ${hit.scratch.die} au d6B, ${hit.scratch.healed} ${hit.scratch.healed > 1 ? 'points rendus' : 'point rendu'} ; ${hit.target.nom} perd sa prochaine action : son tour sera sauté.`
      : '';
    return {title, detail, scratch};
  });

  /** Le démon venimeux a touché (sans parade ni bouclier humain) une cible qu'il peut paralyser : après les dégâts, le rappel du jet et
   * le bouton « Paralysé » restent offerts. */
  readonly poisonAfterHit = computed(() => {
    const hit = this.lastHit();
    return !!hit && !hit.parried && hit.target.key === this.turn.target()?.key && this.damage.poison();
  });

  /** « Juste une égratignure » ouverte : son d6B attend, lancé à table (le dé gardé, saisi) ou à l'écran. Refermée à chaque nouveau
   * coup. */
  readonly scratching = linkedSignal<AppliedHit | null, boolean>({source: () => this.lastHit(), computation: () => false});

  constructor() {
    // Un autre tour (un autre attaquant, ou le même au round suivant), une autre cible, un autre choix ou un dé du MJ accordé ou retiré :
    // le jet précédent ne vaut plus. Le choix est comparé par sa valeur : la table rechargée (enregistrement de l'état du combat) en refait
    // un objet identique, qui ne doit pas effacer le jet en cours.
    effect(() => {
      this.turn.turnKey();
      this.turn.targetKey();
      this.loadout.choiceKey();
      this.loadout.gmDie();
      this.loadout.brawl();
      untracked(() => this.resetRoll());
    });

    // Un autre tour (une autre carte active, ou la même au round suivant), ou le passage de l'attaque au sort : le sort du tour repart de
    // zéro.
    effect(() => {
      this.turn.turnKey();
      this.loadout.mode();
      untracked(() => this.attack.resetSort());
    });

    // Une autre cible après le jet d'un sort qui vise : comme le jet d'attaque, le jet ne vaut plus. Le sort lancé contre l'ancienne cible
    // est perdu (son pouvoir reste dépensé, sa trace tombe) ; contre la nouvelle, c'est un nouveau sort, qui se paie. Ses dégâts appliqués,
    // il a agi : il reste tel quel.
    effect(() => {
      this.turn.targetKey();
      untracked(() => {
        if (this.sortLance() && this.loadout.sortVise() && !this.attack.sortDamageDone()) {
          this.noterSortPaye(0);
          this.attack.resetSort();
          this.attack.sortPerdu.set(true);
        }
      });
    });

    // Une autre cible désignée sur le plateau après le coup joué : c'est une autre attaque, le coup joué s'efface. Une cible tombée, elle,
    // laisse le coup joué à l'écran.
    effect(() => {
      const key = this.turn.targetKey();
      untracked(() => {
        const played = this.playedAttack();
        if (played && key !== null && key !== played.target.key) {
          this.playedAttack.set(null);
        }
      });
    });
  }

  async roll(): Promise<void> {
    if (this.turn.rolling()) {
      return;
    }
    this.attack.manualTotal.set(null);
    this.attack.clearHeroism(true);
    this.damage.damageValues.set(null);
    this.attack.dice.set(null);
    this.lastHit.set(null);
    this.playedAttack.set(null);
    this.markAttacked();
    const net = this.loadout.netDice();
    const count = this.loadout.diceCount();
    const values = await this.turn.throwDice(`${count}d6`, count);
    this.attack.rolledDice.set(count > 2 ? values : null);
    this.attack.dice.set(keepBestOrWorstTwo(values, net));
    this.turn.focusAfterRender(() => (this.damage.hasDamageStep() ? (this.turn.damageInput() ?? this.turn.applyButton()) : this.turn.endButton()));
  }

  /** Saisie du total des deux dés lancés à table. De 2 à 9 un chiffre suffit : le jet est pris tout de suite, et la main passe au dé de
   * dégâts s'il touche, à « Fin du tour » sinon. Une case vidée efface le jet. */
  onAttackInput(raw: string): void {
    if (raw.trim() === '') {
      if (this.attack.diceSum() !== null) {
        this.attack.dice.set(null);
        this.attack.manualTotal.set(null);
        this.attack.clearHeroism(true);
        this.damage.damageValues.set(null);
      }
      return;
    }
    const total = parseDiceTotal(raw);
    if (total === null) {
      return;
    }
    this.attack.dice.set(null);
    this.attack.rolledDice.set(null);
    this.attack.clearHeroism(true);
    this.damage.damageValues.set(null);
    this.lastHit.set(null);
    this.playedAttack.set(null);
    this.attack.manualTotal.set(total);
    this.markAttacked();
    this.turn.focusAfterRender(() => (this.damage.hasDamageStep() ? (this.turn.damageInput() ?? this.turn.applyButton()) : this.turn.endButton()));
  }

  /** Le sort est lancé : ses points de pouvoir sont payés une fois, au premier jet (ou sans jet, pour un charme automatique) — sauf
   * `nouveau` sort, relancé après un résultat, qui se paie de nouveau. Ce qui a été payé avant que la page soit rechargée n'est pas
   * redébité : seul un sort plus cher débite la différence. Le paiement laisse sa trace dans l'état du combat. Un sort du 3e cercle coûte en
   * plus 1 point de pouvoir définitif (livre p. 154) : c'est à reporter sur la fiche. */
  private payerSort(nouveau = false): void {
    if (this.sortLance() && !nouveau) {
      return;
    }
    const cout = this.loadout.sortCout().total;
    const credit = this.attack.sortCredit();
    const paye = Math.max(cout, credit);
    this.attack.sortCreditPris.set(true);
    this.attack.sortPaid.set(paye);
    this.turn.ajusterRessource(this.turn.card(), 'pouvoir', -Math.max(0, cout - credit));
    this.noterSortPaye(paye);
  }

  /** La condition « blessures » du sort lancé (livre p. 152-153) : le dé de son cercle est jeté, et le lanceur perd cette vitalité si le MJ
   * le confirme. */
  blessuresDuLanceur(): void {
    const lanceur = this.turn.card();
    const blessures = blessuresDuSort(this.loadout.sortModel().cercle);
    if (!blessures) {
      return;
    }
    const points = `${blessures.valeur} point${blessures.valeur > 1 ? 's' : ''} de vitalité`;
    confirmDialog(this.dialog, {
      title: 'Blessures du lanceur',
      message: `Condition « blessures » : ${blessures.de} = ${blessures.valeur}. ${lanceur.nom} perd ${points} ?`,
      confirmLabel: `Appliquer −${blessures.valeur}`,
    }).subscribe((confirme) => {
      if (confirme) {
        this.turn.vitaliteAdjusted.emit({card: lanceur, delta: -blessures.valeur});
      }
    });
  }

  /** Le prix d'un sort du 3e cercle (livre p. 154), sur la fiche du héros, après confirmation : 1 point de pouvoir perdu pour toujours, ou
   * 1 point de l'attribut choisi (qui peut passer sous 0). */
  perteDefinitive(cible: 'pouvoir' | 'vigueur' | 'agilite' | 'esprit' | 'aura'): void {
    const lanceur = this.turn.card();
    if (lanceur.kind !== 'hero' || !lanceur.sourceId) {
      return;
    }
    const quoi = cible === 'pouvoir' ? '1 point de pouvoir de sa réserve maximale' : `1 point de ${PERTE_LIBELLES[cible]}`;
    confirmDialog(this.dialog, {
      title: 'Perte définitive',
      message: `Sort du 3e cercle : ${lanceur.nom} perd pour toujours ${quoi}. La fiche est modifiée.`,
      confirmLabel: 'Perdre ce point',
    }).subscribe((confirme) => {
      if (!confirme) {
        return;
      }
      this.herosService.perteDefinitive(lanceur.sourceId!, cible).subscribe({
        next: () => this.snackBar.open(`${lanceur.nom} a perdu pour toujours ${quoi}.`, undefined, {duration: 4500}),
        error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, "Impossible d'enregistrer la perte."), 'Fermer', {duration: 5000}),
      });
    });
  }

  /** Tient à jour la trace « sort payé » de la carte (cf. `effetSortPaye`) : les anciennes tombent, la nouvelle dit ce qui est payé et
   * comment le sort est réglé ; aucune pour 0 (sort rendu, ou perdu). */
  private noterSortPaye(points: number): void {
    const trace = this.attack.sortTrace();
    const nouvelle = points > 0 ? effetSortPaye(this.turn.card().key, points, this.loadout.sortModel()) : null;
    // La même trace (mêmes points, mêmes réglages) est déjà posée : rien à refaire.
    if (nouvelle && trace.ids.length === 1 && trace.libelle === nouvelle.libelle) {
      return;
    }
    for (const id of trace.ids) {
      this.turn.effectRemoved.emit(id);
    }
    if (nouvelle) {
      this.turn.effectAdded.emit(nouvelle);
    }
  }

  /** Le sort peut partir : il en a le pouvoir, et sa cible est choisie s'il lui en faut une. Pas en défense totale : le round entier passe
   * à esquiver et parer, comme pour l'attaque. */
  readonly sortPret = computed(
    () =>
      !this.loadout.defenseTotale() &&
      (this.sortLance() || (this.attack.sortPayable() && (!this.loadout.sortVise() || this.turn.target() !== null) && this.attack.sortModifier() !== null)),
  );

  /** Le résultat du sort est sur sa ligne : relancer ses dés à l'écran, c'est lancer un nouveau sort, qui se paie (la faveur divine, elle,
   * efface d'abord le résultat, et ses dés ne repaient rien). Le total tapé à table, lui, se corrige sans repayer. */
  readonly nouveauSort = computed(() => this.attack.sortVerdict() !== null && !this.attack.sortAuto());

  /** Les dés du sort peuvent partir à l'écran : un nouveau sort, il faut de quoi le payer en entier. */
  readonly desSortPrets = computed(() => this.sortPret() && !this.attack.sortDamageDone() && (!this.nouveauSort() || this.loadout.sortPayable()));

  /** Lance les dés du sort à l'écran : le premier jet paie le sort, un jet après un résultat en paie un nouveau ; les dés relancés par la
   * faveur divine ne repaient rien. */
  async rollSort(): Promise<void> {
    if (this.turn.rolling() || !this.desSortPrets()) {
      return;
    }
    this.payerSort(this.nouveauSort());
    this.attack.oublierSortCritique();
    this.attack.clearSortDice();
    const net = this.loadout.netDice();
    const count = this.loadout.diceCount();
    const values = await this.turn.throwDice(`${count}d6`, count);
    this.attack.sortRolledDice.set(count > 2 ? values : null);
    this.attack.sortDice.set(keepBestOrWorstTwo(values, net));
    this.turn.focusAfterRender(() => (this.damage.hasDamageStep() ? (this.turn.damageInput() ?? this.turn.applyButton()) : this.turn.endButton()));
  }

  /** Le total des deux dés du sort, lancés à table. Une case vidée avant tout résultat rend le pouvoir payé : le sort n'est pas parti. Ses
   * dégâts appliqués, la case est figée : le sort a agi, il ne se rembourse ni ne se rejoue. */
  onSortInput(raw: string): void {
    if (this.attack.sortDamageDone()) {
      return;
    }
    if (raw.trim() === '') {
      if (this.attack.sortDiceSum() !== null && !this.attack.sortCritique()) {
        this.attack.clearSortDice();
        this.rembourserSort();
      }
      return;
    }
    const total = parseDiceTotal(raw);
    if (total === null || !this.sortPret()) {
      return;
    }
    this.payerSort();
    this.attack.oublierSortCritique();
    this.attack.sortDice.set(null);
    this.attack.sortRolledDice.set(null);
    this.attack.sortManual.set(total);
    this.turn.focusAfterRender(() => (this.damage.hasDamageStep() ? (this.turn.damageInput() ?? this.turn.applyButton()) : this.turn.endButton()));
  }

  /** Un charme automatique : payé, et il agit, sans jet. */
  castWithoutRoll(): void {
    if (!this.sortPret()) {
      return;
    }
    this.payerSort();
    this.attack.sortAuto.set(true);
    this.turn.focusAfterRender(() => (this.damage.hasDamageStep() ? (this.turn.damageInput() ?? this.turn.applyButton()) : this.turn.endButton()));
  }

  /** Le sort n'est pas parti (sa case vidée, ou « Annuler » d'un charme) : son pouvoir est rendu. Pas une fois ses dégâts appliqués. */
  rembourserSort(): void {
    if (this.attack.sortDamageDone()) {
      return;
    }
    const paye = this.attack.sortPaid();
    if (paye > 0) {
      this.turn.ajusterRessource(this.turn.card(), 'pouvoir', paye);
      this.noterSortPaye(0);
    }
    this.attack.resetSort();
  }

  /** Faveur divine sur un sort raté : 1 point d'héroïsme, et les dés se relancent — à table ou à l'écran ; le sort n'est pas repayé. */
  sortFavor(): void {
    if (!this.attack.canSortFavor()) {
      return;
    }
    this.turn.heroismeAdjusted.emit(-1);
    this.attack.clearSortDice();
    this.turn.focusAfterRender(() => this.turn.attackInput());
  }

  /** Le MJ retire un effet : le registre l'oublie, et le jet déjà fait (modificateurs figés) perd sa puce et recalcule son total. */
  removeEffect(id: string): void {
    this.attack.frozenTerms.update((termes) => (termes ? sansTerme(termes, id) : termes));
    this.damage.frozenDamageTerms.update((termes) => (termes ? sansTerme(termes, id) : termes));
    this.turn.effectRemoved.emit(id);
  }

  /** Premier jet contre cette cible : fige les modificateurs et signale l'attaque au registre. */
  private markAttacked(): void {
    const target = this.turn.target();
    if (!target || this.attack.frozenTerms() !== null) {
      return;
    }
    this.attack.frozenTerms.set(this.attack.liveTerms());
    this.damage.frozenDamageTerms.set(this.damage.liveDamageTerms());
    // Une feinte tentée se note sur la cible : retentée contre elle, elle sera signalée.
    const career = this.loadout.career();
    if (career && !aDejaFeinte(this.turn.effets(), target.key, this.turn.card().key)) {
      this.attack.feintNoted.set(true);
      this.turn.effectAdded.emit(effetFeinte(target.key, this.turn.card().key, career.label));
    }
    // Une arbalète qui tire se recharge ensuite (livre p. 50) ; déjà en rechargement, elle ne repart pas pour un tour de plus.
    const rechargement = this.loadout.rechargementDuTir();
    if (rechargement && !enRechargement(this.turn.effets(), this.turn.card().key, rechargement.arme)) {
      this.turn.effectAdded.emit(effetRechargement(this.turn.card().key, rechargement.arme, rechargement.rounds));
    }
    this.turn.attackRolled.emit({target, ignoreBouclier: this.loadout.ignoreBouclier()});
  }

  /** Faveur divine : 1 point d'héroïsme, et tous les dés du jet d'attaque se relancent — à table ou à l'écran. Le second jet est gardé. */
  divineFavor(): void {
    if (!this.attack.canFavor()) {
      return;
    }
    this.turn.heroismeAdjusted.emit(-1);
    this.attack.dice.set(null);
    this.attack.rolledDice.set(null);
    this.attack.manualTotal.set(null);
    this.damage.damageValues.set(null);
    this.turn.focusAfterRender(() => this.turn.attackInput());
  }

  /** Le coup est conclu : ses options héroïques laissent leurs effets sur la cible (dé de malus du coup précis, du renversement), et
   * un Carnage donne une attaque de plus. Un démon qui se régénère se débarrasse du coup précis au bout de 2 rounds. */
  private conclude(target: TapisCard, withEffects = true): void {
    const picks = new Set(withEffects ? this.attack.picks() : []);
    if (picks.has('precis')) {
      this.turn.effectAdded.emit(effetCoupPrecis(target.key, target.pouvoirs?.regeneration ?? false));
    }
    if (picks.has('renversement')) {
      this.turn.effectAdded.emit(effetRenversement(target.key));
    }
    const carnages = this.attack.pickCounts().carnage ?? 0;
    this.attack.carnageOwed.update((owed) => Math.max(0, owed - 1) + carnages);
    if (carnages > 0) {
      this.attack.carnageUsed.set(true);
    }
  }

  /** « Appliquer » : les dégâts vont à la cible. `then` passe une fois le coup conclu (pas s'il est abandonné). */
  apply(then: () => void = () => undefined): void {
    const target = this.turn.target();
    const damage = this.damage.damage();
    if (!target || damage === null) {
      return;
    }
    if (this.attack.picks().includes('pietaille') && target.rang === PIETAILLE) {
      this.massacre(target, damage, then);
      return;
    }
    if (this.loadout.sortMode()) {
      // Les dégâts du sort : le sort reste écrit sur sa ligne, il ne reste qu'à finir le tour.
      const hit = {target, damage, unarmed: false};
      this.turn.damageApplied.emit(hit);
      this.attack.sortDamageDone.set(true);
      this.damage.resetRoll();
      this.lastHit.set(hit);
      this.turn.focusAfterRender(() => this.turn.endButton());
      then();
      return;
    }
    this.freezePlayed(target);
    this.conclude(target);
    const hit = {target, damage, unarmed: this.loadout.unarmed(), nonLetal: this.loadout.nonLetal()};
    this.turn.damageApplied.emit(hit);
    this.resetRoll();
    this.lastHit.set(hit);
    this.turn.focusAfterRender(() => (this.attack.carnageOwed() > 0 ? this.turn.attackInput() : this.turn.endButton()));
    then();
  }

  /** « Massacrer la piétaille » (livre p. 59) : les dégâts du coup sont le nombre de piétailles mises hors de combat. Le dialogue propose
   * qui tombe — la cible, puis les autres piétailles debout de son camp — et le MJ coche ou décoche ; chacune est mise hors de combat.
   * Fermé sans appliquer, le coup reste à conclure. */
  private massacre(target: TapisCard, damage: number, then: () => void): void {
    const candidats = candidatsMassacre(target, this.turn.targets());
    const attaquant = this.turn.card().nom;
    this.dialog
      .open<MassacrePietailleDialogComponent, MassacrePietailleDialogData, MassacrePietailleResult>(MassacrePietailleDialogComponent, {
        width: 'min(440px, 94vw)',
        data: {attaquantNom: attaquant, degats: damage, candidats},
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result || this.turn.target()?.key !== target.key) {
          return;
        }
        const tombes = candidats.filter((card) => result.tombes.includes(card.key));
        this.freezePlayed(target);
        this.conclude(target);
        for (const card of tombes) {
          this.turn.damageApplied.emit({target: card, damage: Math.max(1, card.vitaliteCourante ?? card.vitaliteMax ?? 1), unarmed: false});
        }
        this.resetRoll();
        this.lastHit.set({target, damage: 0, unarmed: false, massacre: tombes.map((card) => card.nom)});
        this.turn.focusAfterRender(() => (this.attack.carnageOwed() > 0 ? this.turn.attackInput() : this.turn.endButton()));
        then();
      });
  }

  /** Carnage pris deux fois : l'attaque qu'il donne a raté, la suivante reste due. Celle-ci compte, et le jet s'efface pour la suivante
   * (contre la même cible, ou une autre). */
  nextCarnageAttack(): void {
    if (this.attack.carnageRemaining() === 0) {
      return;
    }
    this.attack.carnageOwed.update((owed) => Math.max(0, owed - 1));
    this.resetRoll();
    this.turn.focusAfterRender(() => this.turn.attackInput() ?? this.cible.firstPick());
  }

  /** Fige le coup qui se conclut, avant que le jet s'efface (cf. `PlayedAttack`). */
  private freezePlayed(target: TapisCard): void {
    const verdict = this.attack.attackVerdict();
    if (!verdict) {
      return;
    }
    const counts = this.attack.pickCounts();
    const picks = HEROIC_OPTIONS.filter((o) => counts[o.slug]).map((o) => ((counts[o.slug] ?? 0) > 1 ? `${o.label} ×${counts[o.slug]}` : o.label));
    const armed = this.loadout.displayArmes().length > 0;
    this.playedAttack.set({
      target,
      arme: armed ? (this.loadout.effectiveArme()?.arme?.arme ?? null) : null,
      degats: armed ? this.loadout.degats() : this.turn.card().degats,
      options: this.loadout.activeOptions(),
      goal: this.attack.attackGoal(),
      dice: this.attack.attackRowDice(),
      total: this.attack.diceSum(),
      slots: this.loadout.diceCount(),
      sum: this.attack.attackSum(),
      verdict,
      picks: picks.length > 0 ? picks.join(' · ') : null,
    });
  }

  /** « Autre attaque », après le coup joué (une créature qui frappe plusieurs fois par round) : les lignes du coup et de l'attaque se
   * rouvrent ; la main va à la case du jet, ou au choix de la cible si elle est tombée. */
  newAttack(): void {
    this.playedAttack.set(null);
    this.turn.focusAfterRender(() => this.turn.attackInput() ?? this.cible.firstPick());
  }

  /** Parade in extremis : la cible dépense 1 point d'héroïsme (ou de vilénie) et interpose son bouclier ou son arme (au choix quand elle a les deux), qui est brisé ; le
   * coup ne fait pas de dégâts, et ses options héroïques non plus. Un Carnage garde son attaque de plus. */
  parry(): void {
    const target = this.turn.target();
    if (!target || !this.cible.canParry()) {
      return;
    }
    // Ce qu'elle interpose : son bouclier, ou son arme quand elle a les deux et que le MJ l'a choisie.
    const bouclier = this.cible.parryWith() === 'bouclier';
    this.turn.targetHeroismeAdjusted.emit({card: target, delta: -1});
    this.turn.effectAdded.emit(effetParade(target.key, bouclier));
    this.freezePlayed(target);
    this.conclude(target, false);
    this.resetRoll();
    this.lastHit.set({target, damage: 0, unarmed: false, parried: bouclier ? 'bouclier' : 'arme'});
    this.turn.focusAfterRender(() => (this.attack.carnageOwed() > 0 ? this.turn.attackInput() : this.turn.endButton()));
  }

  /** « Bouclier humain » : le rival dépense 1 point de vilénie et pousse un de ses sbires devant le coup. Le sbire encaisse le coup à
   * sa place : une piétaille tombe au premier coup, il est mis hors de combat (toute sa vitalité restante, sans calcul contre une armure
   * qui n'est pas la sienne). Le rival ne subit rien, et les options héroïques du coup tombent avec lui. */
  humanShield(): void {
    const target = this.turn.target();
    const sbire = this.cible.sbire();
    if (!target || !sbire || !this.cible.canHumanShield()) {
      return;
    }
    this.turn.targetHeroismeAdjusted.emit({card: target, delta: -1});
    this.turn.damageApplied.emit({target: sbire, damage: Math.max(1, sbire.vitaliteCourante ?? 1), unarmed: this.loadout.unarmed(), nonLetal: this.loadout.nonLetal()});
    this.freezePlayed(target);
    this.conclude(target, false);
    this.resetRoll();
    this.lastHit.set({target, damage: 0, unarmed: false, parried: 'sbire', sbire: sbire.nom});
    this.turn.focusAfterRender(() => (this.attack.carnageOwed() > 0 ? this.turn.attackInput() : this.turn.endButton()));
  }

  /** Ouvre « Juste une égratignure » : la main passe au champ du dé. Le point n'est dépensé qu'une fois le dé connu. */
  startScratch(): void {
    if (!this.canScratch() || this.turn.rolling()) {
      return;
    }
    this.scratching.set(true);
    this.turn.focusAfterRender(() => this.turn.scratchInput());
  }

  /** Échap ou « Annuler » : la saisie se referme sans rien dépenser (Échap ne va pas plus loin que ce champ). */
  cancelScratch(event?: Event): void {
    event?.preventDefault();
    this.scratching.set(false);
  }

  /** Le d6B lancé à table : le dé gardé, un chiffre de 1 à 6, pris tout de suite. */
  onScratchInput(raw: string): void {
    const text = raw.trim();
    if (/^[1-6]$/.test(text)) {
      this.applyScratch([Number(text)]);
    }
  }

  /** Le d6B lancé à l'écran : deux d6, le meilleur compte. */
  async rollScratch(): Promise<void> {
    if (!this.canScratch() || this.turn.rolling()) {
      return;
    }
    this.applyScratch(await this.turn.throwDice('2d6', 2));
  }

  /** « Juste une égratignure » : la cible dépense 1 point d'héroïsme (ou de vilénie) pour son d6B ; elle récupère autant de vitalité,
   * sans dépasser les dégâts du coup, et perd sa prochaine action. */
  private applyScratch(des: readonly number[]): void {
    const hit = this.lastHit();
    if (!hit || !this.canScratch()) {
      return;
    }
    const {die, healed} = egratignure(des, hit.damage);
    this.turn.targetHeroismeAdjusted.emit({card: hit.target, delta: -1});
    this.turn.vitaliteAdjusted.emit({card: hit.target, delta: healed});
    this.turn.effectAdded.emit(effetActionPerdue(hit.target.key));
    this.lastHit.set({...hit, scratch: {die, healed}});
  }

  /** Désarmement : pas de dégâts à appliquer. Le coup se conclut, et le tour finit — sauf si un Carnage donne une nouvelle attaque. */
  concludeWithoutDamage(): void {
    const target = this.turn.target();
    if (!target) {
      return;
    }
    this.conclude(target);
    // Le jet s'efface tout de suite : le bouton disparaît, un second clic ne conclut pas deux fois.
    this.resetRoll();
    if (this.attack.carnageOwed() > 0) {
      this.turn.focusAfterRender(() => this.turn.attackInput());
    } else {
      this.turn.endTurnRequested.emit(true);
    }
  }

  /** « Fin du tour » (bouton ou touche F). Un coup qui a touché sans être appliqué perdrait ses dégâts et les effets de ses options
   * héroïques : le MJ choisit d'abord de l'appliquer et finir, de finir sans l'appliquer, ou de rester sur le tour. */
  requestEndTurn(): void {
    if (this.loadout.defenseTotale()) {
      this.turn.totalDefenseRequested.emit(this.loadout.effectiveSpecial()?.slug === 'dual-parry');
      return;
    }
    const target = this.turn.target();
    const touche = this.loadout.sortMode() ? this.damage.hasDamageStep() : !!this.attack.verdict()?.hit;
    if (!target || !touche) {
      this.turn.endTurnRequested.emit(false);
      return;
    }
    const damage = this.damage.hasDamageStep() ? this.damage.damage() : null;
    this.dialog
      .open<EndTurnDialogComponent, EndTurnDialogData, EndTurnChoice>(EndTurnDialogComponent, {
        width: '440px',
        data: {attackerNom: this.turn.card().nom, targetNom: target.nom, damage, canApply: !this.damage.hasDamageStep() || damage !== null},
      })
      .afterClosed()
      .subscribe((choice) => {
        if (choice === 'apply' && this.damage.hasDamageStep()) {
          // Le tour finit une fois le coup conclu (après le dialogue du massacre, s'il y en a un).
          this.apply(() => this.turn.endTurnRequested.emit(true));
          return;
        }
        if (choice === 'apply') {
          this.conclude(target);
          this.resetRoll();
        }
        if (choice) {
          this.turn.endTurnRequested.emit(choice === 'apply');
        }
      });
  }

  private resetRoll(): void {
    this.damage.resetRoll();
    this.attack.resetRoll();
  }
}
