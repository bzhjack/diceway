import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/** Une face de d6 à plat : un carré rouge et ses points (1 à 6). Sa taille suit `--dw-die-size` (4rem par défaut). `dropped` l'estompe :
 * un dé écarté par un dé de bonus ou de malus. Décoratif : le total est dit ailleurs. */
@Component({
  selector: 'dw-die-face',
  template: `
    @for (pip of pips; track pip) {
      <i></i>
    }
  `,
  styleUrl: './die-face.scss',
  host: {
    'aria-hidden': 'true',
    '[attr.data-v]': 'value()',
    '[class.dw-die-face--drop]': 'dropped()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwDieFaceComponent {
  readonly value = input.required<number>();
  readonly dropped = input(false);
  protected readonly pips = [1, 2, 3, 4, 5, 6, 7, 8, 9];
}
