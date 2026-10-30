import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {armeFamille} from './arme-icon.util';

/** Le symbole d'une arme, reconnu à son nom : un pictogramme au trait, de la couleur du texte, décoratif (le nom est porté à côté). */
@Component({
  selector: 'dw-arme-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'aria-hidden': 'true', class: 'dw-arme-icon'},
  styles: `
    :host {
      display: inline-block;
      width: 1.5rem;
      height: 1.5rem;
      flex: none;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  template: `
    <svg viewBox="0 0 24 24" focusable="false">
      @switch (famille()) {
        @case ('epee') {
          <path d="M20.5 3.5v3.5L10 17.5 6.5 14 17 3.5z" />
          <path d="M5 12.5l6.5 6.5M8.2 15.8 4.2 19.8" />
          <circle cx="3.6" cy="20.4" r="1" />
        }
        @case ('dague') {
          <path d="M10.5 13.5C12 9 15 6.5 19.5 4.5 17.5 9 15 12 10.5 13.5z" />
          <path d="M7.5 10.5l6 6M10.5 13.5l-4.7 4.7" />
          <circle cx="5" cy="19" r="1.2" />
        }
        @case ('hache') {
          <path d="M8 3v18" />
          <path d="M8 5.5Q12.5 6.5 16.5 3q3 6.5 0 13Q12.5 12.5 8 13.5z" />
        }
        @case ('lance') {
          <path d="M3 21 15.5 8.5" />
          <path d="M15.5 8.5l1.25-4.25L21 3l-1.25 4.25z" />
          <path d="M12.5 9.5l2 2" />
        }
        @case ('masse') {
          <path d="M4 20l7.4-7.4" />
          <circle cx="14.5" cy="9.5" r="4" />
          <path d="M14.5 2.8v2.7M21.2 9.5h-2.7M19.2 4.8l-1.9 1.9M19.2 14.2l-1.9-1.9M9.8 4.8l1.9 1.9" />
        }
        @case ('baton') {
          <path d="M4.5 19.5l15-15" stroke-width="2.4" />
          <path d="M15.6 6.4l2 2M6.4 15.6l2 2" />
        }
        @case ('arc') {
          <path d="M7 3q14 9 0 18" />
          <path d="M7 3v18" />
          <path d="M2.5 12H19M16 9.5l3 2.5-3 2.5" />
        }
        @case ('arbalete') {
          <path d="M12 3v18" />
          <path d="M3 10q9-6 18 0" />
          <path d="M3 10l9 4 9-4" />
          <path d="M10 5.5 12 3l2 2.5" />
        }
        @case ('fronde') {
          <circle cx="6" cy="3.5" r="1.2" />
          <path d="M6.4 4.7 10 15M18 3l-4 12" />
          <path d="M9 15q3 4.5 6 0" />
          <circle cx="12" cy="14.3" r="1.8" />
        }
        @case ('poing') {
          <path d="M5 11V8.5a1.75 1.75 0 0 1 3.5 0V11M8.5 10V7a1.75 1.75 0 0 1 3.5 0v3M12 10V7a1.75 1.75 0 0 1 3.5 0v3" />
          <path d="M15.5 9.5a1.75 1.75 0 0 1 3.5 0V14c0 3.6-2.4 6-6 6h-2c-3.6 0-6-2.4-6-6v-3" />
          <path d="M5 12h6.5a1.75 1.75 0 0 1 0 3.5H9.5" />
        }
        @case ('morsure') {
          <path d="M3 7q9-5 18 0M3 17q9 5 18 0" />
          <path d="M5 7.3 7 11.5l2-3.6L12 13l3-5.1 2 3.6 2-4.2" />
          <path d="M6 16.7l2-3.2 2 3.6 2-3.6 2 3.6 2-3.6 2 3.2" />
        }
        @case ('improvisee') {
          <path d="M10 2.5h4V7l2 3v10a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V10l2-3z" />
          <path d="M8 13h8" />
        }
        @default {
          <path d="M4 4l11 11M20 4 9 15" />
          <path d="M13 17l4-4M7 13l4 4M16 16l4 4M8 16l-4 4" />
        }
      }
    </svg>
  `,
})
export class DwArmeIconComponent {
  /** Le nom de l'arme, tel qu'en fiche. */
  readonly nom = input<string | null | undefined>(null);
  protected readonly famille = computed(() => armeFamille(this.nom()));
}
