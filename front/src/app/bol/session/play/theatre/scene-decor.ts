import {ChangeDetectionStrategy, Component, computed, input, linkedSignal} from '@angular/core';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {sceneDecor} from './theatre.util';

/** Le fond du plateau : l'illustration de la scène, sinon l'image par défaut. Une illustration qui ne se charge pas
 * retombe sur l'image par défaut. Un voile sombre garde le texte lisible. Purement décoratif. */
@Component({
  selector: 'bol-scene-decor',
  template: `<img class="dcr-image" [src]="image()" alt="" (error)="imageFailed.set(true)" />`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: radial-gradient(50% 40% at 50% 55%, #4a3523, transparent 75%), linear-gradient(#241a12, #130d08);
    }

    // Le voile : le bas (la rampe), la gauche (le cartouche) et les bords plus sombres, le texte reste lisible sur n'importe quel décor.
    :host::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(10, 6, 4, 0.5), transparent 42%),
        linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent 30%, transparent 55%, rgba(0, 0, 0, 0.75)),
        radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0, 0, 0, 0.75));
    }

    .dcr-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 50% 35%;
      filter: saturate(1.12) contrast(1.05) brightness(0.72);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.dcr--defaut]': 'defaut()',
  },
})
export class SceneDecorComponent {
  readonly scene = input<BolSceneModel | null>(null);

  /** L'illustration a échoué au chargement ; remis à faux quand l'adresse change. */
  protected readonly imageFailed = linkedSignal(() => {
    this.scene()?.image;
    return false;
  });
  protected readonly image = computed(() => {
    const scene = this.scene();
    return sceneDecor(this.imageFailed() && scene ? {...scene, image: null} : scene);
  });
  /** Le décor est l'image par défaut (pas d'illustration, ou une illustration qui n'a pas pu se charger). */
  protected readonly defaut = computed(() => this.image() === sceneDecor(null));
}
