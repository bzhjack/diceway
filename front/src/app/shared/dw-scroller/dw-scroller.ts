import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {scrollState, scrollTarget} from './dw-scroller.util';

/** Piste qui défile à l'horizontale, avec un chevron de chaque côté à la place de la barre de défilement.
 * Un clic avance d'une carte. Les chevrons n'apparaissent que si le contenu déborde, et se grisent à
 * l'extrémité atteinte. Le contenu projeté est un seul élément (la liste) dont les enfants sont les cartes ;
 * il doit être plus large que la piste pour déborder (`width: max-content`). */
@Component({
  selector: 'dw-scroller',
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      class="dws-chevron"
      [class.dws-chevron--hidden]="!overflow()"
      [disabled]="!canBack()"
      [attr.aria-label]="label() + ' : défiler vers la gauche'"
      [attr.tabindex]="overflow() ? null : -1"
      (click)="scrollBy(-1)"
    >
      <mat-icon>chevron_left</mat-icon>
    </button>
    <div #track class="dws-track" (scroll)="measure()">
      <ng-content />
    </div>
    <button
      type="button"
      class="dws-chevron"
      [class.dws-chevron--hidden]="!overflow()"
      [disabled]="!canForward()"
      [attr.aria-label]="label() + ' : défiler vers la droite'"
      [attr.tabindex]="overflow() ? null : -1"
      (click)="scrollBy(1)"
    >
      <mat-icon>chevron_right</mat-icon>
    </button>
  `,
  styleUrl: './dw-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwScrollerComponent {
  /** Ce que la piste contient, pour l'étiquette des chevrons (« Réserve », « Ordre de jeu »…). */
  readonly label = input('Liste');

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  protected readonly overflow = signal(false);
  protected readonly canBack = signal(false);
  protected readonly canForward = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.track().nativeElement;
      // Taille de la piste ET du contenu : l'ajout d'une carte fait déborder sans que la piste change.
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(el);
      const mutations = new MutationObserver(() => this.measure());
      mutations.observe(el, {childList: true, subtree: true});
      destroyRef.onDestroy(() => {
        observer.disconnect();
        mutations.disconnect();
      });
      this.measure();
    });
  }

  protected measure(): void {
    const el = this.track().nativeElement;
    const state = scrollState(el.scrollLeft, el.scrollWidth, el.clientWidth);
    this.overflow.set(state.overflow);
    this.canBack.set(state.canBack);
    this.canForward.set(state.canForward);
  }

  protected scrollBy(direction: -1 | 1): void {
    const el = this.track().nativeElement;
    // Les cartes : les enfants du contenu projeté (la liste), dans l'ordre.
    const origin = el.getBoundingClientRect().left - el.scrollLeft;
    const lefts = Array.from(el.firstElementChild?.children ?? []).map(
      (card) => card.getBoundingClientRect().left - origin,
    );
    const offsets = lefts.map((left) => left - lefts[0]);
    el.scrollTo({
      left: scrollTarget(el.scrollLeft, el.scrollWidth, el.clientWidth, direction, offsets),
      behavior: 'smooth',
    });
  }
}