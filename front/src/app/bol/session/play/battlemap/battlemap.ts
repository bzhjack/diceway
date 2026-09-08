import {CdkDragEnd, DragDropModule} from '@angular/cdk/drag-drop';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal, viewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {take} from 'rxjs';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {BolCombatOptionModel, BolCombatReferenceService} from '../../../services/bol-combat-reference.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {canTarget, EMPTY_AVATAR, PlayToken} from '../../combat-play.util';
import {AttackMenuComponent, AttackMenuConfirmation, CombatReminderStat, filterAttackMenuCombatOptions} from '../attack-menu/attack-menu';
import {HeroActionMenuComponent} from '../hero-action-menu/hero-action-menu';

const COLS_PER_ZONE = 3;
const HERO_ZONE = {xMin: 8, xMax: 32, yMin: 16, yMax: 84};
const ADVERSAIRE_ZONE = {xMin: 68, xMax: 92, yMin: 16, yMax: 84};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

export type BattlemapTerrain = 'herbe' | 'dalles' | 'terre';

/** Textures de sol disponibles pour la battlemap (vue du dessus, tuilées) — choix purement
 * cosmétique, mémorisé par navigateur (pas de portée de jeu, pas de persistance côté session). */
export const BATTLEMAP_TERRAINS: Record<BattlemapTerrain, {readonly label: string; readonly url: string}> = {
  herbe: {label: 'Herbe', url: '/assets/bol/herbe.jpg'},
  dalles: {label: 'Dalles', url: '/assets/bol/skins/dalles.jpg'},
  terre: {label: 'Terre battue', url: '/assets/bol/skins/terre.png'},
};

const TERRAIN_STORAGE_KEY = 'diceway-battlemap-terrain';

/** Valide une valeur lue en localStorage — retombe sur "herbe" si absente ou corrompue. */
export function parseBattlemapTerrain(value: string | null): BattlemapTerrain {
  return value === 'herbe' || value === 'dalles' || value === 'terre' ? value : 'herbe';
}

/** Armes + attributs de combat d'un héros, chargés à la demande à l'ouverture du menu épée. */
interface HeroMenuData {
  readonly armes: readonly BolHerosArmeModel[];
  readonly agilite: number;
  readonly vigueur: number;
  readonly esprit: number;
  readonly melee: number;
  readonly tir: number;
  readonly defense: number;
}

export interface AttackRequest {
  readonly attacker: PlayToken;
  readonly target: PlayToken;
  readonly degats: string | null;
  readonly posture: BolCombatOptionModel | null;
}

export interface TokenPositionChange {
  readonly key: string;
  readonly x: number;
  readonly y: number;
}

/**
 * Battlemap : jetons librement déplaçables (glisser-déposer, position remontée au parent pour
 * persistance), menu épée (ciblage d'attaque) et menu d'action héros, consultation du statbloc.
 * Ne persiste rien elle-même — toutes les mutations de session remontent au parent par événement.
 */
@Component({
  selector: 'bol-battlemap',
  imports: [MatIconModule, MatMenuModule, DragDropModule, NgTemplateOutlet, AttackMenuComponent, HeroActionMenuComponent],
  templateUrl: './battlemap.html',
  styleUrl: './battlemap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancelTargeting()',
  },
})
export class BattlemapComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly combatReferenceService = inject(BolCombatReferenceService);

  readonly mode = input.required<'libre' | 'combat'>();
  readonly heroTokens = input.required<readonly PlayToken[]>();
  readonly adversaireTokens = input.required<readonly PlayToken[]>();
  readonly activeKey = input<string | null>(null);
  /** Positions enregistrées (glisser-déposer précédent), persistées par le parent — clé de jeton → {x, y} en pourcentage. */
  readonly tokenPositions = input<Readonly<Record<string, {x: number; y: number}>>>({});

  readonly attackRequested = output<AttackRequest>();
  readonly statblockRequested = output<PlayToken>();
  readonly actionRollRequested = output<PlayToken>();
  readonly positionChanged = output<TokenPositionChange>();

  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('mapEl');

  protected readonly kindIcon = combatantKindIcon;
  protected readonly kindIconIsSvg = combatantKindIconIsSvg;

  /** Jetons (clé) dont l'avatar a échoué au chargement (404 sur un chemin conventionnel sans fichier réel) — retombe sur l'icône de type plutôt qu'une image cassée. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  protected readonly terrainOptions = Object.entries(BATTLEMAP_TERRAINS).map(([value, {label}]) => ({
    value: value as BattlemapTerrain,
    label,
  }));
  protected readonly terrain = signal<BattlemapTerrain>(parseBattlemapTerrain(localStorage.getItem(TERRAIN_STORAGE_KEY)));
  protected readonly terrainImage = computed(() => `url('${BATTLEMAP_TERRAINS[this.terrain()].url}')`);

  protected setTerrain(value: BattlemapTerrain): void {
    this.terrain.set(value);
    localStorage.setItem(TERRAIN_STORAGE_KEY, value);
  }

  /** Options de combat (postures) — référence statique chargée une fois, filtrée pour le menu épée. */
  private readonly combatOptions = signal<readonly BolCombatOptionModel[]>([]);
  protected readonly attackMenuCombatOptions = computed(() => filterAttackMenuCombatOptions(this.combatOptions()));

  /** Armes + attributs de combat des héros chargés à la demande (clé de jeton → données), pour remplir le menu épée sans tout précharger. */
  private readonly heroMenuData = signal<ReadonlyMap<string, HeroMenuData>>(new Map());

  /** Jeton attaquant en cours de ciblage (menu épée confirmé) — null hors mode ciblage. */
  protected readonly attackSourceKey = signal<string | null>(null);
  private readonly attackDegats = signal<string | null>(null);
  private readonly attackPosture = signal<BolCombatOptionModel | null>(null);

  private readonly allTokens = computed(() => [...this.heroTokens(), ...this.adversaireTokens()]);

  constructor() {
    this.combatReferenceService.getCombatOptions().pipe(take(1)).subscribe((options) => this.combatOptions.set(options));
  }

  protected hasAvatar(token: PlayToken): boolean {
    return token.avatar !== EMPTY_AVATAR && !this.brokenAvatars().has(token.key);
  }

  protected onAvatarError(token: PlayToken): void {
    this.brokenAvatars.update((set) => new Set(set).add(token.key));
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
        const armes =
          Array.isArray(hero.armes) && hero.armes.length > 0 && typeof hero.armes[0] !== 'number'
            ? (hero.armes as BolHerosArmeModel[])
            : [];
        this.heroMenuData.update((map) =>
          new Map(map).set(token.key, {
            armes,
            agilite: hero.attributs.agilite_effective,
            vigueur: hero.attributs.vigueur,
            esprit: hero.attributs.esprit,
            melee: hero.combat.melee,
            tir: hero.combat.tir,
            defense: hero.combat.defense_effective,
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

  /** Menu épée confirmé (arme + posture choisies) : entre en mode ciblage pour cet attaquant. */
  protected onAttackConfirmed(token: PlayToken, {degats, posture}: AttackMenuConfirmation): void {
    this.attackDegats.set(degats);
    this.attackPosture.set(posture);
    this.attackSourceKey.set(token.key);
  }

  protected cancelTargeting(): void {
    this.attackSourceKey.set(null);
    this.attackDegats.set(null);
    this.attackPosture.set(null);
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

    const attacker = this.allTokens().find((t) => t.key === sourceKey);
    if (!attacker || !canTarget(token, sourceKey)) {
      return;
    }

    const degats = this.attackDegats();
    const posture = this.attackPosture();
    this.cancelTargeting();
    this.attackRequested.emit({attacker, target: token, degats, posture});
  }

  protected openStatblock(token: PlayToken, event: Event): void {
    event.stopPropagation();
    this.statblockRequested.emit(token);
  }

  protected onActionRoll(token: PlayToken): void {
    this.actionRollRequested.emit(token);
  }

  /** Glisser-déposer d'un jeton sur la battlemap : recalcule sa position en % de la carte, remontée au parent pour persistance. */
  protected onTokenDragEnded(token: PlayToken, event: CdkDragEnd): void {
    const mapRect = this.mapEl()?.nativeElement.getBoundingClientRect();
    if (!mapRect) {
      return;
    }

    // `.cp-token-anchor` est positionné par `left`/`top`, et son enfant `.cp-token` se recentre
    // dessus via `transform: translate(-50%, -50%)` : le coin (left, top) de l'ancre EST donc déjà
    // le centre visuel du jeton — pas besoin (et surtout pas correct) d'y rajouter la demi-taille.
    const anchorRect = event.source.element.nativeElement.getBoundingClientRect();
    const x = clamp(((anchorRect.left - mapRect.left) / mapRect.width) * 100, 0, 100);
    const y = clamp(((anchorRect.top - mapRect.top) / mapRect.height) * 100, 0, 100);
    event.source.reset();

    this.positionChanged.emit({key: token.key, x, y});
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

  protected tokenClass(token: PlayToken): string {
    const active = token.key === this.activeKey() ? ' cp-token--active' : '';
    const sourceKey = this.attackSourceKey();
    const isSource = sourceKey && token.key === sourceKey ? ' cp-token--attack-source' : '';
    const isTargetable = canTarget(token, sourceKey) ? ' cp-token--attack-target' : '';
    // En mode ciblage, aucun jeton ne doit révéler son épée au survol : on clique la cible directement.
    const targeting = sourceKey ? ' cp-token--targeting' : '';
    return `cp-token cp-token--${token.kind}${active}${isSource}${isTargetable}${targeting}`;
  }

  /**
   * Position d'un jeton sur la battlemap : celle enregistrée après un glisser-déposer si elle
   * existe, sinon une position par défaut (héros à gauche, adversaires à droite).
   */
  protected tokenStyle(token: PlayToken, indexInCamp: number, camp: CombatCamp): Record<string, string> {
    const stored = this.tokenPositions()[token.key];
    if (stored) {
      return {left: `${stored.x}%`, top: `${stored.y}%`};
    }

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
