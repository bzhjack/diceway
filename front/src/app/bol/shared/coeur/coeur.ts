import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Le cœur de la vitalité, dessiné comme sur la fiche : sa valeur posée dedans, en blanc cerné de noir, un peu basse (au milieu du ventre
 * du cœur) ; plus sombre quand la vitalité est basse, gris à terre ; vide sans valeur (le cœur d'un groupe, qui ouvre le détail).
 * Il ne fait que montrer : le parent dit ce qu'il est (`role="img"` et `aria-label`, ou le bouton qui le porte) et règle sa taille par
 * `--coeur-largeur`, `--coeur-hauteur` et `--coeur-chiffre`.
 */
@Component({
  selector: 'bol-coeur',
  template: `
    @if (valeur() !== null) {
      <b aria-hidden="true">{{ valeur() }}</b>
    }
  `,
  host: {
    '[class.coeur--bas]': "etat() === 'basse'",
    '[class.coeur--tombe]': "etat() === 'tombe'",
  },
  styleUrl: './coeur.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoeurComponent {
  /** Ce qui s'écrit dans le cœur (la vitalité, « — » si elle est inconnue) ; null : un cœur vide. */
  readonly valeur = input<number | string | null>(null);
  readonly etat = input<'basse' | 'tombe' | null>(null);
}
