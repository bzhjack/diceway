import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import {OrdreFriseStep} from '../models/ordre-frise.model';

/** La frise de l'ordre d'action, commune au jet de réaction et à la table en combat : son titre et le round, ce que la page y projette
 * (une pastille, un message quand la frise est vide), puis un médaillon par combattant, dans l'ordre où ils jouent, un trait court dans un même groupe et un trait long entre deux groupes. L'anneau dit le résultat d'un héros, ou le camp des
 * autres ; un héros est un carré arrondi. Elle tient sur une ligne : les médaillons rétrécissent quand la place manque, et en dernier
 * recours la ligne défile. */
@Component({
  selector: 'bol-ordre-frise',
  imports: [MatTooltipModule, NgTemplateOutlet],
  templateUrl: './ordre-frise.html',
  styleUrl: './ordre-frise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ofr-n]': 'steps().length',
    '[style.--ofr-longs]': 'longs()',
  },
})
export class OrdreFriseComponent {
  readonly steps = input.required<readonly OrdreFriseStep[]>();
  readonly round = input.required<number>();
  readonly stepClicked = output<OrdreFriseStep>();

  /** Combien de traits longs : avec le nombre de médaillons, il règle leur taille pour que la frise tienne sur une ligne. */
  protected readonly longs = computed(() => this.steps().filter((step) => step.link === 'long').length);

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
