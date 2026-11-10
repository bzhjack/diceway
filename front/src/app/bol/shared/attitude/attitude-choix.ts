import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {CombatantAttitude} from '../../models/bol-fight-session.model';
import {ATTITUDES} from '../../session/play/theatre/theatre.util';

/** Les quatre attitudes envers les héros, en boutons bascule (une pastille de couleur, puis le nom) ; un nouveau clic sur l'attitude
 * choisie l'efface. Ne fait que dire le choix (`choisie`) : la carte dépliée de la table l'enregistre aussitôt, « Préparer la scène »
 * le garde pour la scène. */
@Component({
  selector: 'bol-attitude-choix',
  template: `
    <div class="atp-choix" role="group" [attr.aria-label]="label()" [attr.aria-labelledby]="labelledBy()">
      @for (option of options; track option.value) {
        <button
          type="button"
          [class]="'atp-option atp-option--' + option.value"
          [attr.aria-pressed]="attitude() === option.value"
          (click)="choisir(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .atp-choix {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .atp-option {
      --atp-couleur: var(--dw-surface-500);

      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.55rem 0.2rem 0.4rem;
      border: 1px solid var(--dw-forge-bronze-edge);
      border-radius: var(--dw-radius-toggle);
      background: var(--dw-forge-recess);
      box-shadow: var(--dw-forge-recess-shadow);
      color: var(--dw-surface-700);
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;

      &::before {
        content: '';
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: var(--atp-couleur);
      }

      &[aria-pressed='true'] {
        border-color: var(--atp-couleur);
        background: color-mix(in srgb, var(--atp-couleur) 18%, var(--dw-forge-recess));
        color: var(--dw-color-text-bright);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 2px;
      }

      &[aria-disabled='true'] {
        cursor: progress;
      }
    }

    .atp-option--hostile {
      --atp-couleur: var(--dw-color-echec);
    }

    .atp-option--mefiant {
      --atp-couleur: var(--dw-color-warn);
    }

    .atp-option--amical {
      --atp-couleur: var(--dw-color-reussite);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttitudeChoixComponent {
  readonly attitude = input<CombatantAttitude | null>(null);
  /** Le nom du groupe pour un lecteur d'écran, à défaut d'un titre visible (`labelledBy`). */
  readonly label = input<string | null>(null);
  readonly labelledBy = input<string | null>(null);
  /** L'attitude choisie, ou null quand l'attitude déjà choisie est cliquée de nouveau. */
  readonly choisie = output<CombatantAttitude | null>();

  protected readonly options = ATTITUDES;

  protected choisir(value: CombatantAttitude): void {
    this.choisie.emit(this.attitude() === value ? null : value);
  }
}
