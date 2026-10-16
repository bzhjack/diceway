import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {SceneActe} from '../../models/theatre.model';
import {SceneAmbianceComponent} from './scene-ambiance';
import {lieuTexte} from './theatre.util';

/** Le cartouche de la scène, en haut à gauche du plateau : où elle se joue, son titre en grand et son
 * ambiance. Annonce chaque nouvelle scène aux lecteurs d'écran (`aria-live`). */
@Component({
  selector: 'bol-scene-cartouche',
  imports: [MatIconModule, SceneAmbianceComponent],
  template: `
    @if (scene(); as scene) {
      @if (lieu() || acte()) {
        <p class="ctc-lieu">
          @if (lieu(); as lieu) {
            <mat-icon aria-hidden="true">place</mat-icon>
            <span>{{ lieu }}</span>
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
      color: var(--dw-color-legendary);
      font-size: 0.9rem;
      font-weight: 600;
      text-shadow: 0 1px 6px #000;

      .mat-icon {
        width: 1.1rem;
        height: 1.1rem;
        font-size: 1.1rem;
      }
    }

    .ctc-num {
      color: var(--dw-surface-700);
      font-weight: 400;
    }

    .ctc-titre {
      margin: 0 0 0.7rem;
      color: var(--dw-color-text-bright);
      font-family: 'Muse Display Harmony', serif;
      font-size: clamp(2rem, 4vw, 3.4rem);
      font-weight: 400;
      line-height: 1.02;
      text-shadow:
        0 2px 0 #000,
        0 6px 24px rgba(0, 0, 0, 0.85);
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
  readonly scene = input<BolSceneModel | null>(null);
  readonly regionNom = input<string | null>(null);
  /** L'acte en cours, s'il est dans la frise : « scène N sur M ». */
  readonly acte = input<SceneActe | null>(null);
  readonly total = input(0);

  protected readonly lieu = computed(() => {
    const scene = this.scene();
    return scene ? lieuTexte(scene.lieu, this.regionNom()) : null;
  });
}
