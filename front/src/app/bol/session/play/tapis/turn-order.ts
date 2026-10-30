import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, input, output, signal, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TurnStatus} from '../../models/combat-turn.model';
import {TurnOrderEntry, TurnOrderInterrupter} from '../../models/turn-order.model';
import {groupByTier} from './combat-turn.util';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';

/** Part d'un médaillon qui reste visible quand les médaillons se chevauchent : au-delà, la ligne défile. */
const VISIBLE_SLICE = 0.3;

const STATUS_LABELS: Record<TurnStatus, string> = {
  active: 'joue maintenant',
  played: 'a joué',
  skipped: 'ne joue pas ce round',
  upcoming: 'à venir',
};

/** Frise d'initiative : le round, puis les combattants rangés par rang de réaction BoL (héros qui ont réussi,
 * rivaux, coriaces, héros en échec, piétaille, échec critique). Chaque combattant est un médaillon : le
 * combattant actif est surélevé, ceux qui ont joué sont grisés. Un clic sur un médaillon « a joué » lui rend la main. */
@Component({
  selector: 'bol-turn-order',
  imports: [AvatarFallbackDirective, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './turn-order.html',
  styleUrl: './turn-order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnOrderComponent {
  readonly entries = input.required<readonly TurnOrderEntry[]>();
  readonly round = input.required<number>();
  /** Un héros a obtenu un succès légendaire : au round 1, la pastille du blocage le nomme à la place du succès héroïque. */
  readonly legendaryActive = input(false);
  /** Texte annoncé aux lecteurs d'écran à chaque changement de tour ou de round. */
  readonly announcement = input('');
  /** Titre de la rencontre, affiché en surtitre de la barre. */
  /** Clé du combattant visé par le tour en cours : son médaillon est cerclé de rouge. */
  readonly targetKey = input<string | null>(null);

  /** Les héros qui ont retardé leur action ce round : chacun peut l'interrompre pour agir tout de suite. */
  readonly interrupters = input<readonly TurnOrderInterrupter[]>([]);

  readonly gaveBack = output<string>();
  readonly interruptRequested = output<string>();
  readonly addRequested = output<void>();
  readonly rerollRequested = output<void>();

  /** Seuls les blocs qui ont au moins un combattant sont affichés. */
  protected readonly groups = computed(() => groupByTier(this.entries()).filter((group) => group.entries.length > 0));
  /** Nombre de combattants dans la frise : avec le nombre de blocs, il règle la taille des médaillons pour que tout tienne sur une ligne. */
  protected readonly total = computed(() => this.entries().length);
  /** Au round 1, un succès héroïque bloque coriaces et piétaille : la frise le dit. */
  protected readonly roundOneLock = computed(() => this.round() === 1 && this.entries().some((entry) => entry.locked));
  /** De combien chaque médaillon couvre le précédent, en px : 0 quand toute la frise tient sur sa ligne (cf. `fitStrip`). */
  protected readonly overlap = signal(0);

  private readonly strip = viewChild.required<ElementRef<HTMLElement>>('strip');

  constructor() {
    const injector = inject(Injector);
    const destroyRef = inject(DestroyRef);
    // La frise se remesure quand la barre change de largeur, et quand des combattants arrivent, partent ou changent de bloc.
    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.fitStrip());
      observer.observe(this.strip().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    effect(() => {
      this.groups();
      afterNextRender(() => this.fitStrip(), {injector});
    });
  }

  /** Fait tenir la frise sur sa ligne : la largeur qu'elle prendrait sans chevauchement, comparée à sa place, dit de combien chaque
   * médaillon doit couvrir le précédent. Il en reste toujours une tranche visible ; au-delà, la ligne défile. */
  private fitStrip(): void {
    const strip = this.strip().nativeElement;
    const blocks = strip.querySelectorAll<HTMLElement>('.tor-group');
    const steps = this.total() - blocks.length;
    const last = blocks.item(blocks.length - 1);
    const medal = strip.querySelector<HTMLElement>('.tor-med');
    const chips = strip.querySelector<HTMLElement>('.tor-chips');
    if (!last || !medal || !chips || steps <= 0) {
      this.overlap.set(0);
      return;
    }
    const content = last.getBoundingClientRect().right - strip.getBoundingClientRect().left + strip.scrollLeft;
    const natural = content + this.overlap() * steps;
    const gap = parseFloat(getComputedStyle(chips).columnGap) || 0;
    const max = gap + medal.offsetWidth * (1 - VISIBLE_SLICE);
    this.overlap.set(Math.min(max, Math.max(0, Math.ceil((natural - strip.clientWidth) / steps))));
  }

  protected statusLabel(status: TurnStatus): string {
    return STATUS_LABELS[status];
  }

  protected initial(entry: TurnOrderEntry): string {
    return entry.nom.trim().charAt(0).toUpperCase();
  }

  protected label(entry: TurnOrderEntry): string {
    return `${entry.nom}${entry.ally ? ' (allié)' : ''}, ${this.statusLabel(entry.status)}${entry.locked ? ', bloqué ce round' : ''}`;
  }
}
