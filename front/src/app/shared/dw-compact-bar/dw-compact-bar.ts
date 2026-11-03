import {ChangeDetectionStrategy, Component, effect, input, signal} from '@angular/core';

/**
 * Une barre fine, collée en haut de l'écran, qui remplace l'en-tête d'une page une fois qu'il est sorti de l'écran :
 * un titre court à gauche, les boutons projetés à droite. Cachée, elle est inerte (ni focus ni lecteur d'écran). L'hôte ne prend aucune
 * place dans la page : seule la barre, fixe, se voit.
 */
@Component({
  selector: 'dw-compact-bar',
  template: `
    <div class="dw-cb" [class.dw-cb--visible]="visible()" [attr.inert]="visible() ? null : ''">
      <div class="dw-cb-contenu">
        <p class="dw-cb-titre">{{ titre() }}</p>
        <div class="dw-cb-actions">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styleUrl: './dw-compact-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwCompactBarComponent {
  /** L'en-tête que la barre remplace : elle paraît quand il est passé au-dessus de l'écran. `null` tant qu'il n'est pas affiché. */
  readonly watch = input.required<HTMLElement | null>();
  readonly titre = input.required<string>();

  protected readonly visible = signal(false);

  constructor() {
    // Toujours l'en-tête affiché : quand le gabarit est rendu à nouveau (le rechargement à chaud du serveur de développement), l'ancien
    // quitte la page et c'est le nouveau qu'on suit. Un en-tête hors de la page, ou plus bas que l'écran, n'est pas « sorti par le haut ».
    effect((onCleanup) => {
      const entete = this.watch();
      if (!entete || typeof IntersectionObserver === 'undefined') {
        this.visible.set(false);
        return;
      }
      const observateur = new IntersectionObserver(([entree]) =>
        this.visible.set(entree.target.isConnected && !entree.isIntersecting && entree.boundingClientRect.top < 0),
      );
      observateur.observe(entete);
      onCleanup(() => observateur.disconnect());
    });
  }
}
