import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {RegionCarteDialogData, RegionCarteDialogResult} from '../models/region-carte-dialog.model';
import {RegionCarteComponent} from './region-carte';

/**
 * Choisir une région sur la carte de Lémurie (`bol-region-carte`), la liste à côté, « Aucune » en tête ; survoler l'une allume
 * l'autre. Un clic choisit et ferme ; « Annuler » ou Échap ferme sans rien rendre. Au clavier, la liste fait le choix.
 */
@Component({
  selector: 'bol-region-carte-dialog',
  imports: [MatButtonModule, MatDialogModule, RegionCarteComponent],
  template: `
    <h2 mat-dialog-title>Choisir la région</h2>
    <mat-dialog-content class="rcd-contenu">
      <bol-region-carte
        class="rcd-carte"
        [regions]="data.regions"
        [choisie]="data.regionId"
        [survolee]="survolee()"
        (choisir)="choisir($event)"
        (survol)="survolee.set($event)"
      />
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
      <button mat-stroked-button type="button" (click)="annuler()">Annuler</button>
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
      flex: none;
      height: var(--rcd-hauteur);
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

  protected readonly survolee = signal<number | null>(null);

  protected choisir(regionId: number | null): void {
    this.ref.close(regionId);
  }

  /** Fermer sans valeur : la région reste ce qu'elle était (un `mat-dialog-close` nu rendrait `''`). */
  protected annuler(): void {
    this.ref.close();
  }
}

/** Ouvre la carte ; rend la région choisie (`null` pour « Aucune »), ou `undefined` si le dialogue est fermé sans choix. */
export function openRegionCarte(dialog: MatDialog, data: RegionCarteDialogData): Observable<RegionCarteDialogResult | undefined> {
  return dialog.open<RegionCarteDialogComponent, RegionCarteDialogData, RegionCarteDialogResult>(RegionCarteDialogComponent, {data, maxWidth: '96vw'}).afterClosed();
}
