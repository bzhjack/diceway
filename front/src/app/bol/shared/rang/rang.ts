import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RANG_LABELS} from '../library/library-rows-page.base';
import {LibraryRang} from '../models/library-rows.model';

/**
 * Le rang d'une fiche en pastille, à sa couleur : Rival en rouge, Coriace en or, Piétaille en bronze. Une seule taille, petite,
 * partout : les tuiles des bibliothèques et de la table, le casting, les cartes de « La distribution ».
 */
@Component({
  selector: 'bol-rang',
  template: `{{ libelle() }}`,
  host: {
    class: 'rng',
    '[class.rng--R]': "rang() === 'R'",
    '[class.rng--C]': "rang() === 'C'",
    '[class.rng--P]': "rang() === 'P'",
  },
  styles: `
    :host {
      display: inline-block;
      flex: none;
      padding: 0 0.25rem;
      border: 1px solid;
      border-radius: 4px;
      font-size: 0.55rem;
      font-weight: 800;
      line-height: 1.45;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    :host(.rng--R) {
      border-color: color-mix(in srgb, var(--dw-color-rival) 55%, transparent);
      background: color-mix(in srgb, var(--dw-color-rival) 15%, transparent);
      color: var(--dw-forge-alert);
    }

    :host(.rng--C) {
      border-color: color-mix(in srgb, var(--dw-color-legendary) 50%, transparent);
      background: color-mix(in srgb, var(--dw-color-legendary) 14%, transparent);
      color: var(--dw-forge-name);
    }

    :host(.rng--P) {
      border-color: var(--dw-forge-bronze-dim);
      color: var(--dw-forge-caption);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangComponent {
  readonly rang = input.required<LibraryRang>();

  protected readonly libelle = computed(() => RANG_LABELS[this.rang()]);
}
