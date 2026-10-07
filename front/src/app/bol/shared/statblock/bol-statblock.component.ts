import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';
import {BolStatblockData} from '../models/bol-statblock.model';

/** Statbloc générique BoL : bande vitale colorée → tuiles neutres → listes. */
@Component({
  selector: 'bol-statblock',
  imports: [MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './bol-statblock.component.html',
  styleUrl: './bol-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolStatblockComponent {
  readonly data = input.required<BolStatblockData>();
  readonly imageSrc = input.required<string>();
  /** Page à laquelle revenir après édition (ex. la session de combat en cours) — `null` si sans objet. */
  readonly returnUrl = input<string | null>(null);
  /** Sans l'avatar ni le titre : quand le statbloc est posé sous un bandeau qui les porte déjà (carte dépliée du tapis). */
  readonly hideIdentity = input(false);

  protected navigationState(): Record<string, string> | undefined {
    const returnUrl = this.returnUrl();
    return returnUrl ? {returnUrl} : undefined;
  }
}
