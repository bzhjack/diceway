import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, linkedSignal, signal, viewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {TapisCard} from '../../models/tapis.model';
import {ATTITUDES} from '../theatre/theatre.util';
import {isLowVitalite, vitalitePercent} from './tapis.util';

/** La carte de la cible choisie, dans l'assistant de tour : à gauche son portrait, carré sur toute la hauteur, qui se fond vers la droite ;
 * à côté son rang et son attitude (et en haut à droite les boutons projetés avec `ccActions`), son nom, ses chances et sa barre de vie
 * (avec ce que le coup va lui retirer), puis ce que l'assistant y projette (chiffres, vie réglable, effets). Le liseré dit son camp. */
@Component({
  selector: 'bol-cible-carte',
  imports: [MatIconModule],
  template: `
    <div class="cc-art" aria-hidden="true">
      @if (hasAvatar()) {
        <img [src]="card().avatar" alt="" (error)="avatarFailed.set(true)" />
      } @else if (kindIconIsSvg()) {
        <mat-icon [svgIcon]="kindIcon()" />
      } @else {
        <mat-icon>{{ kindIcon() }}</mat-icon>
      }
    </div>
    <div #body class="cc-body">
      <header class="cc-head">
        <div class="cc-top">
          <span class="cc-tags">
            @if (card().rang; as rang) {
              <span class="cc-rang">{{ rang }}</span>
            }
            @if (attitude(); as a) {
              <span [class]="'cc-attitude cc-attitude--' + a.value">{{ a.label }}</span>
            }
          </span>
          <!-- Les boutons de la page (ouvrir la fiche, changer de cible), en haut à droite -->
          <ng-content select="[ccActions]" />
        </div>
        <p class="cc-titre">
          <b class="cc-nom">{{ card().nom }}</b>
          @if (chance(); as c) {
            <em class="cc-chance">{{ c }}</em>
          }
        </p>
        <span class="cc-vie" [class.cc-vie--bas]="low()" aria-hidden="true"><i [style.width.%]="rest()"></i><u [style.left.%]="rest()" [style.width.%]="loss()"></u></span>
      </header>
      <ng-content />
    </div>
  `,
  styleUrl: './cible-carte.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.cc--allie]': "card().camp === 'heros'",
    '[class.cc--tombe]': 'tombe()',
    '[style.--cc-art.px]': 'artSize()',
  },
})
export class CibleCarteComponent {
  readonly card = input.required<TapisCard>();
  /** Ses chances d'être touchée (« 8+ · 42 % ») ; `null` sans. */
  readonly chance = input<string | null>(null);
  /** Les points de vie que le coup en cours va lui retirer, montrés sur sa barre. */
  readonly perte = input(0);

  /** Le côté du portrait carré, en px : la hauteur du texte, entre 8 et 13rem ; `null` avant la première mesure (la valeur du style). */
  protected readonly artSize = signal<number | null>(null);
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const observer = new ResizeObserver(([entry]) => {
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height;
        this.artSize.set(Math.round(Math.min(13 * rem, Math.max(8 * rem, height))));
      });
      observer.observe(this.body().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Le portrait n'a pas pu se charger : repli sur l'icône du type (à nouveau tenté pour une autre carte). */
  protected readonly avatarFailed = linkedSignal({source: () => this.card().key, computation: () => false});
  protected readonly hasAvatar = computed(() => !!this.card().avatar && this.card().avatar !== EMPTY_AVATAR && !this.avatarFailed());
  protected readonly kindIcon = computed(() => combatantKindIcon(this.card().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.card().kind));
  /** Son attitude envers les héros, pour un personnage du camp d'en face. */
  protected readonly attitude = computed(() => {
    const card = this.card();
    return card.camp === 'adversaires' ? (ATTITUDES.find((a) => a.value === card.attitude) ?? null) : null;
  });
  private readonly percent = computed(() => vitalitePercent(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly loss = computed(() => {
    const max = this.card().vitaliteMax ?? 0;
    return max > 0 ? Math.min(this.percent(), (this.perte() / max) * 100) : 0;
  });
  protected readonly rest = computed(() => this.percent() - this.loss());
  protected readonly low = computed(() => isLowVitalite(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly tombe = computed(() => {
    const vitalite = this.card().vitaliteCourante;
    return vitalite !== null && this.card().vitaliteMax !== null && vitalite <= 0;
  });
}
