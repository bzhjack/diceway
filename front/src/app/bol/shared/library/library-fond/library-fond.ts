import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

/**
 * L'illustration d'une bibliothèque en tuiles : un fond fixe qui couvre l'écran, derrière la colonne et les tuiles. À poser dans la page,
 * hors de la colonne (collante, elle a son propre empilement : le fond passerait devant elle). Purement décoratif ; son style est dans
 * `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-fond',
  template: '',
  host: {
    class: 'dw-lr-fond',
    'aria-hidden': 'true',
    '[style.background-image]': 'fond()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryFondComponent {
  readonly image = input.required<string>();

  protected readonly fond = computed(() => `url('${this.image()}')`);
}
