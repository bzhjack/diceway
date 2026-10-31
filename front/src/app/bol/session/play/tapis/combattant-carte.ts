import {ChangeDetectionStrategy, Component, computed, input, linkedSignal} from '@angular/core';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {TapisCard} from '../../models/tapis.model';
import {ATTITUDES} from '../theatre/theatre.util';
import {isLowVitalite, vitalitePercent} from './tapis.util';

/** La carte d'un combattant dans l'assistant de tour, la même pour celui qui joue et pour sa cible : à gauche son portrait, carré sur toute la hauteur, qui se fond vers la droite ;
 * à côté son rang et son attitude (et en haut à droite les boutons projetés avec `ccActions`), son nom, ses chances et sa barre de vie
 * (avec ce que le coup va lui retirer), puis ce que l'assistant y projette (chiffres, vie réglable, effets). Le liseré dit son camp. */
@Component({
  selector: 'bol-combattant-carte',
  template: `
    <div class="cc-art" aria-hidden="true">
      @if (hasAvatar()) {
        <img [src]="card().avatar" alt="" (error)="avatarFailed.set(true)" />
      } @else {
        <span class="cc-initiale">{{ initiale() }}</span>
      }
    </div>
    <div class="cc-body">
      <header class="cc-head">
        <div class="cc-top">
          <span class="cc-tags">
            @if (etiquette(); as e) {
              <span class="cc-rang">{{ e }}</span>
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
  styleUrl: './combattant-carte.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.cc--ligne]': 'ligne()',
    '[class.cc--allie]': "card().camp === 'heros'",
    '[class.cc--tombe]': 'tombe()',
  },
})
export class CombattantCarteComponent {
  readonly card = input.required<TapisCard>();
  /** Pour une cible, ses chances d'être touchée (« 8+ · 42 % ») ; `null` sans. */
  readonly chance = input<string | null>(null);
  /** Pour une cible, les points de vie que le coup en cours va lui retirer, montrés sur sa barre. */
  readonly perte = input(0);
  /** Celui qui joue : tout sur une ligne, en plaque de fer ; ce que la page y projette se range par zones (`combattant-carte.scss`). */
  readonly ligne = input(false);

  /** Le portrait n'a pas pu se charger : repli sur l'initiale (à nouveau tenté pour une autre carte). */
  protected readonly avatarFailed = linkedSignal({source: () => this.card().key, computation: () => false});
  protected readonly hasAvatar = computed(() => !!this.card().avatar && this.card().avatar !== EMPTY_AVATAR && !this.avatarFailed());
  /** Sans portrait, son initiale. */
  protected readonly initiale = computed(() => this.card().nom.trim().charAt(0).toUpperCase());
  /** L'étiquette du coin : son rang, ou « Héros » pour un héros. */
  protected readonly etiquette = computed(() => this.card().rang ?? (this.card().kind === 'hero' ? 'Héros' : null));
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
