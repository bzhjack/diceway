import {LiveAnnouncer} from '@angular/cdk/a11y';
import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {cartesVisibles} from '../../magie-combat.util';
import {EMPTY, map, of, switchMap, tap} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {AttackChoice} from '../../models/attack-options.model';
import {bloqueeCeRound, cibleAuHasard, commencerTour, effetsDerives, etatEnregistre, poserEffet, remettreAuCombat, retirerDuCombat, endTurn, giveBackTurn, herosMourants, hordeMates, normalizeEtat, orderCards, raisonHorsJeu, targetableKeys, tokenForCard, totalDefense, turnAnnouncement, turnState} from '../tapis/combat-turn.util';
import {peutFuir} from '../tapis/fuite-opportune.util';
import {disponibiliteMelee, pietailleDebout} from '../tapis/melee-pietaille.util';
import {MeleeCamps, MeleeDisponibilite} from '../../models/melee-pietaille.model';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {EtatSaver} from '../etat-saver';
import {annonceEffetsTombes, appliquerEvenement, effetsDeLaFrise, effetsDeTour, effetsTombes, idAleatoire} from '../tapis/combat-effects.util';
import {EtatCombat} from '../../models/combat-turn.model';
import {TurnOrderEntry, TurnOrderInterrupter} from '../../models/turn-order.model';
import {findCard} from '../tapis/tapis.util';
import {peutSecourir} from '../../rescue.util';
import {TapisCard} from '../../models/tapis.model';
import {TableStore} from './table.store';

/** Le tour de combat : l'état gardé dans la session, l'ordre de jeu, la carte active et sa cible, et ce qui fait avancer le tour (enregistré en série par `EtatSaver`). Les règles elles-mêmes sont dans `combat-turn.util.ts`. */
@Injectable()
export class CombatTurnStore {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly table = inject(TableStore);
  private readonly announcer = inject(LiveAnnouncer);

  /** État du combat gardé dans la session (round, cartes qui ont joué, défense totale). */
  readonly etat = computed<EtatCombat>(() => normalizeEtat(this.table.session()?.etat_combat));

  /** Cartes retardées ce round : elles passent après tous les autres. Valable pour un seul round. */
  private readonly delayed = signal<{readonly round: number; readonly keys: readonly string[]}>({round: 0, keys: []});

  /** Un héros qui a retardé son action l'interrompt (1 point d'héroïsme) : il passe devant tout le monde, ce round seulement. */
  private readonly interrupting = signal<{readonly round: number; readonly key: string} | null>(null);

  /** Cartes dans l'ordre de jeu : initiative BoL des jetons. */
  private readonly orderedCards = computed(() => {
    const base = orderCards(this.table.cards(), this.table.board()?.tokens ?? []);
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
      effets: effetsDeLaFrise(this.etat().effets, card.key),
      horsCombat: raisonHorsJeu(card, this.etat()),
    }));
  });

  /** La piétaille debout de chaque camp, dans l'ordre de jeu, pour la « Mêlée de piétaille ». */
  readonly meleeCamps = computed<MeleeCamps>(() =>
    this.table.mode() === 'combat' ? pietailleDebout(this.orderedCards().map((entry) => entry.card), this.etat()) : {heros: [], adversaires: []},
  );

  /** Le bouton « Mêlée de piétaille » : absent sans piétaille debout des deux côtés, grisé une fois la mêlée de ce round résolue. */
  readonly meleeDisponibilite = computed<MeleeDisponibilite>(() => disponibiliteMelee(this.meleeCamps(), this.etat()));

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

  /** La carte active prépare un sort qui ne blesse pas (l'assistant le dit) : elle peut viser son propre camp. */
  readonly ciblesAlliees = signal(false);

  /** Cartes que la carte active peut viser : le camp d'en face, hors combat exclu ; tout le monde en combat pour un sort qui ne blesse pas. */
  readonly targets = computed(() => {
    const targetable =
      this.table.mode() === 'combat' ? targetableKeys(this.orderedCards(), this.turn().activeKey, this.etat().exclus, this.ciblesAlliees()) : new Set<string>();
    return this.table.cards().filter((card) => targetable.has(card.key));
  });

  readonly selectedTarget = computed(() => this.targets().find((card) => card.key === this.targetKey()) ?? null);

  /** Les êtres qu'un prêtre peut voir, pour un dé de foi (livre p. 146) : les cartes encore en combat et debout, des deux camps. */
  readonly visibles = computed(() => (this.table.mode() === 'combat' ? cartesVisibles(this.table.cards(), this.etat().exclus) : []));

  // Des valeurs simples, pas les cartes : la table rechargée refait des cartes identiques, qui ne doivent pas relancer la lecture.
  readonly activeKey = computed(() => (this.table.mode() === 'combat' ? this.turn().activeKey : null));

  readonly targetKeys = computed(() => this.targets().map((card) => card.key).join(','));

  /** Les héros mourants (ni stabilisés, ni retirés du combat) que la carte active — un héros, ou un PNJ allié — peut tenter de secourir à
   * son tour. */
  readonly rescuePatients = computed(() => {
    const active = this.activeCard();
    if (!active || !peutSecourir(active)) {
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

  /** Le round que cet écran vient de faire commencer, une fois la session à jour : c'est lui qui en joue le début (mourants, démons qui se
   * régénèrent, héros à 0 : `CombatWoundsService`). Un nouveau round reçu dans une session (un second écran ouvert sur la même table)
   * n'y passe pas : son début est déjà joué par l'écran qui l'a commencé. Un objet neuf à chaque fois, pour qu'un combat suivant qui
   * atteint le même numéro de round soit annoncé aussi. */
  readonly roundCommenceIci = signal<{readonly round: number} | null>(null);

  /** Les effets du dernier état vu en combat, pour annoncer ceux qui expirent ; `null` hors combat (le premier état n'annonce rien). */
  private effetsVus: readonly CombatEffect[] | null = null;
  /** Les effets que le MJ a retirés lui-même : il le sait, rien à annoncer. */
  private readonly retiresALaMain = new Set<string>();

  /** Enregistre l'état du combat en série (cf. `EtatSaver`) ; la réponse porte la session à jour : l'affichage suit la base. */
  private readonly etatSaver = new EtatSaver(
    () => this.etat(),
    (next) => {
      const sessionId = this.table.sessionId();
      if (!sessionId || this.table.mode() !== 'combat') {
        return EMPTY;
      }
      const roundAvant = this.etat().round;
      return this.fightSessionService
        .updateCombatState(sessionId, {round: next.round, joues: [...next.joues], effets: [...next.effets], exclus: [...next.exclus], fuis: [...next.fuis], melee: next.melee})
        .pipe(
          tap((session) => {
            this.table.session.set(session);
            if (next.round > roundAvant) {
              this.roundCommenceIci.set({round: next.round});
            }
          }),
        );
    },
    (error) => this.table.notifyError(error, "Impossible d'enregistrer l'état du combat."),
    // La réponse a pu se perdre : la session relue dit si l'état y est passé. S'il y a fait commencer un round, c'est cet écran qui en
    // joue le début, comme s'il avait reçu la réponse.
    (voulu, avant) => {
      const sessionId = this.table.sessionId();
      if (!sessionId) {
        return of(false);
      }
      return this.fightSessionService.fightSession(sessionId).pipe(
        map((session) => {
          this.table.session.set(session);
          const passe = etatEnregistre(normalizeEtat(session.etat_combat), avant, voulu);
          if (passe && voulu.round > avant.round) {
            this.roundCommenceIci.set({round: voulu.round});
          }
          return passe;
        }),
      );
    },
  );

  constructor() {
    // Une carte devient active (après « Retarder », un retrait, le début du combat…) : ses effets « jusqu'à son prochain tour » tombent,
    // et son tour est sauté si elle a perdu son action (« Juste une égratignure »). L'effet ne lit que la clé de la carte active : chaque
    // réponse du serveur refait `turn`, et un effet posé sur la carte qui joue ne doit ni sauter son tour en cours ni tomber aussitôt.
    // « Fin du tour » passe elle-même par `commencerTour`.
    effect(() => {
      const key = this.activeKey();
      if (key !== null) {
        untracked(() => this.saveEtat((etat) => commencerTour(this.orderedCards(), etat, idAleatoire)));
      }
    });

    // Un effet qui expire (fin de tour, de round, usage consommé) quitte la frise : un lecteur d'écran l'apprend.
    effect(() => {
      const enCombat = this.table.mode() === 'combat';
      const effets = this.etat().effets;
      untracked(() => {
        const avant = this.effetsVus;
        this.effetsVus = enCombat ? effets : null;
        if (!enCombat || avant === null) {
          return;
        }
        const annonce = annonceEffetsTombes(effetsTombes(avant, effets, this.retiresALaMain), (carte) => findCard(this.table.cards(), carte)?.nom ?? 'une carte');
        if (annonce) {
          void this.announcer.announce(annonce, 'polite');
        }
      });
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

  /** Un rival peut-il prendre la fuite (« Fuite opportune ») : en combat, un rival adverse qui a encore de la vilénie et n'a pas déjà quitté
   * le combat. */
  canFlee(card: TapisCard): boolean {
    return this.table.mode() === 'combat' && peutFuir(card, this.etat());
  }

  /** « Fuite opportune » (04-pnj-creatures-demons.md, « Points de vilenie ») : le rival dépense 1 point de vilénie et quitte le combat. Il ne
   * joue plus, ne se vise plus et ne compte plus pour l'issue ; la frise le dit « enfui », sa fiche reste sur la table. Le serveur fait les
   * deux en une seule transaction : si l'appel échoue, rien n'a changé, la vilénie est intacte et le rival reste. Un état du combat
   * enregistré ensuite sans la fuite ne la défait pas (le serveur garde les rivaux enfuis). */
  flee(card: TapisCard): void {
    const sessionId = this.table.sessionId();
    if (!sessionId || !this.canFlee(card)) {
      return;
    }
    this.fightSessionService.fuiteOpportune(sessionId, card.pivotId).subscribe({
      next: (session) => {
        this.table.session.set(session);
        if (this.targetKey() === card.key) {
          this.targetKey.set(null);
        }
        this.snackBar.open(`${card.nom} prend la fuite (−1 vilénie) : il quitte le combat.`, undefined, {duration: 5000});
      },
      error: (error: unknown) => this.table.notifyError(error, `${card.nom} n'a pas pu prendre la fuite : sa vilénie n'est pas dépensée.`),
    });
  }

  /** Le MJ peut retirer du combat une carte qui y est encore (ni retirée, ni enfuie). */
  canWithdraw(card: TapisCard): boolean {
    return this.table.mode() === 'combat' && !this.etat().exclus.includes(card.key);
  }

  /** « Retirer du combat » (`retirerDuCombat`) : la carte reste sur la table mais ne joue plus et ne compte plus ; si c'était la cible, elle
   * ne l'est plus. Si c'était la carte active, la main passe. */
  withdraw(card: TapisCard): void {
    if (!this.canWithdraw(card)) {
      return;
    }
    if (this.targetKey() === card.key) {
      this.targetKey.set(null);
    }
    this.saveEtat((etat) => retirerDuCombat(etat, card.key));
    this.snackBar.open(`${card.nom} est retiré du combat : il ne joue plus et ne compte plus pour l'issue.`, undefined, {duration: 4500});
  }

  /** « Remettre au combat » (`remettreAuCombat`), depuis son médaillon barré de la frise : la carte retirée revient et joue de nouveau. */
  reintegrate(key: string): void {
    const card = findCard(this.table.cards(), key);
    if (this.table.mode() !== 'combat' || !card || this.etat().fuis.includes(key) || !this.etat().exclus.includes(key)) {
      return;
    }
    this.saveEtat((etat) => remettreAuCombat(etat, key));
    this.snackBar.open(`${card.nom} revient au combat.`, undefined, {duration: 4000});
  }

  /** La mêlée de piétaille de ce round est résolue (ou commencée) : elle ne se rejoue qu'au round suivant. Déjà retenue, rien n'est
   * enregistré de nouveau. */
  recordMelee(): void {
    this.saveEtat((etat) => (etat.melee === etat.round ? etat : {...etat, melee: etat.round}));
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
    } else if (attacker && (attacker.key !== target.key || this.ciblesAlliees())) {
      // Un sort qui ne blesse pas peut viser son lanceur lui-même.
      this.targetKey.set(target.key);
    }
  }

  /** Le MJ retire un effet (croix d'une puce ou du bloc « Effets en cours »). */
  onEffectRemoved(id: string): void {
    this.retiresALaMain.add(id);
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'retrait-manuel', id})]}));
  }

  /** Le MJ ajoute un effet depuis le menu « + Effet » (ou l'assistant en pose un) : cf. `poserEffet`. */
  onEffectAdded(effet: NewEffect): void {
    this.saveEtat((etat) => poserEffet(this.orderedCards(), etat, effet, idAleatoire));
  }
}
