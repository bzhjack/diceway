import {ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked} from '@angular/core';
import {RideauEtat, SceneCarton} from '../../models/theatre.model';
import {CARTON_RYTHME, cartonDelai} from './theatre.util';

/** Le rideau du plateau, en carton de chroniqueur : pendant un changement de scène, un fondu au noir, puis une phrase
 * d'ambiance qui s'écrit lettre à lettre (« Au crépuscule, sous la pluie… »), le lieu et enfin le titre de la scène qui
 * arrive. Le store garde le rideau fermé jusqu'à la fin du carton (`cartonTenue`). Purement décoratif (`aria-hidden`) :
 * le cartouche annonce la nouvelle scène. */
@Component({
  selector: 'bol-rideau',
  template: `
    <span class="rdo-noir"></span>
    @if (carton(); as carton) {
      <div class="rdo-carton">
        @if (carton.narration) {
          <p class="rdo-narration" [class.rdo-narration--ecrit]="ecrite()">{{ phrase() }}</p>
        }
        @if (carton.lieu) {
          <p class="rdo-lieu" [class.rdo--visible]="ecrite()">{{ carton.lieu }}</p>
        }
        <p class="rdo-titre" [class.rdo--visible]="titreVisible()">{{ carton.titre }}</p>
      </div>
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

    // Le noir : il descend lentement (fondu), et se lève un peu plus lentement encore sur la nouvelle scène.
    .rdo-noir {
      position: absolute;
      inset: 0;
      background: radial-gradient(70% 60% at 50% 50%, #140c07, #030201);
      opacity: 0;
      transition: opacity 1.1s ease-out;
    }

    :host(.rdo--ferme) .rdo-noir {
      opacity: 1;
      transition: opacity 0.9s ease-in;
    }

    .rdo-carton {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 0.9rem;
      max-width: 52rem;
      padding: 0 2rem;
      text-align: center;
      transition: opacity 0.35s;
    }

    :host(:not(.rdo--ferme)) .rdo-carton {
      opacity: 0;
    }

    .rdo-narration {
      margin: 0;
      max-width: 34ch;
      color: #d8c7a2;
      font: italic 500 clamp(1.25rem, 2.6vw, 1.9rem) / 1.4 'Cormorant Garamond', Georgia, serif;

      // Le curseur de la plume, tant que la phrase s'écrit.
      &::after {
        content: '';
        display: inline-block;
        width: 0.07em;
        height: 1em;
        margin-left: 0.08em;
        vertical-align: -0.12em;
        background: currentColor;
        animation: rdo-curseur 0.9s steps(1) infinite;
      }
    }

    .rdo-narration--ecrit::after {
      content: none;
    }

    @keyframes rdo-curseur {
      50% {
        opacity: 0;
      }
    }

    .rdo-lieu {
      margin: 0;
      color: #9c8763;
      font-size: clamp(0.72rem, 1.3vw, 0.85rem);
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0;
      transition: opacity 0.8s ease;
    }

    // Le titre se resserre en apparaissant.
    .rdo-titre {
      margin: 0;
      color: var(--dw-color-legendary);
      font-family: 'Muse Display Harmony', serif;
      font-size: clamp(2rem, 5vw, 3.8rem);
      line-height: 1.05;
      letter-spacing: 0.4em;
      text-wrap: balance;
      text-shadow: 0 4px 20px #000;
      opacity: 0;
      transition:
        opacity 1.1s ease,
        letter-spacing 1.4s cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    .rdo--visible {
      opacity: 1;
    }

    .rdo-titre.rdo--visible {
      letter-spacing: 0.02em;
    }

    // Moins d'animations : le noir tombe et se lève d'un coup, le carton s'affiche en entier.
    @media (prefers-reduced-motion: reduce) {
      .rdo-noir,
      :host(.rdo--ferme) .rdo-noir,
      .rdo-carton,
      .rdo-lieu,
      .rdo-titre {
        transition: none;
      }

      .rdo-narration::after {
        content: none;
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
  readonly carton = input<SceneCarton | null>(null);

  /** Nombre de lettres de la phrase déjà écrites. */
  private readonly lettres = signal(0);
  protected readonly titreVisible = signal(false);

  protected readonly phrase = computed(() => (this.carton()?.narration ?? '').slice(0, this.lettres()));
  protected readonly ecrite = computed(() => this.lettres() >= (this.carton()?.narration ?? '').length);

  constructor() {
    // À chaque fermeture, le carton repart de zéro : la phrase s'écrit une fois le noir tombé, puis le titre paraît.
    // À la réouverture, il reste tel quel le temps de s'effacer.
    effect((onCleanup) => {
      if (this.etat() !== 'ferme') {
        return;
      }
      const phrase = this.carton()?.narration ?? '';
      const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      untracked(() => {
        this.lettres.set(reduit ? phrase.length : 0);
        this.titreVisible.set(reduit);
      });
      if (reduit) {
        return;
      }
      let minuteur = setTimeout(ecrire, CARTON_RYTHME.fondu);
      const lettres = this.lettres;
      const titreVisible = this.titreVisible;
      function ecrire(): void {
        const n = lettres() + 1;
        if (n > phrase.length) {
          minuteur = setTimeout(() => titreVisible.set(true), phrase ? CARTON_RYTHME.avantTitre : 0);
          return;
        }
        lettres.set(n);
        minuteur = setTimeout(ecrire, cartonDelai(phrase[n - 1]));
      }
      onCleanup(() => clearTimeout(minuteur));
    });
  }
}
