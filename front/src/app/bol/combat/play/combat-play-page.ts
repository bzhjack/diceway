import {NgTemplateOutlet} from '@angular/common';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {forkJoin, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {BolFightSessionModel, CombatCamp} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolPnjService} from '../../services/bol-pnj.service';
import {combatantKindIcon, combatantKindIconIsSvg} from '../select/combat-statblock.util';
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
import {AddCombatantDialogComponent} from './add-combatant-dialog/add-combatant-dialog';
import {AttackMenuComponent, CombatReminderStat} from './attack-menu/attack-menu';

const COLS_PER_ZONE = 3;
const HERO_ZONE = {xMin: 8, xMax: 32, yMin: 16, yMax: 84};
const ADVERSAIRE_ZONE = {xMin: 68, xMax: 92, yMin: 16, yMax: 84};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Armes + attributs de combat d'un héros, chargés à la demande à l'ouverture du menu épée. */
interface HeroMenuData {
  readonly armes: readonly BolHerosArmeModel[];
  readonly agilite: number;
  readonly vigueur: number;
  readonly melee: number;
  readonly tir: number;
  readonly defense: number;
}

/** Petit décalage déterministe (basé sur la clé du jeton) pour éviter un alignement trop rigide sur la carte. */
function jitter(key: string): {jx: number; jy: number} {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const jx = ((hash % 1000) / 1000) * 2 - 1;
  const jy = (((hash >> 8) % 1000) / 1000) * 2 - 1;
  return {jx, jy};
}

/**
 * Écran plein page affiché après « Lancer le combat » : ruban d'initiative en haut (réordonnable
 * par glisser-déposer, persisté en base), battlemap en dessous où les jetons sont librement
 * déplaçables (glisser-déposer, non persisté celui-ci — repositionnés par défaut à chaque
 * rechargement). Un combattant peut être ajouté ou retiré en cours de combat depuis le ruban ; les
 * PV restent en revanche non modifiables pour l'instant.
 */
@Component({
  selector: 'bol-combat-play-page',
  imports: [MatIconModule, NgTemplateOutlet, RouterLink, DragDropModule, AttackMenuComponent],
  templateUrl: './combat-play-page.html',
  styleUrl: './combat-play-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancelTargeting()',
  },
})
export class CombatPlayPageComponent {
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

  protected readonly board = computed(() => {
    const session = this.session();
    return session ? buildPlayBoard(session) : null;
  });

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

  /** Jeton attaquant en cours de ciblage (menu épée confirmé) — null hors mode ciblage. */
  protected readonly attackSourceKey = signal<string | null>(null);
  protected readonly attackSourceCamp = computed(
    () => this.orderedTokens().find((t) => t.key === this.attackSourceKey())?.camp ?? null,
  );

  /** Dégâts de l'arme choisie dans le menu épée pour l'attaquant en cours de ciblage. */
  private readonly attackDegats = signal<string | null>(null);

  /** Armes + attributs de combat des héros chargés à la demande (clé de jeton → données), pour remplir le menu épée sans tout précharger. */
  private readonly heroMenuData = signal<ReadonlyMap<string, HeroMenuData>>(new Map());

  protected readonly kindIcon = combatantKindIcon;
  protected readonly kindIconIsSvg = combatantKindIconIsSvg;

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
        data: {sessionId, existingHeroIds, existingPnjIds},
      })
      .afterClosed()
      .subscribe((didAdd: boolean | undefined) => {
        if (didAdd) {
          this.loadSession(sessionId);
        }
      });
  }

  protected askRemoveCombatant(token: PlayToken, event: Event): void {
    event.stopPropagation();

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

  /** Menu épée ouvert sur un jeton : charge les armes + attributs du héros à la demande (pas de préchargement pour tout le plateau). */
  protected loadArmes(token: PlayToken): void {
    if (token.kind !== 'hero' || this.heroMenuData().has(token.key)) {
      return;
    }

    const herosId = token.combat.sourceId;
    if (!herosId) {
      return;
    }

    this.herosService
      .heros(herosId)
      .pipe(take(1))
      .subscribe((hero) => {
        const armes = Array.isArray(hero.armes) && hero.armes.length > 0 && typeof hero.armes[0] !== 'number' ? (hero.armes as BolHerosArmeModel[]) : [];
        this.heroMenuData.update((map) =>
          new Map(map).set(token.key, {
            armes,
            agilite: hero.attributs.agilite,
            vigueur: hero.attributs.vigueur,
            melee: hero.combat.melee,
            tir: hero.combat.tir,
            defense: hero.combat.defense,
          }),
        );
      });
  }

  /** Armes du héros pour le menu épée d'un jeton — tableau vide pour pnj/créature/démon ou tant que non chargé. */
  protected armesFor(token: PlayToken): readonly BolHerosArmeModel[] {
    return this.heroMenuData().get(token.key)?.armes ?? [];
  }

  /** Rappel d'attributs de combat affiché dans le menu épée — héros : chargés à la demande ; autres : déjà dans le snapshot. */
  protected combatStatsFor(token: PlayToken): readonly CombatReminderStat[] {
    if (token.kind === 'hero') {
      const data = this.heroMenuData().get(token.key);
      if (!data) {
        return [];
      }
      return [
        {label: 'Agilité', value: data.agilite},
        {label: 'Vigueur', value: data.vigueur},
        {label: 'Mêlée', value: data.melee},
        {label: 'Tir', value: data.tir},
        {label: 'Défense', value: data.defense},
      ];
    }

    const c = token.combat;
    const stats: CombatReminderStat[] = [
      {label: 'Agilité', value: c.agilite ?? 0},
      {label: 'Vigueur', value: c.vigueur ?? 0},
    ];

    if (c.attaque !== null) {
      stats.push({label: 'Attaque', value: c.attaque});
    } else {
      stats.push({label: 'Mêlée', value: c.melee ?? 0}, {label: 'Tir', value: c.tir ?? 0});
    }

    stats.push({label: 'Défense', value: c.defense ?? 0});
    return stats;
  }

  /** Menu épée confirmé (arme choisie) : entre en mode ciblage pour cet attaquant. */
  protected onAttackConfirmed(token: PlayToken, degats: string | null): void {
    this.attackDegats.set(degats);
    this.attackSourceKey.set(token.key);
  }

  protected cancelTargeting(): void {
    this.attackSourceKey.set(null);
    this.attackDegats.set(null);
  }

  /** Clic sur un jeton en mode ciblage : une cible adverse ouvre le dialog d'attaque, l'attaquant lui-même annule. */
  protected onTokenClick(token: PlayToken, event: Event): void {
    const sourceKey = this.attackSourceKey();
    if (!sourceKey) {
      return;
    }

    event.stopPropagation();

    if (token.key === sourceKey) {
      this.cancelTargeting();
      return;
    }

    const attacker = this.orderedTokens().find((t) => t.key === sourceKey);
    if (!attacker || token.camp === attacker.camp) {
      return;
    }

    const degats = this.attackDegats();
    this.cancelTargeting();
    this.openAttackDialog(attacker, token, degats);
  }

  private openAttackDialog(attacker: PlayToken, target: PlayToken, degats: string | null): void {
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
          },
        })
        .afterClosed()
        .subscribe((delta: number | undefined) => {
          if (delta === undefined) {
            return;
          }

          this.fightSessionService.applyDamage(sessionId, target.kind, target.pivotId, delta, target.instanceIndex).subscribe({
            next: () => this.loadSession(sessionId),
            error: (error: unknown) => {
              this.snackBar.open(extractApiErrorMessage(error, "Impossible d'appliquer les dégâts."), 'Fermer', {
                duration: 5000,
              });
            },
          });
        });
    });
  }

  /** Double-clic sur un jeton : consulte son statblock (récupéré en direct, seules les stats de combat sont snapshotées). */
  protected openStatblock(token: PlayToken, event: Event): void {
    event.stopPropagation();

    const sourceId = token.combat.sourceId;
    if (!sourceId) {
      return;
    }

    switch (token.kind) {
      case 'hero':
        this.herosService
          .heros(sourceId)
          .pipe(take(1))
          .subscribe((hero) =>
            openStatblockDialog(this.dialog, BolStatblockComponent, {data: heroStatblockData(hero), imageSrc: token.avatar}),
          );
        break;
      case 'pnj':
        this.pnjService
          .pnj(sourceId)
          .pipe(take(1))
          .subscribe((pnj) =>
            openStatblockDialog(this.dialog, BolStatblockComponent, {data: pnjStatblockData(pnj), imageSrc: token.avatar}),
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
            }),
          );
        break;
      case 'demon':
        this.demonsService
          .demon(sourceId)
          .pipe(take(1))
          .subscribe((demon) =>
            openStatblockDialog(this.dialog, BolStatblockComponent, {data: demonStatblockData(demon), imageSrc: token.avatar}),
          );
        break;
    }
  }

  /** Glisser-déposer dans le ruban : réordonnancement manuel, persisté en base. */
  protected onRailDrop(event: CdkDragDrop<PlayToken[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const sessionId = this.session()?.id;
    const keys = this.orderedTokens().map((t) => t.key);
    moveItemInArray(keys, event.previousIndex, event.currentIndex);
    this.manualOrder.set(keys);

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

  private loadSession(id: string): void {
    this.fightSessionService
      .fightSession(id)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.manualOrder.set(session.ordre_manuel ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Impossible de charger ce combat.');
          this.loading.set(false);
        },
      });
  }

  protected hpPct(token: PlayToken): number {
    if (token.vitaliteMax === null || token.vitaliteMax <= 0 || token.vitaliteCourante === null) {
      return 100;
    }

    return Math.max(0, Math.min(100, (token.vitaliteCourante / token.vitaliteMax) * 100));
  }

  protected hpColor(token: PlayToken): string {
    return this.hpPct(token) <= 50 ? 'var(--dw-color-echec)' : 'var(--dw-color-reussite)';
  }

  protected chipClass(token: PlayToken): string {
    const active = token.key === this.activeKey() ? ' cp-rail-chip--active' : '';
    return `cp-rail-chip cp-rail-chip--${token.kind}${active}`;
  }

  protected tokenClass(token: PlayToken): string {
    const active = token.key === this.activeKey() ? ' cp-token--active' : '';
    const sourceKey = this.attackSourceKey();
    const isSource = sourceKey && token.key === sourceKey ? ' cp-token--attack-source' : '';
    const isTargetable =
      sourceKey && token.key !== sourceKey && token.camp !== this.attackSourceCamp() ? ' cp-token--attack-target' : '';
    // En mode ciblage, aucun jeton ne doit révéler son épée au survol : on clique la cible directement.
    const targeting = sourceKey ? ' cp-token--targeting' : '';
    return `cp-token cp-token--${token.kind}${active}${isSource}${isTargetable}${targeting}`;
  }

  /** Position par défaut d'un jeton sur la battlemap (héros à gauche, adversaires à droite), avant tout glisser-déposer. */
  protected tokenStyle(token: PlayToken, indexInCamp: number, camp: CombatCamp): Record<string, string> {
    const zone = camp === 'heros' ? HERO_ZONE : ADVERSAIRE_ZONE;
    const campCount = (camp === 'heros' ? this.heroTokens() : this.adversaireTokens()).length;
    const rows = Math.max(1, Math.ceil(campCount / COLS_PER_ZONE));

    const col = indexInCamp % COLS_PER_ZONE;
    const row = Math.floor(indexInCamp / COLS_PER_ZONE);
    const colWidth = (zone.xMax - zone.xMin) / COLS_PER_ZONE;
    const rowHeight = (zone.yMax - zone.yMin) / rows;
    const baseX = zone.xMin + colWidth * (col + 0.5);
    const baseY = zone.yMin + rowHeight * (row + 0.5);

    const {jx, jy} = jitter(token.key);
    const x = clamp(baseX + jx * colWidth * 0.18, zone.xMin, zone.xMax);
    const y = clamp(baseY + jy * rowHeight * 0.18, zone.yMin, zone.yMax);

    return {left: `${x}%`, top: `${y}%`};
  }
}
