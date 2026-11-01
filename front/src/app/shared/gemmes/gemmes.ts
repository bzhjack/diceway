import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/** Une rangée de gemmes : une par point, allumée s'il reste à dépenser. Le parent règle leur taille (`--gem-w`, `--gem-h`, `--gem-gap`) et, pour la
 * vilénie, leur couleur (`--gem-on`) ; il donne aussi son nom à la rangée, pour un lecteur d'écran. */
@Component({
  selector: 'dw-gemmes',
  template: `
    @for (allumee of gems(); track $index) {
      <i class="gem" [class.gem--on]="allumee"></i>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gem-gap, 0.2rem);
    }

    .gem {
      width: var(--gem-w, 0.75rem);
      height: var(--gem-h, 1rem);
      background: var(--dw-forge-gem-off);
      clip-path: polygon(50% 0, 100% 38%, 50% 100%, 0 38%);
    }

    .gem--on {
      background: var(--gem-on, var(--dw-forge-gem));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwGemmesComponent {
  readonly gems = input.required<readonly boolean[]>();
}
