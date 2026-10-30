import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {libellePoints} from '../../combat-attack.util';
import {heroismeGems} from '../../heroisme-spend.util';
import {TapisKind} from '../../models/tapis.model';

/** Les points d'héroïsme d'un héros, ou de vilénie d'un rival : une rangée de gemmes (dorées, ou rouges pour la vilénie) entre − et
 * +. Il ne fait qu'annoncer le pas (`stepped`) : le parent l'enregistre. À 0 point, − est grisé (`aria-disabled`, le focus reste). */
@Component({
  selector: 'bol-points-stepper',
  template: `
    <button
      type="button"
      class="pst-step"
      [attr.aria-label]="'Retirer ' + unPoint() + ' à ' + nom()"
      [attr.aria-disabled]="points() <= 0 ? 'true' : null"
      (click)="step(-1)"
    >
      −
    </button>
    <span class="pst-gemmes" role="img" [attr.aria-label]="libelle()">
      @for (allumee of gemmes(); track $index) {
        <i class="pst-gemme" [class.pst-gemme--on]="allumee"></i>
      }
    </span>
    <button type="button" class="pst-step" [attr.aria-label]="'Ajouter ' + unPoint() + ' à ' + nom()" (click)="step(1)">+</button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .pst-gemmes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.2rem;
    }

    .pst-gemme {
      width: 0.75rem;
      height: 1rem;
      background: var(--dw-forge-gem-off);
      clip-path: polygon(50% 0, 100% 38%, 50% 100%, 0 38%);
    }

    .pst-gemme--on {
      background: var(--dw-forge-gem);
    }

    // La vilénie, en braise : le pendant sombre des gemmes d'héroïsme.
    :host(.pst--vilenie) .pst-gemme--on {
      background: linear-gradient(160deg, #fca5a5, var(--dw-color-echec) 55%, #7f1d1d);
    }

    .pst-step {
      flex: none;
      width: 1.4rem;
      height: 1.4rem;
      padding: 0;
      border: 1px solid var(--dw-forge-bronze-dim);
      border-radius: 50%;
      background: var(--dw-forge-stud);
      box-shadow: var(--dw-forge-stud-shadow);
      color: var(--dw-forge-bronze-text);
      font: inherit;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;

      &:hover:not([aria-disabled='true']) {
        border-color: var(--dw-forge-hot);
        box-shadow: var(--dw-forge-stud-glow);
        color: var(--dw-forge-hot-text);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 1px;
      }

      &[aria-disabled='true'] {
        opacity: 0.35;
        cursor: default;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'[class.pst--vilenie]': "kind() !== 'hero'"},
})
export class PointsStepperComponent {
  /** Un héros a de l'héroïsme ; un rival (PNJ) de la vilénie. */
  readonly kind = input.required<TapisKind>();
  readonly points = input.required<number>();
  /** Le nom de la carte, pour les libellés des boutons. */
  readonly nom = input.required<string>();
  /** Un pas : −1 ou +1. */
  readonly stepped = output<number>();

  protected readonly gemmes = computed(() => heroismeGems(this.points()));
  protected readonly libelle = computed(() => libellePoints(this.kind(), this.points()));
  protected readonly unPoint = computed(() => libellePoints(this.kind(), 1));

  protected step(delta: number): void {
    if (delta < 0 && this.points() <= 0) {
      return;
    }
    this.stepped.emit(delta);
  }
}
