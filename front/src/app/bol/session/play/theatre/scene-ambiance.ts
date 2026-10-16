import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {SceneMeteo, SceneMoment} from '../../../models/bol-scene.model';
import {METEOS, MOMENTS} from './theatre.util';

const NIVEAUX = [1, 2, 3, 4] as const;

/** Les puces d'ambiance d'une scène : moment, météo et danger (quatre crânes, allumés jusqu'au niveau).
 * Rien n'est rendu si la scène n'en a aucune. */
@Component({
  selector: 'bol-scene-ambiance',
  imports: [MatIconModule],
  template: `
    @if (momentOption(); as moment) {
      <span class="amb-puce"><mat-icon aria-hidden="true">{{ moment.icon }}</mat-icon>{{ moment.label }}</span>
    }
    @if (meteoOption(); as meteo) {
      <span class="amb-puce"><mat-icon aria-hidden="true">{{ meteo.icon }}</mat-icon>{{ meteo.label }}</span>
    }
    @if (danger(); as niveau) {
      <span class="amb-puce" role="img" [attr.aria-label]="'Danger ' + niveau + ' sur 4'">
        Danger
        <span class="amb-cranes" aria-hidden="true">
          @for (n of niveaux; track n) {
            <mat-icon svgIcon="skull" [class.amb-crane--on]="n <= niveau" />
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
      border: 1px solid rgba(217, 164, 65, 0.35);
      border-radius: 999px;
      background: rgba(15, 10, 6, 0.62);
      color: var(--dw-surface-800);
      font-size: 0.82rem;
      line-height: 1.4;

      .mat-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
        color: var(--dw-color-legendary);
      }
    }

    .amb-cranes {
      display: inline-flex;
      gap: 0.05rem;

      .mat-icon {
        color: rgba(241, 230, 208, 0.22);
      }

      .amb-crane--on {
        color: var(--dw-color-echec);
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
  protected readonly momentOption = computed(() => MOMENTS.find((m) => m.value === this.moment()) ?? null);
  protected readonly meteoOption = computed(() => METEOS.find((m) => m.value === this.meteo()) ?? null);
}
