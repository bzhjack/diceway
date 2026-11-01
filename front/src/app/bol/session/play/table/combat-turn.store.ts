import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EMPTY, switchMap, tap} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {AttackChoice} from '../../models/attack-options.model';
import {bloqueeCeRound, cibleAuHasard, debutDeTour, effetsDerives, endTurn, giveBackTurn, herosMourants, hordeMates, horsCombat, normalizeEtat, orderCards, targetableKeys, tokenForCard, totalDefense, turnAnnouncement, turnState} from '../tapis/combat-turn.util';
import {NewEffect} from '../../models/combat-effect.model';
import {EtatSaver} from '../etat-saver';
import {appliquerEvenement, effetsDeTour, idAleatoire, libelleDuree, libelleEffet} from '../tapis/combat-effects.util';
import {DeMj, EtatCombat} from '../../models/combat-turn.model';
import {TurnOrderEntry, TurnOrderInterrupter} from '../../models/turn-order.model';
import {findCard} from '../tapis/tapis.util';
import {TapisCard} from '../../models/tapis.model';
import {TableStore} from './table.store';

/** Le tour de combat : l'état gardé dans la session, l'ordre de jeu, la carte active et sa cible, et ce qui fait avancer le tour (enregistré en série par `EtatSaver`). Les règles elles-mêmes sont dans `combat-turn.util.ts`. */
@Injectable()
export class CombatTurnStore {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly table = inject(TableStore);

  /** État du combat gardé dans la session (round, cartes qui ont joué, défense totale). */
  readonly etat = computed<EtatCombat>(() => normalizeEtat(this.table.session()?.etat_combat));

  /** Cartes retardées ce round : elles passent après tous les autres. Valable pour un seul round. */
  private readonly delayed = signal<{readonly round: number; readonly keys: readonly string[]}>({round: 0, keys: []});

  /** Un héros qui a retardé son action l'interrompt (1 point d'héroïsme) : il passe devant tout le monde, ce round seulement. */
  private readonly interrupting = signal<{readonly round: number; readonly key: string} | null>(null);

  /** Cartes dans l'ordre de jeu : initiative BoL des jetons, puis ordre manuel du MJ. */
  private readonly orderedCards = computed(() => {
    const base = orderCards(this.table.cards(), this.table.board()?.tokens ?? [], null);
    const round = this.etat().round;
    const delayedKeys = this.delayed().round === round ? this.delayed().keys : [];
    const ordered = [...base.filter((e) => !delayedKeys.includes(e.card.key)), ...delayedKeys.flatMap((k) => base.filter((e) => e.card.key === k))];
    const first = this.interrupting()?.round === round ? this.interrupting()?.key : null;
    // Ceux qui ont déjà joué restent « joués » : passer devant fait de lui la prochaine carte à jouer, avant la carte active.
    return first ? [...ordered.filter((e) => e.card.key === first), ...ordered.filter((e) => e.card.key !== first)] : ordered;
  });

  /** Les héros qui ont retardé leur action ce round, n'ont pas encore joué et peuvent jouer : ils peuvent interrompre la carte active. */
  readonly interrupters = computed<readonly TurnOrderInterrupter[]>(() => {
    const round = this.etat().round;
    if (this.table.mode() !== 'combat' || this.delayed().round !== round) {
      return [];
    }
    const statuses = this.turn().statuses;
    return this.delayed()
      .keys.map((key) => this.table.cards().find((card) => card.key === key))
      .filter((card): card is TapisCard => !!card && card.kind === 'hero' && statuses.get(card.key) === 'upcoming')
      .map((card) => ({key: card.key, nom: card.nom}));
  });

  private readonly turn = computed(() => turnState(this.orderedCards(), this.etat()));

  /** Carte dont c'est le tour — `null` hors combat, ou quand plus personne ne peut jouer. */
  readonly activeCard = computed(() => (this.table.mode() === 'combat' ? findCard(this.table.cards(), this.turn().activeKey) : null));

  readonly turnEntries = computed<readonly TurnOrderEntry[]>(() => {
    const statuses = this.turn().statuses;
    const round = this.etat().round;
    return this.orderedCards().map(({card, tier, lockedRound1}) => ({
      key: card.key,
      nom: card.nom,
      kind: card.kind,
      avatar: card.avatar,
      status: statuses.get(card.key) ?? 'upcoming',
      tier: tier,
      locked: bloqueeCeRound(lockedRound1, round),
      ally: card.kind !== 'hero' && card.camp === 'heros',
      effets: this.etat()
        .effets.filter((e) => e.porteur === card.key && e.valeur !== 0)
        .map((e) => `${libelleEffet(e)} · ${libelleDuree(e.duree)}`),
      horsCombat: horsCombat(card, this.etat().effets),
    }));
  });

  /** Les effets que montre l'écran de combat : ceux du registre, plus ceux qui se déduisent de l'état (bouclier perdu au round 1). */
  readonly effetsAffiches = computed(() => [...this.etat().effets, ...effetsDerives(this.orderedCards(), this.etat().round)]);

  readonly turnAnnouncement = computed(() => turnAnnouncement(this.orderedCards(), this.etat()));

  /** Arme et posture choisies dans la barre d'action — `null` si le choix n'est pas jouable. */
  readonly attackChoice = signal<AttackChoice | null>({degats: null, posture: null, special: null});

  /** Les piétailles qui peuvent se joindre à l'attaque de la carte active, une piétaille, en horde. */
  readonly hordeMates = computed(() => (this.table.mode() === 'combat' ? hordeMates(this.orderedCards(), this.etat()) : []));

  /** Celles que le MJ a engagées dans la horde (choisies dans l'assistant) : leur tour finit avec celui de la carte active. */
  readonly hordeKeys = signal<readonly string[]>([]);

  /** Cible visée par la carte active (choisie dans l'assistant ou d'un clic sur sa carte). */
  private readonly targetKey = signal<string | null>(null);

  /** Cartes que la carte active peut viser : le camp d'en face, hors combat exclu. */
  readonly targets = computed(() => {
    const targetable = this.table.mode() === 'combat' ? targetableKeys(this.orderedCards(), this.turn().activeKey, this.etat().exclus) : new Set<string>();
    return this.table.cards().filter((card) => targetable.has(card.key));
  });

  readonly selectedTarget = computed(() => this.targets().find((card) => card.key === this.targetKey()) ?? null);

  // Des valeurs simples, pas les cartes : la table rechargée refait des cartes identiques, qui ne doivent pas relancer la lecture.
  readonly activeKey = computed(() => (this.table.mode() === 'combat' ? this.turn().activeKey : null));

  readonly targetKeys = computed(() => this.targets().map((card) => card.key).join(','));

  /** Les héros mourants (ni stabilisés, ni retirés du combat) qu'un héros actif peut tenter de secourir à son tour. */
  readonly rescuePatients = computed(() => {
    const active = this.activeCard();
    if (active?.kind !== 'hero' || active.camp !== 'heros') {
      return [];
    }
    return herosMourants(this.table.cards(), this.etat()).filter((card) => card.camp === 'heros' && card.key !== active.key);
  });

  /** L'attaquant actif a obtenu un succès légendaire à la réaction : +1 à ses jets d'attaque. */
  readonly legendaryForActive = computed(() => {
    const active = this.activeCard();
    const token = active ? tokenForCard(this.table.board()?.tokens ?? [], active) : null;
    return token?.tier === 'legendaire';
  });

  /** Enregistre l'état du combat en série (cf. `EtatSaver`) ; la réponse porte la session à jour : l'affichage suit la base. */
  private readonly etatSaver = new EtatSaver(
    () => this.etat(),
    (next) => {
      const sessionId = this.table.sessionId();
      if (!sessionId || this.table.mode() !== 'combat') {
        return EMPTY;
      }
      return this.fightSessionService
        .updateCombatState(sessionId, {round: next.round, joues: [...next.joues], effets: [...next.effets], exclus: [...next.exclus], deMj: next.deMj})
        .pipe(tap((session) => this.table.session.set(session)));
    },
    (error) => this.table.notifyError(error, "Impossible d'enregistrer l'état du combat."),
  );

  constructor() {
    // Une carte devient active (après « Retarder », un retrait, le début du combat…) : ses effets « jusqu'à son prochain tour » tombent.
    effect(() => {
      const key = this.turn().activeKey;
      if (key !== null) {
        untracked(() => this.saveEtat((etat) => debutDeTour(etat, key)));
      }
    });

    // Un adversaire prend la main sans cible choisie : un héros au hasard est présélectionné comme cible ; le MJ peut en changer.
    effect(() => {
      const key = this.activeKey();
      untracked(() => {
        if (key === null || this.targetKey() !== null) {
          return;
        }
        const cible = cibleAuHasard(this.activeCard(), this.targets());
        if (cible) {
          this.targetKey.set(cible.key);
        }
      });
    });
  }

  saveEtat(update: (etat: EtatCombat) => EtatCombat, options?: {readonly ignoreIfBusy?: boolean}): boolean {
    return this.etatSaver.apply(update, options);
  }

  /** Le dé du MJ pour tous (options du combat) : ajouté à chaque jet d'attaque des héros, tant qu'il est choisi ; gardé dans l'état du combat. */
  setDeMj(deMj: DeMj | null): void {
    this.saveEtat((etat) => ({...etat, deMj}));
  }

  /** « Interrompre une action » (02-actions-combat.md, « Retarder son action et interrompre ») : le héros qui a retardé la sienne dépense
   * 1 point d'héroïsme et agit tout de suite, avant la carte active, qui reprendra la main après lui. */
  onInterrupt(key: string): void {
    const card = this.table.cards().find((c) => c.key === key);
    const active = this.activeCard();
    if (!card?.sourceId || !active) {
      return;
    }
    this.herosService
      .heros(card.sourceId)
      .pipe(
        switchMap((hero) => {
          if (hero.ressources.heroisme <= 0) {
            this.snackBar.open(`${card.nom} n'a plus de point d'héroïsme pour interrompre.`, undefined, {duration: 4000});
            return EMPTY;
          }
          return this.herosService.adjustHeroisme(card.sourceId!, -1);
        }),
      )
      .subscribe({
        next: () => {
          const round = this.etat().round;
          this.interrupting.set({round, key});
          this.delayed.update((d) => ({round: d.round, keys: d.keys.filter((k) => k !== key)}));
          this.targetKey.set(null);
          this.snackBar.open(`${card.nom} interrompt ${active.nom} et agit tout de suite (−1 PH).`, undefined, {duration: 4000});
        },
        error: (error: unknown) => this.table.notifyError(error, "Impossible d'interrompre."),
      });
  }

  /** « Retarder » : la carte active joue en dernier ce round. */
  onDelay(): void {
    const active = this.activeCard();
    if (!active) {
      return;
    }
    const round = this.etat().round;
    this.targetKey.set(null);
    this.delayed.update((d) => ({round, keys: [...(d.round === round ? d.keys : []).filter((k) => k !== active.key), active.key]}));
  }

  /** Fin du tour de la carte active. `afterHit` : elle suit un coup qu'on vient de conclure, dont les effets sont peut-être en cours
   * d'enregistrement — elle passe alors après eux, au lieu d'être ignorée comme un double clic. */
  onEndTurn(afterHit = false): void {
    const active = this.activeCard();
    // La posture choisie pour ce tour dure : son bonus ou malus de défense pèse sur les attaques suivantes contre cette carte.
    const crees = active ? effetsDeTour(active.key, {posture: this.attackChoice()?.posture?.slug ?? null, special: this.attackChoice()?.special?.slug ?? null, defenseTotale: false}) : [];
    // La cible ne se vide que si la fin de tour est prise en compte : pendant un enregistrement elle est ignorée, et le jet en cours reste.
    if (this.saveEtat((etat) => endTurn(this.orderedCards(), etat, crees, idAleatoire, this.hordeKeys()), {ignoreIfBusy: !afterHit})) {
      this.targetKey.set(null);
    }
  }

  onTotalDefense(parade: boolean): void {
    if (this.saveEtat((etat) => totalDefense(this.orderedCards(), etat, idAleatoire, parade), {ignoreIfBusy: true})) {
      this.targetKey.set(null);
    }
  }

  onGiveBackTurn(key: string): void {
    this.saveEtat((etat) => giveBackTurn(etat, key), {ignoreIfBusy: true});
  }

  /** Clic sur une carte désignable (ou « Attaquer cette carte ») : elle devient la cible de la carte active. */
  onAttackCard(target: TapisCard | null): void {
    const attacker = this.activeCard();
    if (target === null) {
      this.targetKey.set(null);
    } else if (attacker && attacker.key !== target.key) {
      this.targetKey.set(target.key);
    }
  }

  /** Le MJ retire un effet (croix d'une puce ou du bloc « Effets en cours »). */
  onEffectRemoved(id: string): void {
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'retrait-manuel', id})]}));
  }

  /** Le MJ ajoute un effet depuis le menu « + Effet ». */
  onEffectAdded(effet: NewEffect): void {
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'ajout-manuel', effet}, idAleatoire)]}));
  }
}
