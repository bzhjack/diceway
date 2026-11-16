import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {CombatantAttitude} from '../../models/bol-fight-session.model';
import {ATTITUDES} from '../../session/play/theatre/theatre.util';
import {AttitudePuceComponent} from './attitude-puce';

/**
 * L'attitude d'un personnage qu'on règle d'un clic : sa pastille (`bol-attitude-puce`) dans un petit bouton rond, son nom en infobulle ;
 * le clic ouvre le menu des attitudes, « Sans attitude » au bout. Celle de la distribution d'« Ajouter des personnages » et des cartes de
 * « Préparer la scène ». Ne fait que dire l'attitude choisie (`choisie`).
 */
@Component({
  selector: 'bol-attitude-menu',
  imports: [AttitudePuceComponent, MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    <button
      type="button"
      class="atm-bouton"
      [attr.aria-label]="'Attitude de ' + nom() + ' : ' + label()"
      [matTooltip]="label()"
      matTooltipPosition="above"
      [matMenuTriggerFor]="menu"
    >
      <bol-attitude-puce [attitude]="attitude()" />
    </button>
    <mat-menu #menu="matMenu">
      @for (option of attitudes; track option.value) {
        <button mat-menu-item role="menuitemradio" [attr.aria-checked]="attitude() === option.value" (click)="choisie.emit(option.value)">
          <mat-icon>{{ option.icon }}</mat-icon>{{ option.label }}
        </button>
      }
      <button mat-menu-item role="menuitemradio" [attr.aria-checked]="attitude() === null" (click)="choisie.emit(null)">
        <mat-icon>remove</mat-icon>Sans attitude
      </button>
    </mat-menu>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    .atm-bouton {
      display: grid;
      place-items: center;
      width: 1.3rem;
      height: 1.3rem;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;

      &:hover bol-attitude-puce {
        transform: scale(1.25);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 2px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttitudeMenuComponent {
  readonly attitude = input.required<CombatantAttitude | null>();
  /** Le nom du personnage, pour le bouton : « Attitude de Loup : Hostile ». */
  readonly nom = input.required<string>();
  readonly choisie = output<CombatantAttitude | null>();

  protected readonly attitudes = ATTITUDES;
  protected readonly label = computed(() => ATTITUDES.find((a) => a.value === this.attitude())?.label ?? 'Sans attitude');
}
