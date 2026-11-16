import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Observable} from 'rxjs';
import {RegionCarteDialogData, RegionCarteDialogResult} from '../models/region-carte-dialog.model';
import {REGION_MAP_COORDINATES} from './region-map-coordinates';

/**
 * Choisir une région sur la carte de Lémurie : un point par région (son nom en infobulle), la liste à côté, « Aucune » en tête.
 * Un clic choisit et ferme. Les points ne sont que pour la souris : au clavier, la liste fait le même choix.
 */
@Component({
  selector: 'bol-region-carte-dialog',
  imports: [NgOptimizedImage, MatButtonModule, MatDialogModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>Choisir la région</h2>
    <mat-dialog-content class="rcd-contenu">
      <div class="rcd-carte">
        <img class="rcd-image" ngSrc="/assets/bol/cartes/carte.jpg" width="1137" height="1491" alt="Carte de Lémurie" />
        <div class="rcd-points" aria-hidden="true">
          @for (point of points; track point.id) {
            <button
              type="button"
              tabindex="-1"
              class="rcd-point"
              [class.rcd-point--choisi]="point.id === data.regionId"
              [class.rcd-point--survole]="point.id === survolee()"
              [style.left.%]="point.x"
              [style.top.%]="point.y"
              [matTooltip]="point.region"
              matTooltipPosition="above"
              (click)="choisir(point.id)"
              (mouseenter)="survolee.set(point.id)"
              (mouseleave)="survolee.set(null)"
            ></button>
          }
        </div>
      </div>
      <ul class="rcd-liste" aria-label="Régions">
        <li>
          <button type="button" class="rcd-ligne rcd-ligne--aucune" [attr.aria-pressed]="data.regionId === null" (click)="choisir(null)">Aucune</button>
        </li>
        @for (r of data.regions; track r.id) {
          <li>
            <button
              type="button"
              class="rcd-ligne"
              [class.rcd-ligne--survolee]="r.id === survolee()"
              [attr.aria-pressed]="r.id === data.regionId"
              (click)="choisir(r.id)"
              (mouseenter)="survolee.set(r.id)"
              (mouseleave)="survolee.set(null)"
              (focus)="survolee.set(r.id)"
              (blur)="survolee.set(null)"
            >
              {{ r.region }}
            </button>
          </li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Annuler</button>
    </mat-dialog-actions>
  `,
  styles: `
    // La carte tient dans la hauteur de l'écran de référence, sous le titre et les boutons ; la liste prend la même hauteur.
    :host {
      --rcd-hauteur: min(40rem, calc(90dvh - 9rem));
    }

    .rcd-contenu {
      display: flex;
      gap: 1rem;
      max-height: none;
    }

    .rcd-carte {
      position: relative;
      flex: none;
      height: var(--rcd-hauteur);
      aspect-ratio: 1137 / 1491;
      overflow: hidden;
      border: 1px solid var(--dw-forge-bronze);
      border-radius: 4px;
      background: var(--dw-forge-recess);
    }

    .rcd-image {
      display: block;
      width: 100%;
      height: 100%;
    }

    .rcd-point {
      position: absolute;
      width: 14px;
      height: 14px;
      padding: 0;
      border: 2px solid var(--dw-color-legendary-muted);
      border-radius: 50%;
      background: rgba(69, 26, 3, 0.65);
      transform: translate(-50%, -50%);
      cursor: pointer;
      transition:
        transform 120ms ease,
        background 120ms ease;

      &:hover {
        transform: translate(-50%, -50%) scale(1.4);
        border-color: var(--dw-forge-white);
      }
    }

    .rcd-point--survole {
      background: rgba(251, 191, 36, 0.85);
    }

    .rcd-point--choisi {
      border-color: var(--dw-region-pin-active);
      background: var(--dw-region-pin-active);
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.45);
      transform: translate(-50%, -50%) scale(1.3);
    }

    .rcd-liste {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 15.5rem;
      max-height: var(--rcd-hauteur);
      margin: 0;
      padding: 0 0.25rem 0 0;
      overflow-y: auto;
      list-style: none;
      scrollbar-width: thin;
    }

    .rcd-ligne {
      width: 100%;
      padding: 0.15rem 0.65rem;
      border: 1px solid transparent;
      border-radius: var(--dw-radius-toggle);
      background: transparent;
      color: var(--dw-forge-name);
      font: inherit;
      font-size: 0.82rem;
      line-height: 1.2;
      text-align: left;
      white-space: nowrap;
      cursor: pointer;

      &:hover,
      &:focus-visible {
        border-color: var(--dw-forge-bronze-dim);
        background: var(--dw-forge-recess);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 1px;
      }

      &[aria-pressed='true'] {
        border-color: var(--dw-color-legendary);
        background: color-mix(in srgb, var(--dw-color-legendary) 22%, transparent);
        color: var(--dw-color-text-bright);
        font-weight: 700;
      }
    }

    .rcd-ligne--survolee {
      border-color: var(--dw-forge-bronze-dim);
      background: var(--dw-forge-recess);
    }

    .rcd-ligne--aucune {
      color: var(--dw-forge-caption);
      font-style: italic;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegionCarteDialogComponent {
  protected readonly data = inject<RegionCarteDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<RegionCarteDialogComponent, RegionCarteDialogResult>>(MatDialogRef);

  /** Les régions proposées qui ont une place connue sur la carte. */
  protected readonly points = this.data.regions.flatMap((r) => {
    const position = REGION_MAP_COORDINATES[r.id];
    return position ? [{...r, ...position}] : [];
  });
  protected readonly survolee = signal<number | null>(null);

  protected choisir(regionId: number | null): void {
    this.ref.close(regionId);
  }
}

/** Ouvre la carte ; rend la région choisie (`null` pour « Aucune »), ou `undefined` si le dialogue est fermé sans choix. */
export function openRegionCarte(dialog: MatDialog, data: RegionCarteDialogData): Observable<RegionCarteDialogResult | undefined> {
  return dialog.open<RegionCarteDialogComponent, RegionCarteDialogData, RegionCarteDialogResult>(RegionCarteDialogComponent, {data, maxWidth: '96vw'}).afterClosed();
}
