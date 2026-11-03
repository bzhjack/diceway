import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormField} from '@angular/forms/signals';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnFlowStore} from './turn-flow.store';

/** Le sort, à la place des armes sur la ligne de qui joue (livre p. 148-153) : pas de catalogue, le joueur décrit l'effet et le MJ le règle
 * — sa puissance (charme, 1er, 2e ou 3e cercle), sa difficulté, les conditions d'incantation remplies (chacune au-delà de la première
 * retire 1 point), s'il blesse, s'il agit sur l'esprit de la cible. Une fois lancé, il ne se règle plus. */
@Component({
  selector: 'bol-tas-sort-form',
  imports: [FormField, MatTooltipModule, DwValueStepperComponent],
  template: `
    @let saisie = loadout.sortModel();
    <div class="tas-bloc" role="group" aria-labelledby="tas-sort-titre">
      <div class="tas-cap">
        <span id="tas-sort-titre">Sort</span>
        <span class="tas-segm tas-segm--mini" role="group" aria-label="Ce qu’il fait de son action">
          <button type="button" class="tas-seg" [attr.aria-pressed]="false" [disabled]="flow.attaqueEngagee()" (click)="loadout.setMode('attaque')"><b>Attaque</b></button>
          <button type="button" class="tas-seg" [attr.aria-pressed]="true"><b>Sort</b></button>
        </span>
        <em [matTooltip]="'Coût en points de pouvoir : ' + loadout.sortCoutDetail()">{{ loadout.sortCout().total }} pts de pouvoir</em>
      </div>
      <div class="tas-sortf" [class.tas-off]="flow.sortLance()" [attr.inert]="flow.sortLance() ? '' : null">
        <span class="tas-segm tas-segm--mini" role="group" aria-label="Puissance du sort">
          @for (c of loadout.cercles; track c.cercle) {
            <button type="button" class="tas-seg" [attr.aria-pressed]="saisie.cercle === c.cercle" [matTooltip]="'Conditions : ' + c.conditions" (click)="loadout.setCercle(c.cercle)">
              <b>{{ c.label }}</b>
              <small>{{ c.cercle === 0 ? '1-2' : c.coutBase }} pts</small>
            </button>
          }
        </span>
        <span class="tas-range" role="group" aria-label="Difficulté du sort">
          <button type="button" class="tas-mini" aria-label="Plus facile" [disabled]="loadout.sortDifficultePremiere()" (click)="loadout.stepDifficulte(-1)">‹</button>
          <span
            class="tas-chip"
            aria-live="polite"
            [class.tas-sortf-hors]="!loadout.sortDifficulteHabituelle()"
            [matTooltip]="loadout.sortDifficulteHabituelle() ? 'Difficulté habituelle de cette puissance' : 'Hors des difficultés habituelles de cette puissance (livre p. 151)'"
          >
            {{ loadout.sortDifficulte().label }} <em>{{ loadout.sortDifficulte().valeur === null ? 'sans jet' : turn.signed(loadout.sortDifficulte().valeur ?? 0) }}</em>
          </span>
          <button type="button" class="tas-mini" aria-label="Plus difficile" [disabled]="loadout.sortDifficulteDerniere()" (click)="loadout.stepDifficulte(1)">›</button>
        </span>
        @if (saisie.cercle === 0) {
          <span class="tas-segm tas-segm--mini" role="group" aria-label="Coût du charme">
            <button type="button" class="tas-seg" [attr.aria-pressed]="saisie.coutCharme === 1" (click)="loadout.setCoutCharme(1)"><b>1 pt</b></button>
            <button type="button" class="tas-seg" [attr.aria-pressed]="saisie.coutCharme === 2" (click)="loadout.setCoutCharme(2)"><b>2 pts</b></button>
          </span>
        } @else {
          <span class="tas-sortf-cond" matTooltip="Conditions d’incantation remplies, la première comprise : chacune en plus retire 1 point, jusqu’au coût minimum">
            <dw-value-stepper [formField]="loadout.sortForm.conditions" ariaLabel="Conditions d’incantation remplies" />
            <small>conditions</small>
          </span>
        }
        <button type="button" class="tas-chip" [attr.aria-pressed]="saisie.blessant" [matTooltip]="'Le sort blesse sa cible : ' + loadout.sortDegats() + ', sans vigueur ni armure'" (click)="loadout.toggleSortBlessant()">Blesse</button>
        <button type="button" class="tas-chip" [attr.aria-pressed]="saisie.espritCible" matTooltip="Le sort agit sur l’esprit ou les perceptions de la cible : son esprit est un malus au jet (livre p. 148)" (click)="loadout.toggleSortEsprit()">Sur l’esprit</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasSortFormComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly flow = inject(TurnFlowStore);
}
