import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RideauEtat} from '../../models/theatre.model';

/** Le rideau du plateau : deux pans de velours qui se ferment pendant un changement de scène, le titre de la
 * scène qui arrive au centre. Purement décoratif (`aria-hidden`) : le cartouche annonce la nouvelle scène. */
@Component({
  selector: 'bol-rideau',
  template: `
    <span class="rdo-pan rdo-pan--gauche"></span>
    <span class="rdo-pan rdo-pan--droite"></span>
    @if (titre(); as titre) {
      <p class="rdo-titre">{{ titre }}</p>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      overflow: hidden;
      pointer-events: none;
    }

    :host(.rdo--ferme) {
      pointer-events: auto;
    }

    .rdo-pan {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 51%;
      background:
        linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent 18%, transparent 80%, rgba(0, 0, 0, 0.55)),
        repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.28) 0 6px, transparent 6px 22px, rgba(255, 255, 255, 0.05) 22px 26px, transparent 26px 44px),
        linear-gradient(90deg, #5a0f12, #2a0608);
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
      transition: transform 750ms cubic-bezier(0.7, 0, 0.3, 1);
    }

    .rdo-pan--gauche {
      left: 0;
      transform: translateX(-101%);
    }

    .rdo-pan--droite {
      right: 0;
      transform: translateX(101%);
    }

    :host(.rdo--ferme) .rdo-pan {
      transform: none;
    }

    .rdo-titre {
      position: relative;
      z-index: 1;
      margin: 0;
      padding: 0 1rem;
      text-align: center;
      opacity: 0;
      font-family: 'Muse Display Harmony', serif;
      font-size: clamp(2rem, 5vw, 3.8rem);
      color: var(--dw-color-text-bright);
      text-shadow: 0 4px 20px #000;
      transition: opacity 0.3s 0.4s;
    }

    :host(.rdo--ferme) .rdo-titre {
      opacity: 1;
    }

    // Moins d'animations : le rideau apparaît et disparaît d'un coup.
    @media (prefers-reduced-motion: reduce) {
      .rdo-pan,
      .rdo-titre {
        transition: none;
      }

      .rdo-pan--gauche,
      .rdo-pan--droite {
        transform: none;
        opacity: 0;
      }

      :host(.rdo--ferme) .rdo-pan {
        opacity: 1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.rdo--ferme]': "etat() === 'ferme'",
  },
})
export class RideauComponent {
  readonly etat = input.required<RideauEtat>();
  readonly titre = input<string | null>(null);
}
