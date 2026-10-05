import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BolStatblockComponent, BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {ActionRollData, LastRoll} from '../../action-roll.util';
import {ActionRollPanelComponent} from '../action-roll-panel/action-roll-panel';
import {HeroResourcesComponent, HeroResourcesData} from '../hero-resources/hero-resources';
import {InstanceVitaliteComponent} from './instance-vitalite';
import {campActionLabel, removeActionLabel, TapisCard, TapisKind, vitaliteSteppers} from './tapis.util';

export interface ExpandedHeroData {
  readonly resources: HeroResourcesData;
  readonly actionRoll: ActionRollData;
}

const KIND_LABELS: Record<TapisKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

/** Carte du tapis dépliée sur place. Héros : ressources, jet d'action, accès à la fiche complète.
 * PNJ / créature / démon : vitalité (par exemplaire pour un lot), statbloc, changement de camp,
 * retrait. Ne recharge rien elle-même : toute modification remonte à la page par événement. */
@Component({
  selector: 'bol-expanded-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    BolStatblockComponent,
    ActionRollPanelComponent,
    HeroResourcesComponent,
    InstanceVitaliteComponent,
  ],
  templateUrl: './expanded-card.html',
  styleUrl: './expanded-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedCardComponent {
  readonly card = input.required<TapisCard>();
  readonly sessionId = input.required<string>();
  /** Données du héros, `null` tant qu'elles chargent. */
  readonly hero = input<ExpandedHeroData | null>(null);
  /** Statbloc d'un PNJ / créature / démon, `null` tant qu'il charge ou si la fiche a disparu. */
  readonly statblock = input<BolStatblockData | null>(null);
  readonly returnUrl = input<string | null>(null);
  /** En combat : pas de jet d'action ni de changement de camp. */
  readonly mode = input<'libre' | 'combat'>('libre');
  /** En combat, la carte active peut attaquer cette carte (qui n'est pas elle-même). */
  readonly canAttack = input(false);

  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly rolled = output<LastRoll>();
  readonly removeRequested = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  readonly fullSheetRequested = output<TapisCard>();
  /** « Attaquer cette carte » : le moyen de viser une carte de son propre camp. */
  readonly attackRequested = output<TapisCard>();

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  /** Héroïsme vivant du héros affiché, partagé entre les ressources et le jet d'action. */
  protected readonly heroisme = linkedSignal(() => this.hero()?.actionRoll.heroisme ?? 0);

  protected readonly subtitle = computed(() => {
    const card = this.card();
    const hero = this.hero();
    if (card.kind === 'hero') {
      const carrieres = hero?.actionRoll.carrieres.map((c) => `${c.label} ${c.value}`).join(' · ');
      return carrieres || KIND_LABELS.hero;
    }
    const lot = card.qty > 1 ? ` · lot de ${card.qty}` : '';
    return `${KIND_LABELS[card.kind]} · ${card.rang ?? ''}${lot}`;
  });

  protected readonly steppers = computed(() => vitaliteSteppers(this.card()));
  protected readonly campLabel = computed(() => campActionLabel(this.card()));
  protected readonly removeLabel = computed(() => removeActionLabel(this.card()));

  constructor() {
    // À l'ouverture, le focus entre dans la carte : le clavier et les lecteurs d'écran suivent.
    afterNextRender(() => this.root().nativeElement.focus());
  }
}
