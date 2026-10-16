import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/** La carte de Lémurie, centrée sur un point (en % de la carte), en sépia flou : le décor d'une scène sans
 * illustration. La carte, trois fois plus large que son cadre, est posée au centre du cadre puis décalée de la
 * position du point : le point tombe toujours au milieu, quelle que soit la forme du cadre. Purement décoratif. */
@Component({
  selector: 'bol-carte-region',
  template: `<span class="crg-carte" [style.--crg-x]="x() + '%'" [style.--crg-y]="y() + '%'"></span>`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .crg-carte {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 300%;
      aspect-ratio: 1137 / 1491;
      background: url('/assets/bol/cartes/carte.jpg') 0 0 / 100% 100% no-repeat;
      filter: sepia(0.55) saturate(0.8) brightness(0.62) blur(1.5px);
      transform-origin: var(--crg-x) var(--crg-y);
      transform: translate(calc(-1 * var(--crg-x)), calc(-1 * var(--crg-y))) scale(1.04);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'aria-hidden': 'true'},
})
export class CarteRegionComponent {
  readonly x = input.required<number>();
  readonly y = input.required<number>();
}
