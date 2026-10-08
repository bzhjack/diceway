import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {concatMap, forkJoin, from, Observable, of, take, tap, toArray} from 'rxjs';
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
import {AttackRollDialogComponent} from '../attack-roll-dialog/attack-roll-dialog';
import {resolveAttackStats} from '../combat-attack.util';
import {buildPlayBoard, postCombatRecoveryAmount} from '../combat-play.util';
import {ActionRollDiceTrait} from '../models/action-roll.model';
import {SceneActionsService} from '../scene-actions.service';
import {AddCombatantDialogComponent, resolveAddCombatantCamp} from './add-combatant-dialog/add-combatant-dialog';
import {openCommandPalette} from './command-palette/command-palette';
import {PaletteActionId, PaletteCommand, PaletteContext} from '../models/command-palette.model';
import {isEditable, isEndTurnShortcut, isPaletteShortcut} from './command-palette/shortcut.util';
import {reserveTab} from './reserve/reserve.util';
import {maybePromptDefierLaMort} from './defier-la-mort-dialog/defier-la-mort.util';
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
import {endTurn, giveBackTurn, normalizeEtat, orderCards, targetableKeys, tokenForCard, totalDefense, turnAnnouncement, turnState} from './tapis/combat-turn.util';
import {EtatCombat} from '../models/combat-turn.model';
import {CombatBoardComponent} from './combat-board/combat-board';
import {AppliedHit} from './tapis/turn-assistant';
import {ResolvedCombatStats} from '../models/combat-attack.model';
import {TurnOrderEntry} from '../models/turn-order.model';
import {TapisComponent} from './tapis/tapis';
import {buildTapisCards, findCard, heroDetails, heroHeaderStats, REMOVE_ACTION_LABEL} from './tapis/tapis.util';
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

  /** Les héros du camp des héros, avec leur vitalité, pour la colonne de droite. */
  protected readonly sideHeroes = computed(() => this.cards().filter((card) => card.kind === 'hero'));

  private readonly turn = computed(() => turnState(this.orderedCards(), this.etat()));

  /** Carte dont c'est le tour — `null` hors combat, ou quand plus personne ne peut jouer. */
  protected readonly activeCard = computed(() => (this.mode() === 'combat' ? findCard(this.cards(), this.turn().activeKey) : null));

  protected readonly turnEntries = computed<readonly TurnOrderEntry[]>(() => {
    const statuses = this.turn().statuses;
    return this.orderedCards().map(({card, tier, lockedRound1}) => ({
      key: card.key,
      nom: card.nom,
      kind: card.kind,
      avatar: card.avatar,
      status: statuses.get(card.key) ?? 'upcoming',
      tier: tier,
      locked: lockedRound1,
    }));
  });

  protected readonly turnAnnouncement = computed(() => turnAnnouncement(this.orderedCards(), this.etat()));

  /** Id du héros actif — les armes ne sont rechargées que lorsqu'il change, pas à chaque
   * rechargement de la session. */
  private readonly activeHeroId = computed(() => {
    const active = this.activeCard();
    return active?.kind === 'hero' ? active.sourceId : null;
  });
  protected readonly activeArmes = signal<readonly BolHerosArmeModel[]>([]);

  /** Armes proposées à l'assistant : celles du héros actif ; pour un PNJ, toutes ses armes (l'équipée en premier), pour en changer en combat. */
  protected readonly assistantArmes = computed<readonly BolHerosArmeModel[]>(() => {
    const active = this.activeCard();
    if (active?.kind !== 'pnj') {
      return this.activeArmes();
    }
    const armes = this.session()?.pnjs?.find((p) => p.id === active.pivotId)?.armes ?? [];
    const models = armes
      .filter((a) => a.nom)
      .map((a, index) => ({
        id: 1000 + index,
        arme_id: 1000 + index,
        equipee: a.equipee !== false,
        arme: {id: null, arme: a.nom ?? '', type: a.type ?? 'M', degats: a.degats, portee: null, notes: null},
      }));
    return [...models.filter((m) => m.equipee), ...models.filter((m) => !m.equipee)];
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

  /** L'attaquant actif a obtenu un succès légendaire à la réaction : +1 à ses jets d'attaque. */
  protected readonly legendaryForActive = computed(() => {
    const active = this.activeCard();
    const token = active ? tokenForCard(this.board()?.tokens ?? [], active) : null;
    return token?.tier === 'legendaire';
  });

  /** Coups portés pendant ce combat, du plus récent au plus ancien. */
  protected readonly combatLog = signal<readonly string[]>([]);


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

    // Statistiques de l'attaquant et de la cible, relues à chaque changement de carte active, de cible ou de table.
    effect(() => {
      const attacker = this.activeCard();
      const target = this.selectedTarget();
      const tokens = this.board()?.tokens ?? [];
      const defenseTotale = this.etat().defense_totale;
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
          this.targetStats.set(
            targetStats && target && defenseTotale.includes(target.key)
              ? {...targetStats, defense: targetStats.defense + 2}
              : targetStats,
          );
        });
    });

    // Armes du héros dont c'est le tour, pour l'assistant de tour.
    effect(() => {
      const herosId = this.activeHeroId();
      this.activeArmes.set([]);
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
        width: 'min(1240px, 96vw)',
        maxWidth: '96vw',
        maxHeight: '90vh',
        panelClass: 'scd-panel',
        data: {sessionId, reroll},
      })
      .afterClosed()
      .subscribe((started: boolean | undefined) => {
        if (started) {
          this.loadSession(sessionId);
        }
      });
  }

  protected askEndCombat(): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: 'Terminer le combat',
        message: 'La session repassera en mode libre. Les personnages restent sur la table. Continuer ?',
        confirmLabel: 'Terminer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.applyPostCombatRecovery(sessionId).subscribe(() => {
        this.fightSessionService.endCombat(sessionId).subscribe({
          next: () => this.loadSession(sessionId),
          error: (error: unknown) => {
            this.snackBar.open(extractApiErrorMessage(error, 'Impossible de terminer le combat.'), 'Fermer', {
              duration: 5000,
            });
          },
        });
      });
    });
  }

  /** Récupération post-combat (02-actions-combat.md, "Récupération") : chaque héros à vitalité ≥ 0
   * regagne la moitié des points perdus (arrondie au supérieur) avant que le combat ne se termine —
   * en dessous de 0 (mourant), aucune récupération automatique (relève de "Secourir un mourant"). */
  private applyPostCombatRecovery(sessionId: string): Observable<unknown> {
    const recoveries = this.heroTokens()
      .map((token) => ({token, amount: postCombatRecoveryAmount(token.vitaliteCourante, token.vitaliteMax)}))
      .filter(({amount}) => amount > 0);

    if (recoveries.length === 0) {
      return of(null);
    }

    return forkJoin(
      recoveries.map(({token, amount}) => this.fightSessionService.applyDamage(sessionId, 'hero', token.pivotId, amount)),
    ).pipe(
      tap(() => {
        const summary = recoveries.map(({token, amount}) => `${token.nom} +${amount}`).join(', ');
        this.snackBar.open(`Récupération post-combat — ${summary}`, undefined, {duration: 4500});
      }),
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
              this.expandedHero.set(this.buildExpandedHero(card, hero, herosId, sessionId));
            }
            if (this.activeHeroId() === herosId) {
              this.activeArmes.set(equippedArmes(loadedArmes(hero)));
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

  /** Un enregistrement de l'état du combat est en cours : les actions de tour suivantes sont
   * ignorées tant que la base n'a pas répondu, sinon elles partiraient d'un état périmé. */
  private savingEtat = false;

  /** Enregistre l'état du combat, puis recharge la session : l'affichage suit toujours la base. Ne
   * fait rien si l'état ne change pas (plus personne ne peut jouer) ou si un enregistrement est en
   * cours. */
  private saveEtat(next: EtatCombat): void {
    const sessionId = this.sessionId();
    if (!sessionId || this.mode() !== 'combat' || this.savingEtat || next === this.etat()) {
      return;
    }

    this.savingEtat = true;
    this.fightSessionService
      .updateCombatState(sessionId, {round: next.round, joues: [...next.joues], defense_totale: [...next.defense_totale], exclus: [...next.exclus]})
      .subscribe({
        next: () => {
          this.savingEtat = false;
          this.loadSession(sessionId);
        },
        error: (error: unknown) => {
          this.savingEtat = false;
          this.tableError(error, "Impossible d'enregistrer le tour.");
        },
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

  protected onEndTurn(): void {
    this.targetKey.set(null);
    this.saveEtat(endTurn(this.orderedCards(), this.etat()));
  }

  protected onTotalDefense(): void {
    this.targetKey.set(null);
    this.saveEtat(totalDefense(this.orderedCards(), this.etat()));
  }

  protected onGiveBackTurn(key: string): void {
    this.saveEtat(giveBackTurn(this.etat(), key));
  }

  /** Clic sur une carte désignable (ou « Attaquer cette carte ») : elle devient la cible de la carte active. */
  protected onAttackCard(target: TapisCard): void {
    const attacker = this.activeCard();
    if (attacker && attacker.key !== target.key) {
      this.targetKey.set(target.key);
    }
  }

  /** « Jet détaillé » : le dialogue d'attaque complet (faveur divine, conversions de succès, dés de bonus). */
  protected onDetailedAttack(): void {
    const attacker = this.activeCard();
    const target = this.selectedTarget();
    if (!attacker || !target) {
      this.snackBar.open("Choisis d'abord une cible.", 'Fermer', {duration: 4000});
      return;
    }

    const choice = this.attackChoice();
    if (!choice) {
      this.snackBar.open('Choisis une arme secondaire légère ou moyenne pour cette posture.', 'Fermer', {duration: 5000});
      return;
    }

    this.openAttackDialog(attacker, target, choice);
  }

  /** Dégâts calculés par l'assistant : enregistrés sur la cible, puis écrits au journal. */
  protected onHitApplied(hit: AppliedHit): void {
    const attacker = this.activeCard();
    const delta = -hit.damage;
    const line = `Round ${this.etat().round} · ${attacker?.nom ?? '—'} → ${hit.target.nom} : ${hit.damage > 0 ? `−${hit.damage}` : 'aucun dégât'}`;
    this.combatLog.update((log) => [line, ...log].slice(0, 12));
    if (delta !== 0) {
      this.applyDamageTo(hit.target, delta, this.targetStats());
    }
  }

  /** Ouvre le dialogue d'attaque existant, prérempli. Les stats sont résolues à partir des jetons
   * (`PlayToken`) correspondant aux deux cartes. */
  private openAttackDialog(attacker: TapisCard, target: TapisCard, choice: AttackChoice): void {
    const sessionId = this.sessionId();
    const tokens = this.board()?.tokens ?? [];
    const attackerToken = tokenForCard(tokens, attacker);
    const targetToken = tokenForCard(tokens, target);
    if (!sessionId || !attackerToken || !targetToken) {
      return;
    }

    const targetInTotalDefense = this.etat().defense_totale.includes(target.key);

    forkJoin({
      attacker: resolveAttackStats(attackerToken, this.herosService),
      target: resolveAttackStats(targetToken, this.herosService),
    }).subscribe(({attacker: attackerStats, target: targetStats}) => {
      const finalAttacker = choice.degats ? {...attackerStats, degats: choice.degats} : attackerStats;
      // Défense totale (02-actions-combat.md) : +2 en défense jusqu'au prochain tour de la cible.
      const finalTarget = targetInTotalDefense ? {...targetStats, defense: targetStats.defense + 2} : targetStats;
      const posture = choice.posture;

      this.dialog
        .open(AttackRollDialogComponent, {
          maxWidth: 'min(32rem, 92vw)',
          panelClass: 'atd-panel',
          data: {
            attackerNom: attacker.nom,
            targetNom: target.nom,
            attackerAvatar: attacker.avatar,
            targetAvatar: target.avatar,
            attacker: finalAttacker,
            target: finalTarget,
            legendaryBonusActive: attackerToken.tier === 'legendaire',
            posture: posture ? {label: posture.label, slug: posture.slug, modificateur: posture.modificateur} : null,
          },
        })
        .afterClosed()
        .subscribe((delta: number | undefined) => {
          if (delta === undefined) {
            return;
          }

          this.applyDamageTo(target, delta, targetStats);
        });
    });
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

        const newVitalite = (target.vitaliteCourante ?? 0) + delta;
        if (targetStats?.herosId && newVitalite < 0) {
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
      this.onEndTurn();
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
