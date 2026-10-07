import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';
import {BolStatblockData} from '../../../shared/models/bol-statblock.model';
import {BolStatblockComponent} from '../../../shared/statblock/bol-statblock.component';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {ActionRollPanelComponent} from '../action-roll-panel/action-roll-panel';
import {HeroResourcesComponent} from '../hero-resources/hero-resources';
import {CardVitaliteComponent} from './card-vitalite';
import {heroIdentityLine, REMOVE_ACTION_LABEL} from './tapis.util';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {HeroDetailsComponent} from './hero-details';
import {ExpandedHeroData} from '../../models/expanded-card.model';

const KIND_LABELS: Record<TapisKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

/** Carte du tapis dépliée sur place. Un bandeau commun (portrait carré, nom, vitalité) ouvre toutes les
 * cartes. Héros : héroïsme, jet d'action sur trois colonnes, détails (carrières, traits, armes, armures) en popovers, lien vers sa fiche d'édition. PNJ / créature /
 * démon : vitalité, statbloc, changement de camp. Corbeille (retrait) à côté du bouton de fermeture, pour tous les types. Affichée dans un dialogue (`bol-expanded-card-dialog`). Ne recharge rien elle-même : toute modification remonte à la page par événement. */
@Component({
  selector: 'bol-expanded-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    HeroDetailsComponent,
    ActionRollPanelComponent,
    HeroResourcesComponent,
    CardVitaliteComponent,
    BolStatblockComponent,
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
  readonly removeRequested = output<TapisCard>();
  /** Un clic sur une armure du popover : l'id de l'armure à équiper ou déséquiper. */
  readonly armureToggled = output<number>();
  /** Un clic sur une arme du popover : l'id de l'arme à équiper ou déséquiper. */
  readonly armeToggled = output<number>();
  /** « Attaquer cette carte » : le moyen de viser une carte de son propre camp. */
  readonly attackRequested = output<TapisCard>();

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  /** Héroïsme vivant du héros affiché, partagé entre les ressources et le jet d'action. */
  protected readonly heroisme = linkedSignal(() => this.hero()?.actionRoll.heroisme ?? 0);

  protected readonly subtitle = computed(() => {
    const card = this.card();
    const hero = this.hero();
    if (card.kind === 'hero') {
      return hero ? heroIdentityLine(hero.details.infos) : '';
    }
    return `${KIND_LABELS[card.kind]} · ${card.rang ?? ''}`;
  });

  /** État de navigation vers l'édition : au retour, la table se rouvre. */
  protected navigationState(): Record<string, string> | undefined {
    const returnUrl = this.returnUrl();
    return returnUrl ? {returnUrl} : undefined;
  }

  /** Portrait carré du bandeau : l'avatar de la carte, ou l'icône du type s'il manque ou ne charge pas. */
  private readonly avatarFailed = signal(false);
  protected readonly hasAvatar = computed(() => this.card().avatar !== EMPTY_AVATAR && !this.avatarFailed());
  protected readonly kindIcon = computed(() => combatantKindIcon(this.card().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.card().kind));

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  /** Hauteur fixe pour un héros en mode libre : son jet d'action change d'état (faveur divine, échec critique) et
   * la zone des dés garde une taille confortable. Les autres personnages, et un héros en combat réduit au
   * bandeau, ont la hauteur de leur contenu. */
  protected readonly fixedHeight = computed(() => this.card().kind === 'hero' && this.mode() === 'libre' && this.hero() !== null);


  protected readonly removeLabel = REMOVE_ACTION_LABEL;

  constructor() {
    // À l'ouverture, le focus entre dans la carte : le clavier et les lecteurs d'écran suivent.
    // `preventScroll` : le tapis ramène lui-même la carte dans la zone visible (cf. `TapisComponent`) ; le
    // focus, lui, ferait défiler tous les parents, y compris la page dont le débordement est masqué.
    afterNextRender(() => this.root().nativeElement.focus({preventScroll: true}));
  }
}
