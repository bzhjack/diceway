import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {QTY_MAX} from '../scene-form.util';

/**
 * Les réglages d'un personnage de la distribution, sur une ligne : un de moins, un de plus, puis son camp (Adversaire, Allié) calé à
 * droite. Les mêmes dans « Ajouter des personnages » et sur les cartes de « Préparer la scène ». Ne fait que dire le réglage (`regle`).
 */
@Component({
  selector: 'bol-perso-reglages',
  imports: [MatIconModule],
  template: `
    <button type="button" class="prg-rond" [attr.aria-label]="'Un ' + nom() + ' de moins'" [disabled]="qty() <= 1" (click)="regle.emit({qty: qty() - 1})">
      <mat-icon>remove</mat-icon>
    </button>
    <button type="button" class="prg-rond" [attr.aria-label]="'Un ' + nom() + ' de plus'" [disabled]="qty() >= qtyMax" (click)="regle.emit({qty: qty() + 1})">
      <mat-icon>add</mat-icon>
    </button>
    <span class="prg-camp" role="group" [attr.aria-label]="'Camp de ' + nom()">
      <button type="button" class="prg-camp-option prg-camp-option--adversaires" [attr.aria-pressed]="camp() === 'adversaires'" (click)="choisir('adversaires')">
        Adversaire
      </button>
      <button type="button" class="prg-camp-option prg-camp-option--heros" [attr.aria-pressed]="camp() === 'heros'" (click)="choisir('heros')">Allié</button>
    </span>
  `,
  styleUrl: './perso-reglages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersoReglagesComponent {
  readonly nom = input.required<string>();
  readonly qty = input.required<number>();
  readonly camp = input.required<CombatCamp>();
  readonly regle = output<Partial<Pick<BolSceneDistributionSaisie, 'qty' | 'camp'>>>();

  protected readonly qtyMax = QTY_MAX;

  protected choisir(camp: CombatCamp): void {
    if (camp !== this.camp()) {
      this.regle.emit({camp});
    }
  }
}
