import {ChangeDetectionStrategy, Component, computed, input, linkedSignal} from '@angular/core';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {REGION_MAP_COORDINATES} from '../../../shared/region/region-map-coordinates';
import {CarteRegionComponent} from './carte-region';
import {sceneDecor} from './theatre.util';

/** Le fond du plateau : l'illustration de la scène, sinon la carte de Lémurie centrée sur sa région, sinon l'image
 * par défaut. Une illustration qui ne se charge pas retombe sur la carte (ou l'image par défaut). Un voile sombre
 * garde le texte lisible. Purement décoratif. */
@Component({
  selector: 'bol-scene-decor',
  imports: [CarteRegionComponent],
  template: `
    @if (image(); as url) {
      <img class="dcr-image" [src]="url" alt="" (error)="imageFailed.set(true)" />
    } @else if (carte(); as point) {
      <bol-carte-region [x]="point.x" [y]="point.y" />
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: radial-gradient(50% 40% at 50% 55%, #4a3523, transparent 75%), linear-gradient(#241a12, #130d08);
    }

    // Le voile : le bas (la rampe) et les bords plus sombres, le texte reste lisible sur n'importe quel décor.
    :host::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent 30%, transparent 55%, rgba(0, 0, 0, 0.75)),
        radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0, 0, 0, 0.75));
    }

    .dcr-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 50% 35%;
      filter: saturate(0.9) brightness(0.72);
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.dcr--image]': "decor().kind === 'image'",
    '[class.dcr--carte]': "decor().kind === 'carte'",
  },
})
export class SceneDecorComponent {
  readonly scene = input<BolSceneModel | null>(null);

  /** L'illustration a échoué au chargement ; remis à faux quand l'adresse change. */
  protected readonly imageFailed = linkedSignal(() => {
    this.scene()?.image;
    return false;
  });
  protected readonly decor = computed(() => {
    const scene = this.scene();
    return sceneDecor(this.imageFailed() && scene ? {...scene, image: null} : scene, REGION_MAP_COORDINATES);
  });
  protected readonly image = computed(() => {
    const decor = this.decor();
    return decor.kind === 'image' ? decor.url : null;
  });
  /** Le point de la région sur la carte, quand le décor est la carte. */
  protected readonly carte = computed(() => {
    const decor = this.decor();
    return decor.kind === 'carte' ? {x: decor.x, y: decor.y} : null;
  });
}
