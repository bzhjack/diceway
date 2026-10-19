import {NgOptimizedImage} from '@angular/common';
import {afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector, signal, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {CARTE_HD, positionSurCarteHd} from '../../../shared/region/region-map-coordinates';
import {CarteDialogData} from '../../models/carte-dialog.model';

/** La carte de Lémurie (HD, avec son cadre), ouverte depuis le lieu du cartouche : la région de la scène y est cerclée, le reste un
 * peu assombri. D'abord en vue d'ensemble (toute la carte dans la fenêtre) ; « Agrandir » la montre en taille réelle, centrée sur la
 * région, à faire défiler. */
@Component({
  selector: 'bol-carte-dialog',
  imports: [NgOptimizedImage, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Carte de Lémurie</h2>
    <mat-dialog-content class="crt-content">
      <div #vue class="crt-vue" [class.crt-vue--zoom]="zoom()">
        <div class="crt-carte" [style.--crt-x]="position.x + '%'" [style.--crt-y]="position.y + '%'">
          <img class="crt-image" [ngSrc]="carte.url" [width]="carte.largeur" [height]="carte.hauteur" [alt]="alt" />
          <span class="crt-repere" aria-hidden="true" [style.left.%]="position.x" [style.top.%]="position.y">
            <mat-icon>place</mat-icon>
          </span>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions class="crt-actions">
      <p class="crt-lieu"><mat-icon aria-hidden="true">place</mat-icon>{{ data.lieu }}</p>
      <button mat-stroked-button type="button" class="crt-zoom" (click)="basculerZoom()">
        <mat-icon>{{ zoomIcone() }}</mat-icon>
        {{ zoomLibelle() }}
      </button>
      <button mat-flat-button type="button" mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: `
    // Hauteur laissée à la carte : la fenêtre moins ses marges (les dialogues s'alignent à 5vh du haut, cf. _dialog.scss), le
    // titre et les boutons (sur deux lignes sur un téléphone).
    :host {
      --crt-hauteur: calc(90dvh - 9rem);

      @media (max-width: 40rem) {
        --crt-hauteur: calc(90dvh - 10.5rem);
      }
    }

    .crt-content {
      max-height: none;
    }

    // Vue d'ensemble : toute la carte, aussi grande que la fenêtre le permet.
    .crt-vue {
      width: min(calc(var(--crt-hauteur) * 1248 / 1741), 1248px, calc(96vw - 3rem));
      aspect-ratio: 1248 / 1741;
      overflow: hidden;
      border-radius: 4px;
      background: #000;
    }

    // Agrandie : la carte en taille réelle, à faire défiler.
    .crt-vue--zoom {
      width: min(1248px, calc(96vw - 3rem));
      height: min(1741px, var(--crt-hauteur));
      aspect-ratio: auto;
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(217, 164, 65, 0.35) transparent;

      .crt-carte {
        width: 1248px;
        height: 1741px;
      }
    }

    .crt-carte {
      position: relative;
      width: 100%;
      height: 100%;

      // Le reste de la carte un peu assombri : la région de la scène ressort.
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(18% 12.9% at var(--crt-x) var(--crt-y), transparent 45%, rgba(0, 0, 0, 0.5));
        pointer-events: none;
      }
    }

    .crt-image {
      display: block;
      width: 100%;
      height: 100%;
    }

    // Le cercle autour de l'étiquette de la région (la taille suit celle de la carte), et l'épingle au-dessus.
    .crt-repere {
      position: absolute;
      z-index: 1;
      width: 9%;
      aspect-ratio: 1;
      border: 2px solid var(--dw-color-legendary);
      border-radius: 50%;
      box-shadow:
        0 0 0 2px rgba(0, 0, 0, 0.55),
        0 0 1.2rem rgba(217, 164, 65, 0.75);
      transform: translate(-50%, -50%);
      animation: crt-pulse 2.4s ease-in-out infinite;

      .mat-icon {
        position: absolute;
        bottom: 100%;
        left: 50%;
        color: var(--dw-color-legendary);
        filter: drop-shadow(0 1px 2px #000);
        transform: translateX(-50%);
      }
    }

    @keyframes crt-pulse {
      50% {
        box-shadow:
          0 0 0 2px rgba(0, 0, 0, 0.55),
          0 0 2.2rem rgba(217, 164, 65, 0.95);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .crt-repere {
        animation: none;
      }
    }

    .crt-lieu {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
      margin: 0 auto 0 0;
      color: var(--dw-color-legendary);
      font-weight: 600;

      .mat-icon {
        flex: none;
        width: 1.1rem;
        height: 1.1rem;
        font-size: 1.1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarteDialogComponent {
  protected readonly data = inject<CarteDialogData>(MAT_DIALOG_DATA);
  private readonly injector = inject(Injector);
  private readonly vue = viewChild.required<ElementRef<HTMLElement>>('vue');

  protected readonly carte = CARTE_HD;
  protected readonly position = positionSurCarteHd(this.data.point);
  protected readonly alt = `Carte de Lémurie, où un cercle marque le lieu de la scène : ${this.data.lieu}`;
  protected readonly zoom = signal(false);
  protected readonly zoomIcone = computed(() => (this.zoom() ? 'zoom_out_map' : 'zoom_in'));
  protected readonly zoomLibelle = computed(() => (this.zoom() ? 'Vue d’ensemble' : 'Agrandir'));

  /** Agrandie, la carte défile d'emblée jusqu'à la région, au milieu de la vue. */
  protected basculerZoom(): void {
    this.zoom.update((zoom) => !zoom);
    if (!this.zoom()) {
      return;
    }
    afterNextRender(
      {
        write: () => {
          const vue = this.vue().nativeElement;
          vue.scrollLeft = (this.position.x / 100) * CARTE_HD.largeur - vue.clientWidth / 2;
          vue.scrollTop = (this.position.y / 100) * CARTE_HD.hauteur - vue.clientHeight / 2;
        },
      },
      {injector: this.injector},
    );
  }
}

/** Ouvre la carte, la région de la scène cerclée. */
export function openCarte(dialog: MatDialog, data: CarteDialogData): void {
  dialog.open(CarteDialogComponent, {data, maxWidth: '96vw'});
}
