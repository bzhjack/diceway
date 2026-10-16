import {ChangeDetectionStrategy, Component, computed, input, linkedSignal} from '@angular/core';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {REGION_MAP_COORDINATES} from '../../../shared/region/region-map-coordinates';
import {sceneDecor} from './theatre.util';

/** Le fond du plateau : l'illustration de la scène, sinon la carte de Lémurie centrée sur sa région, sinon l'image
 * par défaut. Une illustration qui ne se charge pas retombe sur la carte (ou l'image par défaut). Un voile sombre
 * garde le texte lisible. Purement décoratif. */
@Component({
  selector: 'bol-scene-decor',
  template: `
    @if (image(); as url) {
      <img class="dcr-image" [src]="url" alt="" (error)="imageFailed.set(true)" />
    } @else if (carte(); as position) {
      <span class="dcr-carte" [style.background-position]="position"></span>
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

    .dcr-carte {
      position: absolute;
      inset: 0;
      background-image: url('/assets/bol/cartes/carte.jpg');
      background-size: 300% auto;
      filter: sepia(0.55) saturate(0.8) brightness(0.62) blur(1.5px);
      transform: scale(1.04);
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
  /** Position de la carte en `background-position` (« 26.4% 59% »). */
  protected readonly carte = computed(() => {
    const decor = this.decor();
    return decor.kind === 'carte' ? `${decor.x}% ${decor.y}%` : null;
  });
}
