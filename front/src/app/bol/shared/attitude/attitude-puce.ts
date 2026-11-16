import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {CombatantAttitude} from '../../models/bol-fight-session.model';

/**
 * La pastille de l'attitude d'un personnage, toujours juste après son nom : un point à sa couleur (hostile rouge, méfiant orange,
 * neutre gris, amical vert), un cercle en pointillés sans attitude, une roue des quatre quand les exemplaires d'un groupe diffèrent.
 * Elle ne fait que montrer : le parent la met dans son bouton (menu, popover) et lui donne son nom (infobulle, `aria-label`).
 */
@Component({
  selector: 'bol-attitude-puce',
  template: '',
  host: {
    'aria-hidden': 'true',
    '[class]': "'apu apu--' + (attitude() ?? 'aucune')",
  },
  styles: `
    :host {
      --apu-couleur: var(--dw-forge-bronze-dim);

      display: inline-block;
      flex: none;
      width: 0.7rem;
      height: 0.7rem;
      box-sizing: border-box;
      border-radius: 50%;
      background: var(--apu-couleur);
      box-shadow: 0 0 6px color-mix(in srgb, var(--apu-couleur) 70%, transparent);
      transition: transform 0.12s ease;
    }

    :host(.apu--hostile) {
      --apu-couleur: var(--dw-color-echec);
    }

    :host(.apu--mefiant) {
      --apu-couleur: var(--dw-color-warn);
    }

    :host(.apu--neutre) {
      --apu-couleur: var(--dw-surface-500);
    }

    :host(.apu--amical) {
      --apu-couleur: var(--dw-color-reussite);
    }

    :host(.apu--aucune) {
      border: 2px dashed var(--dw-forge-caption);
      background: transparent;
      box-shadow: none;
    }

    :host(.apu--diverses) {
      background: conic-gradient(var(--dw-color-echec) 0 25%, var(--dw-color-warn) 0 50%, var(--dw-surface-500) 0 75%, var(--dw-color-reussite) 0);
      box-shadow: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttitudePuceComponent {
  /** L'attitude, `null` sans attitude, `'diverses'` pour un groupe dont les exemplaires diffèrent. */
  readonly attitude = input.required<CombatantAttitude | 'diverses' | null>();
}
