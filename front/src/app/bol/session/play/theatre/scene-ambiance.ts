import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {SceneMeteo, SceneMoment} from '../../../models/bol-scene.model';
import {METEOS, MOMENTS} from './theatre.util';

const NIVEAUX = [1, 2, 3, 4] as const;

/** L'icône de chaque moment et de chaque temps, dans le style de la table. */
const ICONES: Record<SceneMoment | SceneMeteo, string> = {
  aube: 'gi-sunrise',
  jour: 'gi-sun',
  crepuscule: 'gi-sunset',
  nuit: 'gi-night',
  clair: 'gi-sun',
  couvert: 'gi-cloud',
  pluie: 'gi-rain',
  brume: 'gi-fog',
  vent: 'gi-wind',
  orage: 'gi-storm',
  cendres: 'gi-ashes',
};

/** Les puces d'ambiance d'une scène : moment, météo et danger (quatre crânes, allumés jusqu'au niveau).
 * Rien n'est rendu si la scène n'en a aucune. */
@Component({
  selector: 'bol-scene-ambiance',
  imports: [MatIconModule],
  template: `
    @if (momentOption(); as moment) {
      <span class="amb-puce"><mat-icon [svgIcon]="icones[moment.value]" aria-hidden="true" />{{ moment.label }}</span>
    }
    @if (meteoOption(); as meteo) {
      <span class="amb-puce"><mat-icon [svgIcon]="icones[meteo.value]" aria-hidden="true" />{{ meteo.label }}</span>
    }
    @if (danger(); as niveau) {
      <span class="amb-puce" role="img" [attr.aria-label]="'Danger ' + niveau + ' sur 4'">
        Danger
        <span class="amb-cranes" aria-hidden="true">
          @for (n of niveaux; track n) {
            <mat-icon svgIcon="gi-skull" [class.amb-crane--on]="n <= niveau" />
          }
        </span>
      </span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .amb-puce {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.65rem 0.2rem 0.5rem;
      border: 1px solid var(--dw-forge-bronze-dim);
      border-radius: 999px;
      background: rgba(10, 6, 4, 0.78);
      box-shadow:
        inset 0 1px 0 rgba(255, 214, 160, 0.14),
        0 2px 5px rgba(0, 0, 0, 0.55);
      color: var(--dw-surface-800);
      font-size: 0.82rem;
      line-height: 1.4;

      .mat-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
        color: var(--dw-forge-gold);
      }
    }

    .amb-cranes {
      display: inline-flex;
      gap: 0.05rem;

      .mat-icon {
        color: var(--dw-forge-gem-off);
      }

      .amb-crane--on {
        color: var(--dw-forge-verdict-echec);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneAmbianceComponent {
  readonly moment = input<SceneMoment | null>(null);
  readonly meteo = input<SceneMeteo | null>(null);
  readonly danger = input<number | null>(null);

  protected readonly niveaux = NIVEAUX;
  protected readonly icones = ICONES;
  protected readonly momentOption = computed(() => MOMENTS.find((m) => m.value === this.moment()) ?? null);
  protected readonly meteoOption = computed(() => METEOS.find((m) => m.value === this.meteo()) ?? null);
}
