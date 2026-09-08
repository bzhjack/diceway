import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {forkJoin, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {BolFightSessionModel} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolCombatOptionModel} from '../../services/bol-combat-reference.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolPnjService} from '../../services/bol-pnj.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {
  creatureStatblockData,
  demonStatblockData,
  heroStatblockData,
  pnjStatblockData,
} from '../../shared/statblock/bol-statblock.builders';
import {AttackRollDialogComponent} from '../attack-roll-dialog/attack-roll-dialog';
import {resolveAttackStats} from '../combat-attack.util';
import {buildPlayBoard, PlayToken} from '../combat-play.util';
import {ActionRollDiceTrait, ActionRollDialogComponent} from './action-roll-dialog/action-roll-dialog';
import {AddCombatantDialogComponent} from './add-combatant-dialog/add-combatant-dialog';
import {AttackRequest, BattlemapComponent, TokenPositionChange} from './battlemap/battlemap';
import {maybePromptDefierLaMort} from './defier-la-mort-dialog/defier-la-mort.util';
import {HeroStatblockDialogComponent} from './hero-statblock-dialog/hero-statblock-dialog';
import {InitiativeRailComponent} from './initiative-rail/initiative-rail';
import {SessionHeaderComponent} from './session-header/session-header';
import {StartCombatDialogComponent} from './start-combat-dialog/start-combat-dialog';

/**
 * Écran plein page affiché après « Lancer le combat » : orchestre le chargement/la persistance de
 * la session et l'ouverture des dialogs — l'affichage est délégué à `bol-session-header` (titre,
 * actions), `bol-initiative-rail` (ruban réordonnable) et `bol-battlemap` (jetons, ciblage, menus).
 */
@Component({
  selector: 'bol-session-play-page',
  imports: [RouterLink, SessionHeaderComponent, InitiativeRailComponent, BattlemapComponent],
  templateUrl: './session-play-page.html',
  styleUrl: './session-play-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Combat introuvable.');
      this.loading.set(false);
      return;
    }

    this.loadSession(id);
  }

  protected openAddCombatantDialog(): void {
    const session = this.session();
    const sessionId = session?.id;
    if (!session || !sessionId) {
      return;
    }

    const existingHeroIds = new Set((session.heros ?? []).map((h) => String(h.heros_id)));
    const existingPnjIds = new Set(
      (session.pnjs ?? []).map((p) => p.pnj_id).filter((pnjId): pnjId is string => !!pnjId).map(String),
    );

    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {sessionId, existingHeroIds, existingPnjIds, lockKind: this.mode() === 'libre' ? 'hero' : undefined},
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
        message: 'Les adversaires seront retirés et la session repassera en mode libre. Continuer ?',
        confirmLabel: 'Terminer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.endCombat(sessionId).subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => {
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de terminer le combat.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
    });
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
        message: `Voulez-vous retirer « ${token.nom} » de ce combat ?`,
        confirmLabel: 'Retirer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.removeCombatant(sessionId, token.kind, token.pivotId).subscribe({
        next: () => this.loadSession(sessionId),
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

  /** Consultation du statbloc d'un jeton (récupéré en direct, seules les stats de combat sont snapshotées). */
  protected openStatblockFor(token: PlayToken): void {
    const sourceId = token.combat.sourceId;
    const sessionId = this.session()?.id;
    if (!sourceId || !sessionId) {
      return;
    }

    /** Lien "Modifier la fiche" (bol-statblock) : revenir sur cette session de combat après édition. */
    const returnUrl = `/session/${sessionId}/play`;

    switch (token.kind) {
      case 'hero': {
        this.herosService
          .heros(sourceId)
          .pipe(take(1))
          .subscribe((hero) => {
            this.dialog
              .open(HeroStatblockDialogComponent, {
                maxWidth: 'min(900px, 94vw)',
                panelClass: 'dw-statblock-dialog',
                position: {top: '10vh'},
                data: {
                  sessionId,
                  herosId: sourceId,
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
                },
              })
              .afterClosed()
              .subscribe((changed: boolean | undefined) => {
                if (changed) {
                  this.loadSession(sessionId);
                }
              });
          });
        break;
      }
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

  protected onActionRoll(token: PlayToken): void {
    const herosId = token.combat.sourceId;
    if (!herosId) {
      return;
    }

    this.herosService
      .heros(herosId)
      .pipe(take(1))
      .subscribe((hero) => {
        this.dialog.open(ActionRollDialogComponent, {
          maxWidth: 'min(56rem, 94vw)',
          panelClass: 'ard-panel',
          data: {
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
        });
      });
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
          this.errorMessage.set('Impossible de charger ce combat.');
          this.loading.set(false);
        },
      });
  }
}
