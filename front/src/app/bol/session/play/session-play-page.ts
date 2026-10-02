import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {forkJoin, Observable, of, take, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {BolFightSessionModel} from '../../models/bol-fight-session.model';
import {BolSceneModel} from '../../models/bol-scene.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolCombatOptionModel} from '../../services/bol-combat-reference.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolPnjService} from '../../services/bol-pnj.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {CombatantKind, CombatSelectionService} from '../../services/combat-selection.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {BolStatblockComponent, BolStatblockData} from '../../shared/statblock/bol-statblock.component';
import {
  creatureStatblockData,
  demonStatblockData,
  heroStatblockData,
  pnjStatblockData,
} from '../../shared/statblock/bol-statblock.builders';
import {AttackRollDialogComponent} from '../attack-roll-dialog/attack-roll-dialog';
import {resolveAttackStats} from '../combat-attack.util';
import {buildPlayBoard, PlayToken, postCombatRecoveryAmount} from '../combat-play.util';
import {ActionRollDiceTrait, LastRoll} from '../action-roll.util';
import {SceneActionsService} from '../scene-actions.service';
import {AddCombatantDialogComponent, resolveAddCombatantCamp} from './add-combatant-dialog/add-combatant-dialog';
import {openCommandPalette} from './command-palette/command-palette';
import {PaletteActionId, PaletteCommand, PaletteContext} from './command-palette/command-palette.util';
import {isPaletteShortcut} from './command-palette/shortcut.util';
import {reserveTab} from './reserve/reserve.util';
import {AttackRequest, BattlemapComponent, TokenPositionChange} from './battlemap/battlemap';
import {maybePromptDefierLaMort} from './defier-la-mort-dialog/defier-la-mort.util';
import {HeroStatblockDialogData} from './hero-statblock-dialog/hero-statblock-dialog';
import {HeroStatblockPopupComponent} from './hero-statblock-popup/hero-statblock-popup';
import {InitiativeRailComponent} from './initiative-rail/initiative-rail';
import {tableTitle} from './scene-list/scene.util';
import {SessionHeaderComponent} from './session-header/session-header';
import {ReserveComponent} from './reserve/reserve';
import {StartCombatDialogComponent} from './start-combat-dialog/start-combat-dialog';
import {
  browserStorage,
  findSelectedToken,
  readPanelOpen,
  RESERVE_PANEL_KEY,
  writePanelOpen,
} from './table-state.util';
import {TokenInspectorComponent, TokenInspectorHeroData} from './token-inspector/token-inspector';

/**
 * La table : page d'accueil d'une session. Orchestre le chargement/la persistance de la session et
 * l'ouverture des dialogs — l'affichage est délégué à `bol-session-header`, `bol-reserve` (poser des
 * personnages, mode libre), `bol-battlemap` (jetons), `bol-token-inspector` (fiche du jeton, mode
 * libre) et `bol-initiative-rail` (mode combat).
 */
@Component({
  selector: 'bol-session-play-page',
  imports: [
    RouterLink,
    MatIconModule,
    SessionHeaderComponent,
    InitiativeRailComponent,
    BattlemapComponent,
    ReserveComponent,
    TokenInspectorComponent,
  ],
  templateUrl: './session-play-page.html',
  styleUrl: './session-play-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeInspector()',
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

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly session = signal<BolFightSessionModel | null>(null);

  /** Positions des jetons sur la battlemap (glisser-déposer libre), persistées en base — clé `PlayToken.key` → {x, y} en pourcentage. */
  protected readonly tokenPositions = signal<Readonly<Record<string, {x: number; y: number}>>>({});

  protected readonly board = computed(() => {
    const session = this.session();
    return session ? buildPlayBoard(session) : null;
  });

  /** Dérivé de `statut` — `'terminee'` n'a pas d'affichage dédié pour l'instant, traité comme `'libre'`. */
  protected readonly mode = computed<'libre' | 'combat'>(() => (this.session()?.statut === 'combat' ? 'combat' : 'libre'));

  /** Réordonnancement manuel du ruban (glisser-déposer), persisté en base — clés dans l'ordre voulu. */
  private readonly manualOrder = signal<readonly string[] | null>(null);

  /** Ordre d'initiative affiché : ordre calculé par défaut, sauf réordonnancement manuel ; les
   * nouveaux combattants (ajout en cours de combat) rejoignent la fin, ceux retirés disparaissent. */
  protected readonly orderedTokens = computed(() => {
    const tokens = this.board()?.tokens ?? [];
    const order = this.manualOrder();
    if (!order) {
      return tokens;
    }

    const byKey = new Map(tokens.map((t) => [t.key, t]));
    const reordered = order.map((key) => byKey.get(key)).filter((t): t is PlayToken => !!t);
    const knownKeys = new Set(reordered.map((t) => t.key));
    const missing = tokens.filter((t) => !knownKeys.has(t.key));
    return [...reordered, ...missing];
  });

  protected readonly heroTokens = computed(() => this.board()?.tokens.filter((t) => t.camp === 'heros') ?? []);
  protected readonly adversaireTokens = computed(
    () => this.board()?.tokens.filter((t) => t.camp === 'adversaires') ?? [],
  );

  /** Premier de l'ordre affiché (calculé ou réordonné) = combattant dont c'est le tour. */
  protected readonly activeKey = computed(() => this.orderedTokens()[0]?.key ?? null);

  protected readonly sessionId = computed(() => this.session()?.id ?? null);

  /** Page à laquelle revenir depuis un formulaire ou une bibliothèque ouverts depuis la table. */
  protected readonly returnUrl = computed(() => {
    const id = this.sessionId();
    return id ? `/session/${id}/play` : null;
  });

  protected readonly existingHeroIds = computed<ReadonlySet<string>>(
    () => new Set((this.session()?.heros ?? []).map((h) => String(h.heros_id))),
  );
  protected readonly existingPnjIds = computed<ReadonlySet<string>>(
    () =>
      new Set(
        (this.session()?.pnjs ?? [])
          .map((p) => p.pnj_id)
          .filter((pnjId): pnjId is string => !!pnjId)
          .map(String),
      ),
  );

  protected readonly reserveOpen = signal(readPanelOpen(browserStorage(), RESERVE_PANEL_KEY, true));

  /** Clé du jeton dont la fiche est ouverte (mode libre). */
  private readonly selectedKey = signal<string | null>(null);
  protected readonly selectedToken = computed(() =>
    findSelectedToken(this.board()?.tokens ?? [], this.selectedKey(), this.mode()),
  );
  /** Données de la fiche, chargées à la sélection — `null` pendant le chargement. */
  protected readonly inspectorHero = signal<TokenInspectorHeroData | null>(null);
  protected readonly inspectorStatblock = signal<BolStatblockData | null>(null);

  protected readonly lastRoll = signal<LastRoll | null>(null);

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
    tokens: (this.board()?.tokens ?? []).map((token) => ({key: token.key, nom: token.nom, kind: token.kind})),
    catalog: this.selection.catalog(),
    heroIds: this.existingHeroIds(),
    pnjIds: this.existingPnjIds(),
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
          existingPnjIds: this.existingPnjIds(),
        },
      })
      .afterClosed()
      .subscribe((didAdd: boolean | undefined) => {
        if (didAdd) {
          this.loadSession(sessionId);
        }
      });
  }

  protected openStartCombatDialog(): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    this.dialog
      .open(StartCombatDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        panelClass: 'scd-panel',
        data: {sessionId},
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

  protected askRemoveCombatant(token: PlayToken): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: 'Retirer ce combattant',
        message: `Voulez-vous retirer « ${token.nom} » de la table ?`,
        confirmLabel: 'Retirer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.removeCombatant(sessionId, token.kind, token.pivotId).subscribe({
        next: () => {
          if (this.selectedKey() === token.key) {
            this.selectedKey.set(null);
          }
          this.loadSession(sessionId);
        },
        error: (error: unknown) => {
          this.snackBar.open(
            extractApiErrorMessage(error, 'Impossible de retirer ce combattant.'),
            'Fermer',
            {duration: 5000},
          );
        },
      });
    });
  }

  protected onAttackRequested({attacker, target, degats, posture}: AttackRequest): void {
    this.openAttackDialog(attacker, target, degats, posture);
  }

  private openAttackDialog(
    attacker: PlayToken,
    target: PlayToken,
    degats: string | null,
    posture: BolCombatOptionModel | null,
  ): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    forkJoin({
      attacker: resolveAttackStats(attacker, this.herosService),
      target: resolveAttackStats(target, this.herosService),
    }).subscribe(({attacker: attackerStats, target: targetStats}) => {
      const finalAttacker = degats ? {...attackerStats, degats} : attackerStats;

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
            target: targetStats,
            legendaryBonusActive: attacker.tier === 'legendaire',
            posture: posture ? {label: posture.label, slug: posture.slug, modificateur: posture.modificateur} : null,
          },
        })
        .afterClosed()
        .subscribe((delta: number | undefined) => {
          if (delta === undefined) {
            return;
          }

          this.fightSessionService.applyDamage(sessionId, target.kind, target.pivotId, delta, target.instanceIndex).subscribe({
            next: () => {
              this.loadSession(sessionId);

              const newVitalite = (target.vitaliteCourante ?? 0) + delta;
              if (targetStats.herosId && newVitalite < 0) {
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
            error: (error: unknown) => {
              this.snackBar.open(extractApiErrorMessage(error, "Impossible d'appliquer les dégâts."), 'Fermer', {
                duration: 5000,
              });
            },
          });
        });
    });
  }

  /** Bouton « carte » ou double-clic sur un jeton. Mode libre : sélectionne le jeton (fiche du jeton).
   * Mode combat : dialog de statbloc dédié, comme avant. */
  protected openStatblockFor(token: PlayToken): void {
    if (this.mode() === 'libre') {
      this.onTokenSelected(token);
      return;
    }

    const sourceId = token.combat.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    /** Lien "Modifier la fiche" (bol-statblock) : revenir sur cette table après édition. */
    const returnUrl = `/session/${sessionId}/play`;

    switch (token.kind) {
      case 'hero':
        this.openHeroPopup(token, sourceId, sessionId);
        break;
      case 'pnj':
        this.pnjService
          .pnj(sourceId)
          .pipe(take(1))
          .subscribe((pnj) =>
            openStatblockDialog(this.dialog, BolStatblockComponent, {
              data: pnjStatblockData(pnj),
              imageSrc: token.avatar,
              returnUrl,
            }),
          );
        break;
      case 'creature':
        this.creaturesService
          .creature(sourceId)
          .pipe(take(1))
          .subscribe((creature) =>
            openStatblockDialog(this.dialog, BolStatblockComponent, {
              data: creatureStatblockData(creature),
              imageSrc: token.avatar,
              returnUrl,
            }),
          );
        break;
      case 'demon':
        this.demonsService
          .demon(sourceId)
          .pipe(take(1))
          .subscribe((demon) =>
            openStatblockDialog(this.dialog, BolStatblockComponent, {
              data: demonStatblockData(demon),
              imageSrc: token.avatar,
              returnUrl,
            }),
          );
        break;
    }
  }

  protected toggleReserve(): void {
    const next = !this.reserveOpen();
    this.reserveOpen.set(next);
    writePanelOpen(browserStorage(), RESERVE_PANEL_KEY, next);
  }

  /** Clic sur un jeton : ouvre sa fiche (mode libre). Recliquer le même jeton ne recharge rien, pour
   * ne pas perdre un jet en cours. */
  protected onTokenSelected(token: PlayToken): void {
    if (this.mode() !== 'libre' || this.selectedKey() === token.key) {
      return;
    }

    this.selectedKey.set(token.key);
    this.loadInspector(token);
  }

  protected closeInspector(): void {
    this.selectedKey.set(null);
  }

  protected reloadSession(): void {
    const sessionId = this.sessionId();
    if (sessionId) {
      this.loadSession(sessionId);
    }
  }

  /** Une scène a été chargée, enregistrée, renommée ou supprimée : la table a pu changer du tout au
   * tout, la fiche du jeton est fermée avant de recharger la session. */
  protected onSceneChanged(): void {
    this.closeInspector();
    this.reloadSession();
  }

  /** `/` ou `Ctrl+K` : ouvre la barre de commande, sauf si un dialogue est déjà ouvert. */
  protected onKeydown(event: KeyboardEvent): void {
    if (!isPaletteShortcut(event, event.target as HTMLElement | null) || this.dialog.openDialogs.length > 0) {
      return;
    }
    event.preventDefault();
    this.openPalette();
  }

  protected openPalette(): void {
    if (!this.sessionId() || this.dialog.openDialogs.length > 0) {
      return;
    }

    // La barre s'ouvre tout de suite ; bibliothèque et scènes complètent ses résultats à leur arrivée.
    // En combat la réserve n'est pas affichée : la bibliothèque peut ne jamais avoir été chargée.
    if (this.selection.catalog().length === 0) {
      this.selection.loadCatalog();
    }
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
        const token = this.board()?.tokens.find((t) => t.key === command.key);
        if (token) {
          this.onTokenSelected(token);
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

  /** Charge les données de la fiche du jeton. Chaque réponse est ignorée si un autre jeton a été
   * sélectionné entre-temps (réponses arrivées dans le désordre). */
  private loadInspector(token: PlayToken): void {
    this.inspectorHero.set(null);
    this.inspectorStatblock.set(null);

    const sourceId = token.combat.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    const stillSelected = (): boolean => this.selectedKey() === token.key;

    switch (token.kind) {
      case 'hero':
        this.herosService
          .heros(sourceId)
          .pipe(take(1))
          .subscribe((hero) => {
            if (stillSelected()) {
              this.inspectorHero.set(this.buildInspectorHero(token, hero, sourceId, sessionId));
            }
          });
        break;
      case 'pnj':
        this.pnjService
          .pnj(sourceId)
          .pipe(take(1))
          .subscribe((pnj) => {
            if (stillSelected()) {
              this.inspectorStatblock.set(pnjStatblockData(pnj));
            }
          });
        break;
      case 'creature':
        this.creaturesService
          .creature(sourceId)
          .pipe(take(1))
          .subscribe((creature) => {
            if (stillSelected()) {
              this.inspectorStatblock.set(creatureStatblockData(creature));
            }
          });
        break;
      case 'demon':
        this.demonsService
          .demon(sourceId)
          .pipe(take(1))
          .subscribe((demon) => {
            if (stillSelected()) {
              this.inspectorStatblock.set(demonStatblockData(demon));
            }
          });
        break;
    }
  }

  private buildInspectorHero(
    token: PlayToken,
    hero: BolHerosModel,
    herosId: string,
    sessionId: string,
  ): TokenInspectorHeroData {
    return {
      resources: {
        sessionId,
        herosId,
        pivotId: token.pivotId,
        heroNom: token.nom,
        vitaliteCourante: token.vitaliteCourante ?? hero.ressources.vitalite,
        vitaliteMax: hero.ressources.vitalite,
      },
      actionRoll: {
        heroNom: token.nom,
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

  /** « Fiche complète » depuis la fiche du jeton : statbloc du héros en dialog. À la fermeture, si
   * quelque chose a changé (vitalité, héroïsme, équipement), la session et la fiche sont rechargées. */
  protected openFullSheet(token: PlayToken): void {
    const sourceId = token.combat.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    this.openHeroPopup(token, sourceId, sessionId, () => this.loadInspector(token));
  }

  private openHeroPopup(token: PlayToken, herosId: string, sessionId: string, onChanged?: () => void): void {
    const returnUrl = `/session/${sessionId}/play`;
    this.herosService
      .heros(herosId)
      .pipe(take(1))
      .subscribe((hero) => {
        this.dialog
          .open(HeroStatblockPopupComponent, {
            maxWidth: 'min(900px, 94vw)',
            panelClass: 'dw-statblock-dialog',
            position: {top: '10vh'},
            data: this.buildHeroStatblockData(token, hero, herosId, sessionId, returnUrl),
          })
          .afterClosed()
          .subscribe((changed: boolean | undefined) => {
            if (changed) {
              this.loadSession(sessionId);
              onChanged?.();
            }
          });
      });
  }

  private buildHeroStatblockData(
    token: PlayToken,
    hero: BolHerosModel,
    herosId: string,
    sessionId: string,
    returnUrl: string,
  ): HeroStatblockDialogData {
    return {
      sessionId,
      herosId,
      pivotId: token.pivotId,
      heroNom: token.nom,
      avatar: token.avatar,
      statblock: heroStatblockData(hero),
      vitaliteCourante: token.vitaliteCourante ?? hero.ressources.vitalite,
      vitaliteMax: hero.ressources.vitalite,
      heroisme: hero.ressources.heroisme,
      armures: (hero.armures as (BolHerosArmureModel | number)[]).filter(
        (armure): armure is BolHerosArmureModel => typeof armure === 'object',
      ),
      returnUrl,
    };
  }

  /** Réordonnancement du ruban d'initiative (glisser-déposer dans `bol-initiative-rail`), persisté en base. */
  protected onRailReordered(keys: readonly string[]): void {
    this.manualOrder.set(keys);

    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    this.fightSessionService.updateOrder(sessionId, keys).subscribe({
      error: (error: unknown) => {
        this.snackBar.open(
          extractApiErrorMessage(error, "Impossible d'enregistrer ce nouvel ordre."),
          'Fermer',
          {duration: 5000},
        );
      },
    });
  }

  /** Glisser-déposer d'un jeton sur la battlemap (`bol-battlemap`) : position recalculée en % de la carte, persistée en base. */
  protected onPositionChanged({key, x, y}: TokenPositionChange): void {
    const positions = {...this.tokenPositions(), [key]: {x, y}};
    this.tokenPositions.set(positions);

    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    this.fightSessionService.updatePositions(sessionId, positions).subscribe({
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible d'enregistrer la position du jeton."), 'Fermer', {
          duration: 5000,
        });
      },
    });
  }

  private loadSession(id: string): void {
    this.fightSessionService
      .fightSession(id)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.manualOrder.set(session.ordre_manuel ?? null);
          this.tokenPositions.set(session.positions_jetons ?? {});
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Impossible de charger cette session.');
          this.loading.set(false);
        },
      });
  }
}
