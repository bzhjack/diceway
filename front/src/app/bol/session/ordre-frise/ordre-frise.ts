import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {OrdreFriseStep} from '../models/ordre-frise.model';

/** Les traits longs à prévoir quand les places sont réservées : les groupes ne sont pas tous là au début des jets. */
const LONGS_PREVUS = 4;

/** La frise de l'ordre d'action, commune au jet de réaction et à la table en combat : son titre et le round, ce que la page y projette
 * (une pastille, un message quand la frise est vide), puis un médaillon par combattant, dans l'ordre où ils jouent, un trait court dans un même groupe et un trait long entre deux groupes. L'anneau dit le résultat d'un héros, ou le camp des
 * autres ; un héros est un carré arrondi. Elle tient sur une ligne : les médaillons rétrécissent quand la place manque, et en dernier
 * recours la ligne défile. */
@Component({
  selector: 'bol-ordre-frise',
  imports: [MatIconModule, MatTooltipModule, NgTemplateOutlet],
  templateUrl: './ordre-frise.html',
  styleUrl: './ordre-frise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ofr--legende]': 'legende()',
    '[style.--ofr-n]': 'taille()',
    '[style.--ofr-longs]': 'longs()',
  },
})
export class OrdreFriseComponent {
  readonly steps = input.required<readonly OrdreFriseStep[]>();
  readonly round = input.required<number>();
  /** Le titre en légende d'une ligne, au-dessus de la frise, au lieu d'être à sa gauche sur deux lignes. */
  readonly legende = input(false);
  /** Combien de médaillons prévoir : avec tous les combattants à venir, leur taille ne bouge pas quand la frise se remplit. */
  readonly places = input<number | null>(null);
  /** Un dernier médaillon « + » au bout de la frise, là où le nouveau combattant arrivera ; `null` sans lui. */
  readonly addLabel = input<string | null>(null);
  /** Ce « + » est ce qu'il faut faire maintenant : il passe en or. */
  readonly addUrgent = input(false);
  readonly stepClicked = output<OrdreFriseStep>();
  readonly addClicked = output<void>();

  /** Combien de médaillons et de traits longs : ils règlent la taille des médaillons pour que la frise tienne sur une ligne. */
  protected readonly taille = computed(() => this.places() ?? this.steps().length + (this.addLabel() ? 1 : 0));
  protected readonly longs = computed(() => (this.places() === null ? this.steps().filter((step) => step.link === 'long').length : LONGS_PREVUS));

  /** Portraits qui n'ont pas pu se charger : repli sur l'initiale. */
  private readonly broken = signal<ReadonlySet<string>>(new Set());

  protected avatar(step: OrdreFriseStep): string | null {
    return step.avatar && !this.broken().has(step.avatar) ? step.avatar : null;
  }

  protected onAvatarError(avatar: string): void {
    this.broken.update((set) => new Set(set).add(avatar));
  }

  protected initial(step: OrdreFriseStep): string {
    return step.nom.trim().charAt(0).toUpperCase();
  }

  protected medClass(step: OrdreFriseStep): string {
    const flags: readonly [boolean, string][] = [
      [step.hero, 'hero'],
      [step.blocked, 'blocked'],
      [step.target, 'target'],
      [step.down, 'down'],
      [step.excluded, 'out'],
      [step.status === 'active', 'active'],
      [step.status === 'played', 'played'],
      // Bloqué au round 1, il ne joue pas : ses hachures le disent déjà, sans l'estomper en plus.
      [step.status === 'skipped' && !step.blocked, 'skipped'],
    ];
    return ['ofr-c', `ofr-c--${step.tone}`, ...flags.filter(([on]) => on).map(([, name]) => `ofr-c--${name}`)].join(' ');
  }
}
