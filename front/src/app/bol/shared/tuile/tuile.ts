import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, linkedSignal, output} from '@angular/core';

/**
 * Une tuile de personnage, celle de la table et des bibliothèques : le portrait couvre la tuile, un voile sombre vers le bas porte le nom
 * et la ligne du dessous ; la vitalité dans un cœur en bas à droite, dans le pied pour un héros (avec son écusson d'héroïsme). Toute la
 * tuile est le bouton du portrait (`ouvrir`) ; les emplacements projetés passent au-dessus de sa zone de clic :
 * - `[bolTuileCoin]` en haut à gauche (« Mes fiches », `×n`), `[bolTuileMenu]` en haut à droite (le menu `⋯`) ;
 * - `[bolTuileTete]` après le nom (le point d'attitude), `[bolTuileSous]` la ligne sous le nom (rang, sorte, joueur) ;
 * - `[bolTuileVie]` à la place du cœur (celui d'un groupe, quand `vitalite` est null), `[bolTuilePied]` au début du pied d'un héros (son dé).
 * Ses styles sont globaux (`styles/_tuile.scss`, classes `dw-tuile*`), pour que le contenu projeté les partage ; la page pose sur la tuile
 * les variantes `dw-tuile--sombre` (liseré sans couleur), `--allie` (en pointillés, le texte en bas), `--paquet` (plusieurs exemplaires),
 * `--choisie` (sélectionnée), `--tombee` (à terre).
 */
@Component({
  selector: 'bol-tuile',
  host: {
    class: 'dw-tuile',
    '[class.dw-tuile--heros]': 'heroisme() !== null',
  },
  template: `
    <button type="button" class="dw-tuile__portrait" [attr.aria-label]="label()" [attr.aria-pressed]="pressed()" (click)="ouvrir.emit($event)">
      @if (portrait(); as src) {
        <img [src]="src" alt="" draggable="false" (error)="casse.set(true)" />
      } @else {
        <span class="dw-tuile__initiale" aria-hidden="true">{{ initiale() }}</span>
      }
    </button>
    <div class="dw-tuile__coin"><ng-content select="[bolTuileCoin]" /></div>
    <div class="dw-tuile__menu"><ng-content select="[bolTuileMenu]" /></div>

    <div class="dw-tuile__texte">
      <div class="dw-tuile__tete">
        <p class="dw-tuile__nom">{{ nom() }}</p>
        <ng-content select="[bolTuileTete]" />
      </div>
      <div class="dw-tuile__sous"><ng-content select="[bolTuileSous]" /></div>
    </div>

    @if (heroisme() !== null) {
      <div class="dw-tuile__pied">
        <ng-content select="[bolTuilePied]" />
        <span class="dw-tuile__ecusson" role="img" [attr.aria-label]="'Héroïsme de ' + nom() + ' : ' + heroisme()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5.25 3.4 10.15 8 11.35 4.6-1.2 8-6.1 8-11.35V5l-8-3z" /></svg>
          <b aria-hidden="true">{{ heroisme() }}</b>
        </span>
        <ng-container [ngTemplateOutlet]="coeur" />
      </div>
    } @else {
      <div class="dw-tuile__vies">
        <ng-content select="[bolTuileVie]" />
        <ng-container [ngTemplateOutlet]="coeur" />
      </div>
    }

    <ng-template #coeur>
      @if (vitalite() !== null) {
        <span
          class="dw-tuile__coeur"
          [class.dw-tuile__coeur--bas]="etatVie() === 'basse'"
          [class.dw-tuile__coeur--tombe]="etatVie() === 'tombe'"
          role="img"
          [attr.aria-label]="'Vitalité de ' + nom() + ' : ' + vitalite() + (vitaliteMax() !== null ? '/' + vitaliteMax() : '')"
        >
          <b aria-hidden="true">{{ vitalite() }}</b>
        </span>
      }
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TuileComponent {
  readonly nom = input.required<string>();
  /** Le portrait ; sans lui (ou introuvable), l'initiale du nom sur un fond de bronze. */
  readonly image = input<string | null>(null);
  /** Le nom accessible du portrait, le bouton de la tuile (« Loup géant, voir son statbloc »). */
  readonly label = input.required<string>();
  /** La vitalité dans le cœur ; null : pas de cœur (celui d'un groupe vient par `[bolTuileVie]`). */
  readonly vitalite = input<number | null>(null);
  /** Le maximum de vitalité, dit avec elle au lecteur d'écran (« 8/8 ») ; null : la vitalité seule. */
  readonly vitaliteMax = input<number | null>(null);
  /** Un héros : son héroïsme dans l'écusson du pied, où passe aussi son cœur. */
  readonly heroisme = input<number | null>(null);
  /** Le cœur plus sombre quand la vitalité est basse, gris à terre. */
  readonly etatVie = input<'basse' | 'tombe' | null>(null);
  /** L'`aria-pressed` du portrait (la tuile sélectionnée à la table) ; null : pas d'état. */
  readonly pressed = input<boolean | null>(null);

  readonly ouvrir = output<MouseEvent>();

  /** Le portrait est introuvable : l'initiale prend sa place, jusqu'à ce qu'un autre portrait arrive. */
  protected readonly casse = linkedSignal({source: this.image, computation: () => false});
  protected readonly portrait = computed(() => (this.casse() ? null : this.image()));
  protected readonly initiale = computed(() => this.nom().charAt(0).toUpperCase());
}
