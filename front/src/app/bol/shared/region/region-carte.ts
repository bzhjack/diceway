import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RegionCarteChoix} from '../models/region-carte.model';
import {REGION_MAP_COORDINATES} from './region-map-coordinates';

/**
 * La carte de Lémurie, un point par région (son nom en infobulle) : la région choisie en rouge, la survolée allumée.
 * Un clic sur un point dit la région (`choisir`), le survol aussi (`survol`), pour que la liste d'à côté s'allume avec.
 * Les points sont hors de l'ordre de tabulation : au clavier, c'est la liste du dialogue qui choisit.
 * La taille vient du parent : la largeur (la hauteur suit), ou la hauteur (la largeur suit).
 */
@Component({
  selector: 'bol-region-carte',
  imports: [NgOptimizedImage, MatTooltipModule],
  template: `
    <img class="rca-image" ngSrc="/assets/bol/cartes/carte.jpg" width="1137" height="1491" alt="Carte de Lémurie" />
    @for (point of points(); track point.id) {
      <button
        type="button"
        tabindex="-1"
        class="rca-point"
        [class.rca-point--choisi]="point.id === choisie()"
        [class.rca-point--survole]="point.id === survolee()"
        [style.left.%]="point.x"
        [style.top.%]="point.y"
        [matTooltip]="point.region"
        matTooltipPosition="above"
        [attr.aria-label]="'Choisir la région ' + point.region"
        (click)="choisir.emit(point.id)"
        (mouseenter)="survol.emit(point.id)"
        (mouseleave)="survol.emit(null)"
      ></button>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      aspect-ratio: 1137 / 1491;
      overflow: hidden;
      border: 1px solid var(--dw-forge-bronze);
      border-radius: 4px;
      background: var(--dw-forge-recess);
    }

    .rca-image {
      display: block;
      width: 100%;
      height: 100%;
    }

    .rca-point {
      position: absolute;
      z-index: 1;
      width: 14px;
      height: 14px;
      padding: 0;
      border: 2px solid var(--dw-color-legendary-muted);
      border-radius: 50%;
      background: color-mix(in srgb, var(--dw-forge-recess) 70%, transparent);
      transform: translate(-50%, -50%);
      cursor: pointer;
      transition:
        transform 120ms ease,
        background 120ms ease,
        border-color 120ms ease;

      &:hover {
        border-color: var(--dw-forge-white);
        transform: translate(-50%, -50%) scale(1.4);
      }
    }

    .rca-point--survole {
      background: color-mix(in srgb, var(--dw-color-legendary) 85%, transparent);
    }

    .rca-point--choisi {
      border-color: var(--dw-region-pin-active);
      background: var(--dw-region-pin-active);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--dw-forge-recess) 45%, transparent);
      transform: translate(-50%, -50%) scale(1.3);

      &:hover {
        transform: translate(-50%, -50%) scale(1.5);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegionCarteComponent {
  readonly regions = input.required<readonly RegionCarteChoix[]>();
  /** La région choisie (son id), ou rien. */
  readonly choisie = input<number | null>(null);
  /** La région survolée, ici ou dans la liste d'à côté. */
  readonly survolee = input<number | null>(null);
  readonly choisir = output<number>();
  readonly survol = output<number | null>();

  /** Les régions qui ont une place connue sur la carte. */
  protected readonly points = computed(() =>
    this.regions().flatMap((r) => {
      const position = REGION_MAP_COORDINATES[Number(r.id)];
      return position ? [{id: r.id, region: r.region, ...position}] : [];
    }),
  );
}
