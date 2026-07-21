import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {take} from 'rxjs';
import {BolFightSessionModel, CombatCamp} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {combatantKindIcon, combatantKindIconIsSvg} from '../select/combat-statblock.util';
import {buildPlayBoard, PlayToken} from '../combat-play.util';

/** Nombre de colonnes de la grille tactique ; les héros occupent les 3 premières, les adversaires les 3 dernières. */
const GRID_COLS = 9;
const HERO_COLS = [1, 2, 3];
const ADVERSAIRE_COLS = [GRID_COLS - 2, GRID_COLS - 1, GRID_COLS];

/**
 * Écran plein page affiché après « Lancer le combat » : ruban d'initiative en haut, plateau
 * tactique en grille (les jetons occupent des cases, pas des positions libres). Lecture seule
 * pour l'instant (pas de PV modifiables ni d'ajout de combattant en cours de combat — ces actions
 * nécessitent de nouvelles routes backend, hors périmètre ici).
 */
@Component({
  selector: 'bol-combat-play-page',
  imports: [MatIconModule, NgTemplateOutlet, RouterLink],
  templateUrl: './combat-play-page.html',
  styleUrl: './combat-play-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatPlayPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fightSessionService = inject(BolFightSessionService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly session = signal<BolFightSessionModel | null>(null);

  protected readonly board = computed(() => {
    const session = this.session();
    return session ? buildPlayBoard(session) : null;
  });

  protected readonly heroTokens = computed(() => this.board()?.tokens.filter((t) => t.camp === 'heros') ?? []);
  protected readonly adversaireTokens = computed(
    () => this.board()?.tokens.filter((t) => t.camp === 'adversaires') ?? [],
  );

  /** Premier de l'ordre d'initiative = combattant dont c'est le tour. */
  protected readonly activeKey = computed(() => this.board()?.tokens[0]?.key ?? null);

  protected readonly kindIcon = combatantKindIcon;
  protected readonly kindIconIsSvg = combatantKindIconIsSvg;

  protected readonly gridCols = GRID_COLS;

  protected readonly gridRows = computed(() => {
    const heroRows = Math.ceil(this.heroTokens().length / HERO_COLS.length);
    const adversaireRows = Math.ceil(this.adversaireTokens().length / ADVERSAIRE_COLS.length);
    return Math.max(heroRows, adversaireRows, 4);
  });

  protected readonly gridCells = computed(() => Array.from({length: this.gridCols * this.gridRows()}, (_, i) => i));

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Combat introuvable.');
      this.loading.set(false);
      return;
    }

    this.fightSessionService
      .fightSession(id)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.session.set(session);
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
    return `cp-token cp-token--${token.kind}${active}`;
  }

  /** Place un jeton dans la grille : les héros occupent les colonnes de gauche, les adversaires celles de droite. */
  protected tokenGridStyle(indexInCamp: number, camp: CombatCamp): Record<string, string> {
    const cols = camp === 'heros' ? HERO_COLS : ADVERSAIRE_COLS;
    const col = cols[indexInCamp % cols.length];
    const row = Math.floor(indexInCamp / cols.length) + 1;
    return {'--r': String(row), '--c': String(col)};
  }

  protected cellClass(index: number): string {
    const col = (index % this.gridCols) + 1;
    if (col <= HERO_COLS.length) {
      return 'cp-cell cp-cell--hero';
    }
    if (col > this.gridCols - ADVERSAIRE_COLS.length) {
      return 'cp-cell cp-cell--adversaire';
    }
    return 'cp-cell';
  }
}
