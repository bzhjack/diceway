import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {catchError, concatMap, EMPTY, forkJoin, from, map, Observable, of, switchMap, take, tap, toArray} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolFightSessionModel} from '../../models/bol-fight-session.model';
import {BolSceneModel} from '../../models/bol-scene.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolCombatReferenceService} from '../../services/bol-combat-reference.service';
import {BolCombatOptionModel} from '../../models/bol-combat-reference.model';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolPnjService} from '../../services/bol-pnj.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {CombatantKind} from '../../models/combat-selection.model';
import {BolStatblockData} from '../../shared/models/bol-statblock.model';
import {
  creatureStatblockData,
  demonStatblockData,
  pnjStatblockData,
} from '../../shared/statblock/bol-statblock.builders';
import {resolveAttackStats} from '../combat-attack.util';
import {buildPlayBoard} from '../combat-play.util';
import {ActionRollCarriere, ActionRollDiceTrait} from '../models/action-roll.model';
import {SceneActionsService} from '../scene-actions.service';
import {AddCombatantDialogComponent, resolveAddCombatantCamp} from './add-combatant-dialog/add-combatant-dialog';
import {openCommandPalette} from './command-palette/command-palette';
import {PaletteActionId, PaletteCommand, PaletteContext} from '../models/command-palette.model';
import {isEditable, isEndTurnShortcut, isPaletteShortcut} from './command-palette/shortcut.util';
import {reserveTab} from './reserve/reserve.util';
import {maybePromptDefierLaMort} from './defier-la-mort-dialog/defier-la-mort.util';
import {shouldPromptDefierLaMort} from '../combat-resolution.util';
import {tableTitle} from './scene-list/scene.util';
import {SessionHeaderComponent} from './session-header/session-header';
import {ReserveComponent} from './reserve/reserve';
import {StartCombatDialogComponent} from './start-combat-dialog/start-combat-dialog';
import {browserStorage, readPanelOpen, RESERVE_PANEL_KEY, writePanelOpen} from './table-state.util';
import {ExpandedHeroData} from '../models/expanded-card.model';
import {ExpandedCardDialogData} from '../models/expanded-card-dialog.model';
import {ExpandedCardDialogComponent} from './tapis/expanded-card-dialog';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {equippedArmes} from '../../shared/arme/arme-equipee';
import {AttackChoice} from '../models/attack-options.model';
import {bloqueeCeRound, debutDeTour, effetsDerives, endTurn, giveBackTurn, herosMourants, horsCombat, normalizeEtat, orderCards, targetableKeys, tokenForCard, totalDefense, turnAnnouncement, turnState} from './tapis/combat-turn.util';
import {CombatEffect, NewEffect} from '../models/combat-effect.model';
import {EtatSaver} from './etat-saver';
import {aSombre, appliquerEvenement, degatsMainsNues, effetAssomme, effetDegatsMainsNues, effetInconscient, effetStabilise, effetsDeTour, idAleatoire, libelleDuree, libelleEffet} from './tapis/combat-effects.util';
import {EtatCombat} from '../models/combat-turn.model';
import {CombatBoardComponent} from './combat-board/combat-board';
import {RescueDialogComponent} from './rescue-dialog/rescue-dialog';
import {AfterCombatDialogComponent} from './after-combat-dialog/after-combat-dialog';
import {AfterCombatDialogData, AfterCombatGain, AfterCombatHealer} from '../models/after-combat-dialog.model';
import {bestHealingCareer} from '../rescue.util';
import {RescueDialogData, RescueResult} from '../models/rescue-dialog.model';
import {AppliedHit, ResolvedCombatStats, VitaliteChange} from '../models/combat-attack.model';
import {TurnOrderEntry} from '../models/turn-order.model';
import {TapisComponent} from './tapis/tapis';
import {buildTapisCards, findCard, heroDetails, heroHeaderStats, keepDetailsOrder, REMOVE_ACTION_LABEL} from './tapis/tapis.util';
import {TapisCard} from '../models/tapis.model';

/** Les armes d'un héros dont le catalogue est chargé — vide si elles ne le sont pas (de simples ids). */
function loadedArmes(hero: BolHerosModel): BolHerosArmeModel[] {
  return Array.isArray(hero.armes) && hero.armes.length > 0 && typeof hero.armes[0] !== 'number'
    ? (hero.armes as BolHerosArmeModel[])
    : [];
}

/**
 * La table : page d'accueil d'une session. Orchestre le chargement/la persistance de la session et
 * l'ouverture des dialogs. `bol-tapis` (cartes de personnage sur deux rangs) sert aux deux modes.
 * Mode libre : `bol-reserve` en bandeau. Mode combat : `bol-turn-order` (ordre de jeu) ; le tour est
 * calculé par `combat-turn.util.ts` à partir de l'état gardé dans la session.
 */
@Component({
  selector: 'bol-session-play-page',
  imports: [RouterLink, MatIconModule, MatTooltipModule, SessionHeaderComponent, ReserveComponent, TapisComponent, CombatBoardComponent],
  templateUrl: './session-play-page.html',
  styleUrl: './session-play-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class SessionPlayPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly pnjService = inject(BolPnjService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly selection = inject(CombatSelectionService);
  private readonly sceneService = inject(BolSceneService);
  private readonly sceneActions = inject(SceneActionsService);
  private readonly combatReference = inject(BolCombatReferenceService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly session = signal<BolFightSessionModel | null>(null);

  protected readonly board = computed(() => {
    const session = this.session();
    return session ? buildPlayBoard(session) : null;
  });

  /** Dérivé de `statut` — `'terminee'` n'a pas d'affichage dédié pour l'instant, traité comme `'libre'`. */
  protected readonly mode = computed<'libre' | 'combat'>(() => (this.session()?.statut === 'combat' ? 'combat' : 'libre'));


  protected readonly heroTokens = computed(() => this.board()?.tokens.filter((t) => t.camp === 'heros') ?? []);
  protected readonly sessionId = computed(() => this.session()?.id ?? null);

  /** Page à laquelle revenir depuis un formulaire ou une bibliothèque ouverts depuis la table. */
  protected readonly returnUrl = computed(() => {
    const id = this.sessionId();
    return id ? `/session/${id}/play` : null;
  });

  protected readonly existingHeroIds = computed<ReadonlySet<string>>(
    () => new Set((this.session()?.heros ?? []).map((h) => String(h.heros_id))),
  );

  protected readonly reserveOpen = signal(readPanelOpen(browserStorage(), RESERVE_PANEL_KEY, true));

  /** Cartes du tapis (mode libre), une par ligne de session. */
  protected readonly cards = computed(() => {
    const session = this.session();
    return session ? buildTapisCards(session) : [];
  });

  /** Clé de la carte dépliée. La carte elle-même est retrouvée à chaque rechargement : si elle a
   * quitté la table (retirée, scène chargée en remplacement), plus rien n'est déplié. */
  private readonly expandedKey = signal<string | null>(null);
  protected readonly expandedCard = computed(() => findCard(this.cards(), this.expandedKey()));
  /** Données de la carte dépliée, chargées au dépliage — `null` pendant le chargement. */
  protected readonly expandedHero = signal<ExpandedHeroData | null>(null);
  protected readonly expandedStatblock = signal<BolStatblockData | null>(null);

  /** Options de combat (postures) — référence statique, chargée une fois. */
  protected readonly combatOptions = signal<readonly BolCombatOptionModel[]>([]);

  /** État du combat gardé dans la session (round, cartes qui ont joué, défense totale). */
  protected readonly etat = computed<EtatCombat>(() => normalizeEtat(this.session()?.etat_combat));

  /** Cartes dans l'ordre de jeu : initiative BoL des jetons, puis ordre manuel du MJ. */
  /** Cartes retardées ce round : elles passent après tous les autres. Valable pour un seul round. */
  private readonly delayed = signal<{readonly round: number; readonly keys: readonly string[]}>({round: 0, keys: []});

  private readonly orderedCards = computed(() => {
    const base = orderCards(this.cards(), this.board()?.tokens ?? [], null);
    const delayedKeys = this.delayed().round === this.etat().round ? this.delayed().keys : [];
    return [...base.filter((e) => !delayedKeys.includes(e.card.key)), ...delayedKeys.flatMap((k) => base.filter((e) => e.card.key === k))];
  });

  private readonly turn = computed(() => turnState(this.orderedCards(), this.etat()));

  /** Carte dont c'est le tour — `null` hors combat, ou quand plus personne ne peut jouer. */
  protected readonly activeCard = computed(() => (this.mode() === 'combat' ? findCard(this.cards(), this.turn().activeKey) : null));

  protected readonly turnEntries = computed<readonly TurnOrderEntry[]>(() => {
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
  protected readonly effetsAffiches = computed(() => [...this.etat().effets, ...effetsDerives(this.orderedCards(), this.etat().round)]);

  protected readonly turnAnnouncement = computed(() => turnAnnouncement(this.orderedCards(), this.etat()));

  /** Id du héros actif — les armes ne sont rechargées que lorsqu'il change, pas à chaque
   * rechargement de la session. */
  private readonly activeHeroId = computed(() => {
    const active = this.activeCard();
    return active?.kind === 'hero' ? active.sourceId : null;
  });
  protected readonly activeArmes = signal<readonly BolHerosArmeModel[]>([]);
  /** Toutes les armes du héros actif, équipées ou non — pour l'arme secondaire du combat à deux armes. */
  protected readonly activeOwnedArmes = signal<readonly BolHerosArmeModel[]>([]);
  /** Carrières du héros dont c'est le tour : le MJ peut en laisser une aider une manœuvre ou une feinte. */
  protected readonly activeCarrieres = signal<readonly ActionRollCarriere[]>([]);

  /** Armes proposées à l'assistant : celles du héros actif ; pour un PNJ, toutes ses armes — il les a toutes en main. */
  protected readonly assistantArmes = computed<readonly BolHerosArmeModel[]>(() => {
    const active = this.activeCard();
    if (active?.kind !== 'pnj') {
      return this.activeArmes();
    }
    const armes = this.session()?.pnjs?.find((p) => p.id === active.pivotId)?.armes ?? [];
    return armes
      .filter((a) => a.nom)
      .map((a, index) => ({
        id: 1000 + index,
        arme_id: 1000 + index,
        equipee: true,
        arme: {id: null, arme: a.nom ?? '', type: a.type ?? 'M', degats: a.degats, portee: a.portee ?? null, notes: null},
      }));
  });

  /** Arme et posture choisies dans la barre d'action — `null` si le choix n'est pas jouable. */
  protected readonly attackChoice = signal<AttackChoice | null>({degats: null, posture: null});

  /** Cible visée par la carte active (choisie dans l'assistant ou d'un clic sur sa carte). */
  private readonly targetKey = signal<string | null>(null);

  /** Cartes que la carte active peut viser : le camp d'en face, hors combat exclu. */
  protected readonly targets = computed(() => {
    const targetable = this.mode() === 'combat' ? targetableKeys(this.orderedCards(), this.turn().activeKey, this.etat().exclus) : new Set<string>();
    return this.cards().filter((card) => targetable.has(card.key));
  });
  protected readonly selectedTarget = computed(() => this.targets().find((card) => card.key === this.targetKey()) ?? null);

  /** Statistiques résolues de l'attaquant et de la cible — la défense totale de la cible (+2) est déjà ajoutée. */
  protected readonly attackerStats = signal<ResolvedCombatStats | null>(null);
  protected readonly targetStats = signal<ResolvedCombatStats | null>(null);
  private statsRun = 0;
  /** Le dernier round vu : un nouveau round propose aux héros restés à 0 de reprendre leurs esprits. `null` hors combat et au chargement. */
  private lastRound: number | null = null;
  private readonly combatBoard = viewChild(CombatBoardComponent);

  /** Statistiques de chaque carte que la carte active peut viser (clé de carte → statistiques) : son jeton, dans l'assistant, annonce
   * ce qu'il faut pour la toucher. */
  protected readonly targetsStats = signal<ReadonlyMap<string, ResolvedCombatStats>>(new Map());
  private targetsStatsRun = 0;
  // Des valeurs simples, pas les cartes : la table rechargée refait des cartes identiques, qui ne doivent pas relancer la lecture.
  private readonly activeKey = computed(() => (this.mode() === 'combat' ? this.turn().activeKey : null));
  private readonly targetKeys = computed(() => this.targets().map((card) => card.key).join(','));

  /** Les héros mourants (ni stabilisés, ni retirés du combat) qu'un héros actif peut tenter de secourir à son tour. */
  protected readonly rescuePatients = computed(() => {
    const active = this.activeCard();
    if (active?.kind !== 'hero' || active.camp !== 'heros') {
      return [];
    }
    return herosMourants(this.cards(), this.etat()).filter((card) => card.camp === 'heros' && card.key !== active.key);
  });

  /** L'attaquant actif a obtenu un succès légendaire à la réaction : +1 à ses jets d'attaque. */
  protected readonly legendaryForActive = computed(() => {
    const active = this.activeCard();
    const token = active ? tokenForCard(this.board()?.tokens ?? [], active) : null;
    return token?.tier === 'legendaire';
  });


  /** PNJ / créatures / démons sur la table — décide si charger une scène demande « Remplacer ou Ajouter ». */
  protected readonly nonHeroCount = computed(() => (this.board()?.tokens ?? []).filter((t) => t.kind !== 'hero').length);

  /** Titre de la barre du haut : « Scénario · Scène » quand la session a une scène courante. */
  protected readonly headerTitle = computed(() => tableTitle(this.session()?.titre ?? null, this.session()?.scene));

  /** Scènes de l'utilisateur, chargées à chaque ouverture de la barre de commande. */
  private readonly paletteScenes = signal<readonly BolSceneModel[]>([]);

  /** État de la table vu par la barre de commande — un signal, pour que ses résultats se complètent
   * quand la bibliothèque et les scènes finissent de charger. */
  private readonly paletteContext = computed<PaletteContext>(() => ({
    mode: this.mode(),
    tokens: this.cards().map((card) => ({key: card.key, nom: card.nom, kind: card.kind})),
    catalog: this.selection.catalog(),
    heroIds: this.existingHeroIds(),
    scenes: this.paletteScenes(),
    reserveOpen: this.reserveOpen(),
  }));

  constructor() {
    // Un nouveau round commence : un héros resté à 0 de vitalité sombre dans l'inconscience, ou dépense 1 PH pour reprendre ses esprits ;
    // un héros mourant perd 1 de vitalité.
    effect(() => {
      const round = this.mode() === 'combat' ? this.etat().round : null;
      untracked(() => {
        const previous = this.lastRound;
        this.lastRound = round;
        if (round !== null && previous !== null && round > previous) {
          this.askUnconsciousHeroes();
          this.bleedDyingHeroes();
        }
      });
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Session introuvable.');
      this.loading.set(false);
      return;
    }

    this.loadSession(id);
    this.combatReference
      .getCombatOptions()
      .pipe(take(1))
      .subscribe((options) => this.combatOptions.set(options));

    // Une carte devient active (après « Retarder », un retrait, le début du combat…) : ses effets « jusqu'à son prochain tour » tombent.
    effect(() => {
      const key = this.turn().activeKey;
      if (key !== null) {
        untracked(() => this.saveEtat((etat) => debutDeTour(etat, key)));
      }
    });

    // Statistiques de l'attaquant et de la cible, relues à chaque changement de carte active, de cible ou de table.
    effect(() => {
      const attacker = this.activeCard();
      const target = this.selectedTarget();
      const tokens = this.board()?.tokens ?? [];
      const run = ++this.statsRun;
      const attackerToken = attacker ? tokenForCard(tokens, attacker) : null;
      const targetToken = target ? tokenForCard(tokens, target) : null;
      if (!attackerToken) {
        this.attackerStats.set(null);
        this.targetStats.set(null);
        return;
      }
      forkJoin({
        attacker: resolveAttackStats(attackerToken, this.herosService),
        target: targetToken && target ? resolveAttackStats(targetToken, this.herosService) : of(null),
      })
        .pipe(take(1))
        .subscribe(({attacker: attackerStats, target: targetStats}) => {
          if (run !== this.statsRun) {
            return;
          }
          this.attackerStats.set(attackerStats);
          this.targetStats.set(targetStats);
        });
    });

    // Statistiques de toutes les cartes à portée, pour leurs jetons dans l'assistant : relues quand la carte active ou la liste des
    // cibles change. La cible choisie, elle, est relue à chaque changement de la table (ci-dessus) : son jet reste exact.
    effect(() => {
      const activeKey = this.activeKey();
      this.targetKeys();
      untracked(() => {
        const run = ++this.targetsStatsRun;
        const tokens = this.board()?.tokens ?? [];
        const cards = activeKey ? this.targets() : [];
        if (cards.length === 0) {
          this.targetsStats.set(new Map());
          return;
        }
        forkJoin(
          cards.map((card) => {
            const token = tokenForCard(tokens, card);
            return token ? resolveAttackStats(token, this.herosService).pipe(catchError(() => of(null))) : of(null);
          }),
        )
          .pipe(take(1))
          .subscribe((stats) => {
            if (run !== this.targetsStatsRun) {
              return;
            }
            const byKey = new Map<string, ResolvedCombatStats>();
            cards.forEach((card, index) => {
              const resolved = stats[index];
              if (resolved) {
                byKey.set(card.key, resolved);
              }
            });
            this.targetsStats.set(byKey);
          });
      });
    });

    // Armes du héros dont c'est le tour, pour l'assistant de tour.
    effect(() => {
      const herosId = this.activeHeroId();
      this.activeArmes.set([]);
      this.activeOwnedArmes.set([]);
      this.activeCarrieres.set([]);
      if (!herosId) {
        return;
      }
      this.herosService
        .heros(herosId)
        .pipe(take(1))
        .subscribe((hero) => {
          if (this.activeHeroId() !== herosId) {
            return;
          }
          this.activeArmes.set(equippedArmes(loadedArmes(hero)));
          this.activeOwnedArmes.set(loadedArmes(hero));
          this.activeCarrieres.set(heroDetails(hero).carrieres);
        });
    });
  }

  protected openAddCombatantDialog(): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {
          sessionId,
          existingHeroIds: this.existingHeroIds(),
        },
      })
      .afterClosed()
      .subscribe((didAdd: boolean | undefined) => {
        if (didAdd) {
          this.loadSession(sessionId);
        }
      });
  }

  protected openStartCombatDialog(reroll = false): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    this.dialog
      .open(StartCombatDialogComponent, {
        // Largeur de départ : le dialogue s'élargit lui-même au-delà de quatre héros.
        width: 'min(1240px, 96vw)',
        maxWidth: '96vw',
        maxHeight: '90vh',
        panelClass: 'scd-panel',
        // Le dialogue donne lui-même la main à la case du premier héros une fois chargé : le focus initial reste sur le panneau.
        autoFocus: 'dialog',
        data: {sessionId, reroll},
      })
      .afterClosed()
      .subscribe((started: boolean | undefined) => {
        if (started) {
          this.loadSession(sessionId);
        }
      });
  }

  /** « Terminer le combat » : la boîte « Après combat » montre ce que chaque blessé récupère (repos, dégâts à mains nues, soins
   * médicaux) ; validée, elle l'enregistre et la session repasse en mode libre. Annulée, le combat continue. */
  protected askEndCombat(): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }
    const effets = this.etat().effets;
    const wounded = this.cards()
      .filter((card) => card.camp === 'heros' && card.vitaliteMax !== null && card.vitaliteMax > 0 && card.vitaliteCourante !== null && card.vitaliteCourante < card.vitaliteMax)
      .map((card) => ({
        kind: card.kind,
        pivotId: card.pivotId,
        nom: card.nom,
        vitalite: card.vitaliteCourante!,
        vitaliteMax: card.vitaliteMax!,
        vitaliteDepart: Math.min(card.vitaliteMax!, this.etat().depart[card.key] ?? card.vitaliteMax!),
        mainsNues: degatsMainsNues(effets, card.key),
        etat: horsCombat(card, effets),
      }));

    this.combatHealers()
      .pipe(
        switchMap((healers) =>
          this.dialog
            .open<AfterCombatDialogComponent, AfterCombatDialogData, readonly AfterCombatGain[]>(AfterCombatDialogComponent, {width: '600px', data: {wounded, healers}})
            .afterClosed(),
        ),
        switchMap((gains) => {
          if (!gains) {
            return EMPTY;
          }
          const saved: Observable<unknown> = gains.length ? forkJoin(gains.map((gain) => this.fightSessionService.applyDamage(sessionId, gain.kind, gain.pivotId, gain.amount))) : of(null);
          return saved.pipe(
            tap(() => {
              if (gains.length) {
                this.snackBar.open(`Après combat — ${gains.map((gain) => `${gain.nom} +${gain.amount}`).join(', ')}`, undefined, {duration: 4500});
              }
            }),
            switchMap(() => this.fightSessionService.endCombat(sessionId)),
          );
        }),
      )
      .subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => {
          this.loadSession(sessionId);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de terminer le combat.'), 'Fermer', {duration: 5000});
        },
      });
  }

  /** Les héros de la table qui ont une carrière de soins (médecin, guérisseur, rebouteux), avec la mieux classée. Leurs fiches sont
   * relues ; si elles ne se chargent pas, personne ne soigne. */
  private combatHealers(): Observable<readonly AfterCombatHealer[]> {
    const heroes = this.cards().filter((card) => card.kind === 'hero' && card.camp === 'heros' && card.sourceId !== null);
    if (heroes.length === 0) {
      return of([]);
    }
    return forkJoin(heroes.map((card) => this.herosService.heros(card.sourceId!))).pipe(
      map((fiches) =>
        fiches
          .map((hero, i): AfterCombatHealer | null => {
            const carriere = bestHealingCareer(heroDetails(hero).carrieres);
            return carriere ? {nom: heroes[i].nom, carriere} : null;
          })
          .filter((healer): healer is AfterCombatHealer => healer !== null),
      ),
      catchError(() => of([])),
    );
  }

  protected toggleReserve(): void {
    const next = !this.reserveOpen();
    this.reserveOpen.set(next);
    writePanelOpen(browserStorage(), RESERVE_PANEL_KEY, next);
  }

  /** Échap replie la carte dépliée, sauf si un dialogue est ouvert, ou si un menu ou un popover vient de le
   * traiter (il marque alors l'événement `defaultPrevented`) : Échap ne ferme alors que lui. */
  protected onEscape(event: Event): void {
    if (event.defaultPrevented) {
      return;
    }
    if (this.dialog.openDialogs.length === 0) {
      this.selectedKeys.set(new Set());
      this.foldCard();
    }
  }

  protected reloadSession(): void {
    const sessionId = this.sessionId();
    if (sessionId) {
      this.loadSession(sessionId);
    }
  }

  /** Une scène a été chargée, enregistrée, renommée ou supprimée : la table a pu changer du tout au
   * tout, la carte dépliée est repliée avant de recharger la session. */
  protected onSceneChanged(): void {
    this.foldCard();
    this.reloadSession();
  }

  /** Clic sur la face d'une carte : ouvre sa carte en dialogue (une seule à la fois). */
  protected onCardToggled(card: TapisCard): void {
    this.selectedKeys.set(new Set());
    if (this.expandedKey() === card.key) {
      return;
    }
    this.expandedKey.set(card.key);
    this.loadExpanded(card);
    this.openCardDialog();
  }

  /** Cartes sélectionnées par Ctrl + clic : suppr les retire de la table. */
  protected readonly selectedKeys = signal<ReadonlySet<string>>(new Set());

  protected toggleSelected(card: TapisCard): void {
    this.selectedKeys.update((keys) => {
      const next = new Set(keys);
      if (!next.delete(card.key)) {
        next.add(card.key);
      }
      return next;
    });
  }

  /** Suppr : retire de la table les cartes sélectionnées, après confirmation. Hors combat seulement. */
  private askRemoveSelection(): void {
    const sessionId = this.sessionId();
    const cards = this.cards().filter((card) => this.selectedKeys().has(card.key));
    if (!sessionId || !cards.length) {
      return;
    }

    const names = cards.map((card) => `« ${card.nom} »`).join(', ');
    confirmDialog(
      this.dialog,
      {
        title: cards.length > 1 ? `Retirer ${cards.length} personnages` : REMOVE_ACTION_LABEL,
        message: `Voulez-vous retirer ${names} de la table ?`,
        confirmLabel: 'Retirer',
      },
      {width: '420px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      from(cards)
        .pipe(
          concatMap((card) => this.fightSessionService.removeCombatant(sessionId, card.kind, card.pivotId)),
          toArray(),
        )
        .subscribe({
          next: () => {
            this.selectedKeys.set(new Set());
            this.loadSession(sessionId);
          },
          error: (error: unknown) => {
            this.loadSession(sessionId);
            this.tableError(error, 'Impossible de retirer ces personnages.');
          },
        });
    });
  }

  protected foldCard(): void {
    this.cardDialog?.close();
    this.expandedKey.set(null);
  }

  private cardDialog: MatDialogRef<ExpandedCardDialogComponent> | null = null;

  /** « Attaquer cette carte » sur la carte ouverte : en combat, pour toute carte qui n'est ni la carte active ni
   * hors combat. */
  private openCardDialog(): void {
    const sessionId = this.sessionId();
    if (this.cardDialog || !sessionId) {
      return;
    }

    const data: ExpandedCardDialogData = {
      sessionId,
      card: this.expandedCard,
      hero: this.expandedHero,
      statblock: this.expandedStatblock,
      returnUrl: this.returnUrl,
      changed: () => this.reloadSession(),
      remove: (card) => this.askRemoveCard(card),
      toggleArmure: (event) => this.onArmureToggled(event),
      toggleArme: (event) => this.onArmeToggled(event),
    };
    // Le corps de la carte donne le focus à sa racine : pas de focus automatique du dialogue.
    const ref = this.dialog.open(ExpandedCardDialogComponent, {
      data,
      autoFocus: false,
      panelClass: 'exc-dialog',
      maxWidth: '96vw',
    });
    this.cardDialog = ref;
    ref.afterClosed().subscribe(() => {
      this.cardDialog = null;
      this.expandedKey.set(null);
    });
  }

  /** Charge les données de la carte dépliée. Chaque réponse est ignorée si une autre carte a été
   * dépliée entre-temps (réponses arrivées dans le désordre). */
  private loadExpanded(card: TapisCard): void {
    this.expandedHero.set(null);
    this.expandedStatblock.set(null);

    const sourceId = card.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    const stillExpanded = (): boolean => this.expandedKey() === card.key;

    switch (card.kind) {
      case 'hero':
        this.herosService
          .heros(sourceId)
          .pipe(take(1))
          .subscribe((hero) => {
            if (stillExpanded()) {
              this.expandedHero.set(this.buildExpandedHero(card, hero, sourceId, sessionId));
            }
          });
        break;
      case 'pnj':
        this.pnjService
          .pnj(sourceId)
          .pipe(take(1))
          .subscribe((pnj) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(pnjStatblockData(pnj));
            }
          });
        break;
      case 'creature':
        this.creaturesService
          .creature(sourceId)
          .pipe(take(1))
          .subscribe((creature) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(creatureStatblockData(creature));
            }
          });
        break;
      case 'demon':
        this.demonsService
          .demon(sourceId)
          .pipe(take(1))
          .subscribe((demon) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(demonStatblockData(demon));
            }
          });
        break;
    }
  }

  private buildExpandedHero(card: TapisCard, hero: BolHerosModel, herosId: string, sessionId: string): ExpandedHeroData {
    return {
      stats: heroHeaderStats(hero),
      details: heroDetails(hero),
      resources: {
        sessionId,
        herosId,
        pivotId: card.pivotId,
        heroNom: card.nom,
        vitaliteCourante: card.vitaliteCourante ?? hero.ressources.vitalite,
        vitaliteMax: hero.ressources.vitalite,
      },
      actionRoll: {
        heroNom: card.nom,
        herosId,
        heroisme: hero.ressources.heroisme,
        agilite: hero.attributs.agilite,
        vigueur: hero.attributs.vigueur,
        esprit: hero.attributs.esprit,
        aura: hero.attributs.aura,
        equipementAgilite: hero.attributs.agilite_effective - hero.attributs.agilite,
        carrieres: hero.carrieres
          .map((c) => ({label: c.carriere?.carriere ?? '', value: c.value}))
          .filter((c) => c.label),
        diceTraits: hero.traits
          .map((trait): ActionRollDiceTrait | null => {
            const traitable = trait.traitable;
            if (!traitable) {
              return null;
            }
            if (trait.type === 'A' && 'de_bonus' in traitable && traitable.de_bonus) {
              return {label: traitable.avantage, domaine: traitable.de_bonus_domaine, kind: 'avantage'};
            }
            if (trait.type === 'D' && 'de_malus' in traitable && traitable.de_malus) {
              return {label: traitable.desavantage, domaine: traitable.de_malus_domaine, kind: 'desavantage'};
            }
            return null;
          })
          .filter((t): t is ActionRollDiceTrait => t !== null),
      },
    };
  }

  /** « Retirer de la table » depuis la carte dépliée. */
  protected askRemoveCard(card: TapisCard): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: REMOVE_ACTION_LABEL,
        message: `Voulez-vous retirer « ${card.nom} » de la table ?`,
        confirmLabel: 'Retirer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.removeCombatant(sessionId, card.kind, card.pivotId).subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => this.tableError(error, 'Impossible de retirer ce personnage.'),
      });
    });
  }

  /** Passe la carte du côté des héros (allié) ou la remet avec les présents. */
  protected toggleCamp(card: TapisCard): void {
    const sessionId = this.sessionId();
    if (!sessionId || card.kind === 'hero') {
      return;
    }

    this.fightSessionService
      .setCamp(sessionId, card.kind, card.pivotId, card.camp === 'heros' ? 'adversaires' : 'heros')
      .subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => this.tableError(error, 'Impossible de changer ce personnage de camp.'),
      });
  }

  /** Un clic sur une armure dans le popover d'un héros : l'équipe ou la déséquipe (le backend n'en garde qu'une
   * par catégorie). */
  protected onArmureToggled(event: {card: TapisCard; armureId: number}): void {
    this.toggleEquipment(event.card, (herosId) => this.herosService.equipArmure(herosId, event.armureId));
  }

  /** Un clic sur une arme dans le popover d'un héros : l'équipe ou la déséquipe (plusieurs armes possibles). */
  protected onArmeToggled(event: {card: TapisCard; armeId: number}): void {
    this.toggleEquipment(event.card, (herosId) => this.herosService.equipArme(herosId, event.armeId));
  }

  /** Enregistre un changement d'équipement, puis rafraîchit les données de la carte sur place — sans la
   * recharger, sinon le popover se fermerait —, les armes proposées à l'attaque si c'est le héros dont c'est
   * le tour, et la session, dont la défense et l'initiative changent avec l'équipement. */
  private toggleEquipment(card: TapisCard, equip: (herosId: string) => Observable<unknown>): void {
    const sessionId = this.sessionId();
    if (!card.sourceId || !sessionId) {
      return;
    }
    const herosId = card.sourceId;
    equip(herosId).subscribe({
      next: () => {
        this.herosService
          .heros(herosId)
          .pipe(take(1))
          .subscribe((hero) => {
            if (this.expandedKey() === card.key) {
              // Les lignes des popovers ne changent pas de place quand on coche : le tri « équipées d'abord » se fait à l'ouverture.
              const previous = this.expandedHero()?.details ?? null;
              const next = this.buildExpandedHero(card, hero, herosId, sessionId);
              this.expandedHero.set({...next, details: keepDetailsOrder(next.details, previous)});
            }
            if (this.activeHeroId() === herosId) {
              this.activeArmes.set(equippedArmes(loadedArmes(hero)));
              this.activeOwnedArmes.set(loadedArmes(hero));
              this.activeCarrieres.set(heroDetails(hero).carrieres);
            }
          });
        this.loadSession(sessionId);
      },
      error: (error: unknown) => this.tableError(error, "Impossible de changer l'équipement."),
    });
  }

  private tableError(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }

  /** Enregistre l'état du combat en série (cf. `EtatSaver`), puis recharge la session : l'affichage suit toujours la base. */
  private readonly etatSaver = new EtatSaver(
    () => this.etat(),
    (next) => {
      const sessionId = this.sessionId();
      if (!sessionId || this.mode() !== 'combat') {
        return EMPTY;
      }
      return this.fightSessionService
        .updateCombatState(sessionId, {round: next.round, joues: [...next.joues], effets: [...next.effets], exclus: [...next.exclus]})
        .pipe(
          switchMap(() => this.fightSessionService.fightSession(sessionId)),
          tap((session) => this.session.set(session)),
          take(1),
        );
    },
    (error) => this.tableError(error, "Impossible d'enregistrer ou de recharger l'état du combat."),
  );

  private saveEtat(update: (etat: EtatCombat) => EtatCombat, options?: {readonly ignoreIfBusy?: boolean}): boolean {
    return this.etatSaver.apply(update, options);
  }

  /** Au début d'un round, chaque héros resté à 0 (02-actions-combat.md, « Blessures, inconscience et mort ») choisit, l'un après l'autre :
   * dépenser 1 PH pour reprendre ses esprits — il remonte à la moitié de sa vitalité, arrondie au supérieur, et rejoue — ou sombrer
   * dans l'inconscience jusqu'à la fin du combat (la récupération d'après combat le remonte alors à la même valeur). Sans point
   * d'héroïsme, il sombre. */
  private askUnconsciousHeroes(): void {
    const sessionId = this.sessionId();
    const etat = this.etat();
    const heroes = this.cards().filter(
      (card) => card.kind === 'hero' && horsCombat(card) === 'inconscient' && card.sourceId !== null && !etat.exclus.includes(card.key) && !aSombre(etat.effets, card.key),
    );
    if (!sessionId || heroes.length === 0) {
      return;
    }
    from(heroes)
      .pipe(
        concatMap((card) =>
          this.herosService.heros(card.sourceId!).pipe(
            switchMap((hero) => {
              const vitalite = Math.ceil(hero.ressources.vitalite / 2);
              if (hero.ressources.heroisme <= 0) {
                this.snackBar.open(`${card.nom} n'a plus de point d'héroïsme : il sombre dans l'inconscience jusqu'à la fin du combat.`, undefined, {duration: 4500});
                return of({card, revive: false, vitalite});
              }
              return confirmDialog(
                this.dialog,
                {
                  title: `${card.nom} est à 0`,
                  message: `${card.nom} s'est effondré. Il sombre dans l'inconscience jusqu'à la fin du combat, ou dépense 1 point d'héroïsme pour reprendre ses esprits : il remonte à ${vitalite} de vitalité et rejoue dès ce round.`,
                  confirmLabel: 'Reprendre ses esprits (−1 PH)',
                  cancelLabel: 'Sombrer',
                },
                {width: '420px'},
              ).pipe(switchMap((revive) => of({card, revive, vitalite})));
            }),
            catchError(() => EMPTY),
          ),
        ),
      )
      .subscribe(({card, revive, vitalite}) => {
        if (!revive) {
          this.saveEtat((current) => ({...current, effets: [...appliquerEvenement(current.effets, {type: 'ajout-manuel', effet: effetInconscient(card.key)}, idAleatoire)]}));
          return;
        }
        forkJoin([this.herosService.adjustHeroisme(card.sourceId!, -1), this.fightSessionService.applyDamage(sessionId, 'hero', card.pivotId, vitalite)]).subscribe({
          next: () => this.loadSession(sessionId),
          error: (error: unknown) => this.tableError(error, 'Impossible de relever ce héros.'),
        });
      });
  }

  /** Au début d'un round, chaque héros mourant (−1 à −5, pas stabilisé) perd 1 de vitalité (02-actions-combat.md, « Blessures,
   * inconscience et mort »). Un message l'annonce, avec « Stabilisé » pour le héros secouru à la table : le point revient et la perte
   * s'arrête. Celui qui passe sous −5 se voit proposer « Défier la mort » pour se stabiliser. */
  private bleedDyingHeroes(): void {
    const sessionId = this.sessionId();
    const heroes = herosMourants(this.cards(), this.etat());
    if (!sessionId || heroes.length === 0) {
      return;
    }
    forkJoin(heroes.map((card) => this.fightSessionService.applyDamage(sessionId, 'hero', card.pivotId, -1).pipe(map(() => card)))).subscribe({
      next: (bled) => {
        this.loadSession(sessionId);
        from(bled)
          .pipe(
            concatMap((card) => {
              const after = (card.vitaliteCourante ?? 0) - 1;
              if (after < -5) {
                this.promptDefierLaMort(card, after);
                return EMPTY;
              }
              return this.snackBar
                .open(`${card.nom} est mourant : il perd 1 de vitalité (${after}).`, 'Stabilisé', {duration: 6000})
                .afterDismissed()
                .pipe(map(({dismissedByAction}) => ({card, stabilise: dismissedByAction})));
            }),
          )
          .subscribe(({card, stabilise}) => {
            if (stabilise) {
              this.stabilize(card, 1);
            }
          });
      },
      error: (error: unknown) => this.tableError(error, 'Impossible de retirer la vitalité des héros mourants.'),
    });
  }

  /** Un héros mourant est stabilisé : il ne perd plus de vitalité pour le reste du combat. `refund` rend les points qu'il vient de
   * perdre. */
  private stabilize(card: TapisCard, refund = 0): void {
    this.saveEtat((current) => ({...current, effets: [...appliquerEvenement(current.effets, {type: 'ajout-manuel', effet: effetStabilise(card.key)}, idAleatoire)]}));
    const sessionId = this.sessionId();
    if (sessionId && refund !== 0) {
      this.fightSessionService.applyDamage(sessionId, 'hero', card.pivotId, refund).subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => this.tableError(error, 'Impossible de rendre la vitalité perdue.'),
      });
    }
  }

  /** « Défier la mort » pour un héros tombé sous 0 ou sous −5 : ses points d'héroïsme sont relus, puis le dialogue s'ouvre. */
  private promptDefierLaMort(card: TapisCard, vitalite: number): void {
    const sessionId = this.sessionId();
    if (!sessionId || card.sourceId === null) {
      return;
    }
    this.herosService.heros(card.sourceId).subscribe((hero) =>
      maybePromptDefierLaMort({
        dialog: this.dialog,
        fightSessionService: this.fightSessionService,
        herosService: this.herosService,
        sessionId,
        herosId: card.sourceId!,
        pivotId: card.pivotId,
        heroNom: card.nom,
        vitaliteCourante: vitalite,
        heroisme: hero.ressources.heroisme,
        onApplied: () => this.loadSession(sessionId),
        onStabilized: () => this.stabilize(card),
      }),
    );
  }

  /** « Secourir » : le héros actif tente de stabiliser un allié mourant (02-actions-combat.md, « Secourir un mourant »), à la place de
   * son attaque. Réussi, le mourant ne perd plus de vitalité ; dans tous les cas, le tour se termine. */
  protected onRescue(): void {
    const rescuer = this.activeCard();
    const patients = this.rescuePatients();
    if (!rescuer?.sourceId || patients.length === 0) {
      return;
    }
    this.herosService
      .heros(rescuer.sourceId)
      .pipe(
        switchMap((hero) =>
          this.dialog
            .open<RescueDialogComponent, RescueDialogData, RescueResult>(RescueDialogComponent, {
              width: '480px',
              data: {
                rescuerNom: rescuer.nom,
                herosId: rescuer.sourceId!,
                esprit: hero.attributs.esprit,
                heroisme: hero.ressources.heroisme,
                carrieres: heroDetails(hero).carrieres,
                patients: patients.map((card) => ({key: card.key, nom: card.nom, vitalite: card.vitaliteCourante ?? 0})),
              },
            })
            .afterClosed(),
        ),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            return;
          }
          const patient = patients.find((card) => card.key === result.key);
          if (result.success && patient) {
            this.stabilize(patient);
          }
          this.snackBar.open(result.success ? `${patient?.nom} est stabilisé : il ne perd plus de vitalité.` : `Le secours échoue : ${patient?.nom} reste mourant.`, undefined, {duration: 4500});
          this.onEndTurn(true);
        },
        error: (error: unknown) => this.tableError(error, 'Impossible de charger le secouriste.'),
      });
  }

  /** « Retarder » : la carte active joue en dernier ce round. */
  protected onDelay(): void {
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
  protected onEndTurn(afterHit = false): void {
    const active = this.activeCard();
    // La posture choisie pour ce tour dure : son bonus ou malus de défense pèse sur les attaques suivantes contre cette carte.
    const crees = active ? effetsDeTour(active.key, {posture: this.attackChoice()?.posture?.slug ?? null, defenseTotale: false}) : [];
    // La cible ne se vide que si la fin de tour est prise en compte : pendant un enregistrement elle est ignorée, et le jet en cours reste.
    if (this.saveEtat((etat) => endTurn(this.orderedCards(), etat, crees, idAleatoire), {ignoreIfBusy: !afterHit})) {
      this.targetKey.set(null);
    }
  }

  protected onTotalDefense(): void {
    if (this.saveEtat((etat) => totalDefense(this.orderedCards(), etat, idAleatoire), {ignoreIfBusy: true})) {
      this.targetKey.set(null);
    }
  }

  protected onGiveBackTurn(key: string): void {
    this.saveEtat((etat) => giveBackTurn(etat, key), {ignoreIfBusy: true});
  }

  /** Clic sur une carte désignable (ou « Attaquer cette carte ») : elle devient la cible de la carte active. */
  protected onAttackCard(target: TapisCard | null): void {
    const attacker = this.activeCard();
    if (target === null) {
      this.targetKey.set(null);
    } else if (attacker && attacker.key !== target.key) {
      this.targetKey.set(target.key);
    }
  }

  /** Un jet d'attaque vient d'être fait contre cette cible : le registre le sait (le petit bouclier est dépensé pour ce round). */
  protected onAttackRolled(target: TapisCard): void {
    const attaquant = this.activeCard()?.key;
    if (!attaquant) {
      return;
    }
    // Le petit bouclier de la cible, s'il en porte un, est dépensé pour ce round.
    const stats = this.selectedTarget()?.key === target.key ? this.targetStats() : (this.targetsStats().get(target.key) ?? null);
    const petitBouclier = (stats?.bouclierMalusUneAttaque ?? 0) > 0;
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'jet-attaque', attaquant, cible: target.key, petitBouclier}, idAleatoire)]}));
  }

  /** Le MJ retire un effet (croix d'une puce ou du bloc « Effets en cours »). */
  protected onEffectRemoved(id: string): void {
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'retrait-manuel', id})]}));
  }

  /** Le MJ ajoute un effet depuis le menu « + Effet ». */
  protected onEffectAdded(effet: NewEffect): void {
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'ajout-manuel', effet}, idAleatoire)]}));
  }

  /** Le héros actif dépense ou gagne des points d'héroïsme sur son jet d'attaque (faveur divine, échec critique, succès héroïque ou
   * légendaire) : affiché tout de suite, enregistré, et repris si l'enregistrement échoue. */
  protected onHeroismeAdjusted(delta: number): void {
    const herosId = this.attackerStats()?.herosId;
    if (!herosId) {
      return;
    }
    const shift = (by: number): void =>
      this.attackerStats.update((stats) => (stats?.herosId === herosId ? {...stats, heroisme: Math.max(0, (stats.heroisme ?? 0) + by)} : stats));
    shift(delta);
    this.herosService.adjustHeroisme(herosId, delta).subscribe({
      error: (error: unknown) => {
        shift(-delta);
        this.tableError(error, "Impossible de mettre à jour l'héroïsme.");
      },
    });
  }

  /** La vitalité de la carte active ou de sa cible corrigée à la main sur son cœur : enregistrée comme des dégâts (ou des soins). */
  protected onVitaliteAdjusted(change: VitaliteChange): void {
    const stats = change.card.key === this.activeCard()?.key ? this.attackerStats() : this.targetStats();
    this.applyDamageTo(change.card, change.delta, stats);
  }

  /** Dégâts calculés par l'assistant : enregistrés sur la cible. */
  protected onHitApplied(hit: AppliedHit): void {
    // Une bagarre à mains nues ne fait pas passer sous 0 (livre p. 64) : la cible perd seulement connaissance, sans coma ni
    // « Défier la mort ».
    const before = hit.target.vitaliteCourante ?? 0;
    const damage = hit.unarmed ? Math.min(hit.damage, Math.max(0, before)) : hit.damage;
    if (damage !== 0) {
      this.applyDamageTo(hit.target, -damage, this.targetStats());
    }
    // Les dégâts d'une bagarre se récupèrent en totalité après le combat : le registre les retient, et la cible mise à 0 est assommée.
    if (hit.unarmed && damage > 0) {
      const nouveaux = [effetDegatsMainsNues(hit.target.key, damage), ...(before - damage === 0 ? [effetAssomme(hit.target.key)] : [])];
      this.saveEtat((etat) => ({
        ...etat,
        effets: nouveaux.reduce<readonly CombatEffect[]>((effets, effet) => appliquerEvenement(effets, {type: 'ajout-manuel', effet}, idAleatoire), etat.effets),
      }));
    }
  }

  /** Enregistre une variation de vitalité sur une carte (dégâts négatifs) ; un héros qui tombe sous 0 se voit
   * proposer « Défier la mort ». */
  private applyDamageTo(target: TapisCard, delta: number, targetStats: ResolvedCombatStats | null): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    this.fightSessionService.applyDamage(sessionId, target.kind, target.pivotId, delta).subscribe({
      next: () => {
        this.loadSession(sessionId);

        const before = target.vitaliteCourante ?? 0;
        const newVitalite = before + delta;
        if (targetStats?.herosId && shouldPromptDefierLaMort(before, newVitalite)) {
          maybePromptDefierLaMort({
            dialog: this.dialog,
            fightSessionService: this.fightSessionService,
            herosService: this.herosService,
            sessionId,
            herosId: targetStats.herosId,
            pivotId: target.pivotId,
            heroNom: target.nom,
            vitaliteCourante: newVitalite,
            heroisme: targetStats.heroisme ?? 0,
            onApplied: () => this.loadSession(sessionId),
            onStabilized: () => this.stabilize(target),
          });
        }
      },
      error: (error: unknown) => this.tableError(error, "Impossible d'appliquer les dégâts."),
    });
  }

  /** `/` ou `Ctrl+K` ouvre la barre de commande ; `F` termine le tour en combat. Rien de tout cela
   * quand un dialogue est ouvert. */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (event.key === 'Delete' && this.mode() === 'libre' && this.selectedKeys().size && !isEditable(target)) {
      event.preventDefault();
      this.askRemoveSelection();
      return;
    }
    if (isPaletteShortcut(event, target)) {
      event.preventDefault();
      this.openPalette();
    } else if (this.mode() === 'combat' && isEndTurnShortcut(event, target)) {
      event.preventDefault();
      const board = this.combatBoard();
      if (board) {
        board.requestEndTurn();
      } else {
        this.onEndTurn();
      }
    }
  }

  protected openPalette(): void {
    if (!this.sessionId() || this.dialog.openDialogs.length > 0) {
      return;
    }

    // La barre s'ouvre tout de suite ; bibliothèque et scènes sont rechargées à chaque ouverture (une
    // fiche a pu être créée, renommée ou supprimée depuis) et complètent ses résultats à leur arrivée.
    this.selection.loadCatalog();
    this.sceneService.scenes().subscribe({
      next: (scenes) => this.paletteScenes.set(scenes),
      error: () => this.paletteScenes.set([]),
    });

    openCommandPalette(this.dialog, {context: this.paletteContext}).subscribe((command) => {
      if (command) {
        this.executePaletteCommand(command);
      }
    });
  }

  /** Exécute la commande choisie dans la barre, par les mêmes chemins que les panneaux. */
  private executePaletteCommand(command: PaletteCommand): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    switch (command.type) {
      case 'select': {
        const card = findCard(this.cards(), command.key);
        if (card) {
          this.onCardToggled(card);
        }
        break;
      }
      case 'place':
        this.fightSessionService
          .addCombatant(sessionId, {
            kind: command.kind,
            sourceId: command.sourceId,
            camp: resolveAddCombatantCamp(command.kind, 'adversaires'),
            qty: command.qty,
          })
          .subscribe({
            next: () => {
              const message =
                command.qty > 1
                  ? `${command.qty} × ${command.nom} posés sur la table.`
                  : `${command.nom} posé sur la table.`;
              this.snackBar.open(message, undefined, {duration: 2000});
              this.loadSession(sessionId);
            },
            error: (error: unknown) => this.paletteError(error, 'Impossible de poser ce personnage.'),
          });
        break;
      case 'loadScene':
        this.sceneActions.load(sessionId, command.scene, this.nonHeroCount()).subscribe({
          next: (result) => {
            if (result) {
              this.onSceneChanged();
            }
          },
          error: (error: unknown) => this.paletteError(error, 'Impossible de charger la scène.'),
        });
        break;
      case 'action':
        this.runPaletteAction(command.id, sessionId);
        break;
    }
  }

  private runPaletteAction(id: PaletteActionId, sessionId: string): void {
    switch (id) {
      case 'startCombat':
        this.openStartCombatDialog();
        break;
      case 'endCombat':
        this.askEndCombat();
        break;
      case 'saveScene':
        // Rangée dans le scénario de la scène courante, sinon dans « Sans scénario ».
        this.sceneActions.saveTable(sessionId, this.session()?.scene?.scenario?.id ?? null).subscribe({
          next: (scene) => {
            if (scene) {
              this.onSceneChanged();
            }
          },
          error: (error: unknown) => this.paletteError(error, "Impossible d'enregistrer la scène."),
        });
        break;
      case 'toggleReserve':
        this.toggleReserve();
        break;
      case 'createHero':
        this.openCreateForm('hero');
        break;
      case 'createPnj':
        this.openCreateForm('pnj');
        break;
      case 'createCreature':
        this.openCreateForm('creature');
        break;
      case 'createDemon':
        this.openCreateForm('demon');
        break;
      case 'sessions':
        void this.router.navigateByUrl('/library/sessions');
        break;
      case 'newSession':
        void this.router.navigateByUrl('/session/new');
        break;
      case 'intendance':
        void this.router.navigateByUrl('/intendance');
        break;
    }
  }

  /** Formulaire de création, avec retour à cette table après enregistrement (même état de
   * navigation que les liens « Créer » de la réserve). */
  private openCreateForm(kind: CombatantKind): void {
    void this.router.navigateByUrl(reserveTab(kind).createLink, {state: {returnUrl: this.returnUrl()}});
  }

  private paletteError(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }

  private loadSession(id: string): void {
    this.fightSessionService
      .fightSession(id)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Impossible de charger cette session.');
          this.loading.set(false);
        },
      });
  }
}
