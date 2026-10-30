import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {REGION_MAP_COORDINATES} from '../../../shared/region/region-map-coordinates';
import {SceneActe} from '../../models/theatre.model';
import {openCarte} from './carte-dialog';
import {SceneAmbianceComponent} from './scene-ambiance';
import {lieuTexte} from './theatre.util';

/** Le cartouche de la scène, en haut à gauche du plateau : où elle se joue, son titre en grand et son
 * ambiance. Quand la région de la scène est placée sur la carte, un clic sur le lieu ouvre la carte de Lémurie,
 * la région cerclée. Annonce chaque nouvelle scène aux lecteurs d'écran (`aria-live`). */
@Component({
  selector: 'bol-scene-cartouche',
  imports: [MatIconModule, SceneAmbianceComponent],
  template: `
    @if (scene(); as scene) {
      @if (lieu() || acte()) {
        <p class="ctc-lieu">
          @if (lieu(); as lieu) {
            @if (point()) {
              <button type="button" class="ctc-lieu-carte" [attr.aria-label]="lieu + ' : voir sur la carte'" (click)="voirCarte()">
                <mat-icon svgIcon="gi-marker" aria-hidden="true" />
                <span class="ctc-lieu-texte">{{ lieu }}</span>
                <mat-icon class="ctc-lieu-icone" svgIcon="gi-map" aria-hidden="true" />
              </button>
            } @else {
              <mat-icon svgIcon="gi-marker" aria-hidden="true" />
              <span>{{ lieu }}</span>
            }
          }
          @if (acte(); as acte) {
            <span class="ctc-num">scène {{ acte.numero }} sur {{ total() }}</span>
          }
        </p>
      }
      <h2 class="ctc-titre">{{ scene.titre }}</h2>
      <bol-scene-ambiance [moment]="scene.moment" [meteo]="scene.meteo" [danger]="scene.danger" />
    } @else {
      <h2 class="ctc-titre">Aucune scène chargée</h2>
      <p class="ctc-aide">Choisis une scène dans la frise, ou fais entrer des personnages depuis les coulisses.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 46rem;
    }

    .ctc-lieu {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      margin: 0 0 0.25rem;
      color: var(--dw-forge-gold);
      font-size: 0.9rem;
      font-weight: 600;
      text-shadow: 0 0 3px #000, 0 1px 6px #000;

      .mat-icon {
        width: 1.1rem;
        height: 1.1rem;
        font-size: 1.1rem;
      }
    }

    // Le lieu, cliquable : il ouvre la carte.
    .ctc-lieu-carte {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin: -0.15rem -0.4rem;
      padding: 0.15rem 0.4rem;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-shadow: inherit;
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.45);

        .ctc-lieu-texte {
          text-decoration: underline dotted;
          text-underline-offset: 0.2em;
        }
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 1px;
      }
    }

    .ctc-lieu-icone {
      opacity: 0.75;
    }

    .ctc-num {
      color: var(--dw-forge-bone);
      font-weight: 400;
    }

    .ctc-titre {
      margin: 0 0 0.7rem;
      color: var(--dw-forge-bone);
      font-family: 'Muse Display Harmony', serif;
      font-size: calc(clamp(2rem, 4vw, 3.4rem) * var(--thr-k, 1));
      font-weight: 400;
      line-height: 1.02;
      text-shadow:
        0 2px 0 #000,
        0 6px 24px rgba(0, 0, 0, 0.85),
        0 0 30px rgba(232, 135, 58, 0.3);
    }

    .ctc-aide {
      max-width: 30rem;
      margin: 0;
      color: var(--dw-surface-700);
      font-size: 1rem;
      line-height: 1.5;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'aria-live': 'polite'},
})
export class SceneCartoucheComponent {
  private readonly dialog = inject(MatDialog);

  readonly scene = input<BolSceneModel | null>(null);
  readonly regionNom = input<string | null>(null);
  /** L'acte en cours, s'il est dans la frise : « scène N sur M ». */
  readonly acte = input<SceneActe | null>(null);
  readonly total = input(0);

  protected readonly lieu = computed(() => {
    const scene = this.scene();
    return scene ? lieuTexte(scene.lieu, this.regionNom()) : null;
  });
  /** Le point de la région de la scène sur la carte ; `null` sans région, ou pour une région non placée. */
  protected readonly point = computed(() => {
    const regionId = this.scene()?.region_id;
    return regionId != null ? (REGION_MAP_COORDINATES[regionId] ?? null) : null;
  });

  protected voirCarte(): void {
    const lieu = this.lieu();
    const point = this.point();
    if (lieu && point) {
      openCarte(this.dialog, {lieu, point});
    }
  }
}
